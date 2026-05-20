"""
Testes unitários do JIS — Serviço de ML
Cobertura: ScoringEngine e MLPredictor
"""
import pytest
import pandas as pd
from datetime import datetime, timedelta, timezone

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scoring.motor import ScoringEngine
from ml.preditor import MLPredictor


# ─────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────

@pytest.fixture
def motor():
    """Instância do motor de pontuação"""
    return ScoringEngine()


@pytest.fixture
def vaga_java_remota():
    """Vaga Java remota com salário informado — caso ideal"""
    return {
        "title": "Desenvolvedor Java Junior",
        "description": "Java, Spring Boot, PostgreSQL, API REST",
        "techs": ["Java", "Spring Boot", "PostgreSQL"],
        "remote": True,
        "hybrid": False,
        "salary_informed": True,
        "location": "",
        "published_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
    }


@pytest.fixture
def preditor_treinado():
    """MLPredictor já treinado com dados sintéticos"""
    preditor = MLPredictor()
    dados = pd.DataFrame({
        "is_remote": [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
        "salary_informed": [1, 0, 1, 0, 1, 0, 0, 1, 0, 1],
        "has_java": [1, 0, 1, 0, 1, 1, 0, 0, 0, 1],
        "has_python": [1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        "has_react": [1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
        "has_ml_skills": [1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        "level_match": [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
        "tech_match_score": [8, 2, 7, 1, 9, 6, 2, 5, 1, 8],
        "glassdoor_score": [4.2, 3.1, 4.0, 2.9, 4.5, 3.8, 3.0, 4.1, 2.8, 4.3],
        "days_since_published": [1, 45, 3, 60, 1, 5, 30, 2, 90, 1],
        "got_response": [1, 0, 1, 0, 1, 1, 0, 0, 0, 1],
    })
    preditor.train(dados)
    return preditor


# ─────────────────────────────────────────────
# TESTES DO MOTOR DE PONTUAÇÃO
# ─────────────────────────────────────────────

class TestScoringEngine:

    def test_vaga_java_remota_tem_score_alto(self, motor, vaga_java_remota):
        """Vaga Java remota com salário deve ter score alto"""
        resultado = motor.calculate(vaga_java_remota)
        assert resultado["score_rules"] > 7.0

    def test_tecnologias_incompativeis_penalizam_score(self, motor):
        """Stack .NET e C# devem reduzir o score"""
        vaga = {
            "title": "Desenvolvedor .NET Sênior",
            "description": "C#, .NET, Azure",
            "techs": [".NET", "C#"],
            "remote": False,
            "location": "São Paulo",
            "salary_informed": False,
            "published_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat(),
        }
        resultado = motor.calculate(vaga)
        assert resultado["score_rules"] < 3.0

    def test_salario_informado_adiciona_dois_pontos(self, motor, vaga_java_remota):
        """Salário informado deve adicionar exatamente 2 pontos"""
        vaga_com_salario = {**vaga_java_remota, "salary_informed": True}
        vaga_sem_salario = {**vaga_java_remota, "salary_informed": False}

        score_com = motor.calculate(vaga_com_salario)["score_rules"]
        score_sem = motor.calculate(vaga_sem_salario)["score_rules"]

        assert score_com - score_sem == pytest.approx(2.0, abs=0.1)
        assert motor.calculate(vaga_com_salario)["breakdown"]["salary"] == 2.0
        assert motor.calculate(vaga_sem_salario)["breakdown"]["salary"] == 0.0

    def test_vaga_nova_recebe_bonus_de_timing(self, motor, vaga_java_remota):
        """Vaga publicada há menos de 24h deve receber bônus de timing"""
        vaga_nova = {**vaga_java_remota,
                     "published_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()}
        vaga_antiga = {**vaga_java_remota,
                       "published_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()}

        timing_nova = motor.calculate(vaga_nova)["breakdown"]["timing"]
        timing_antiga = motor.calculate(vaga_antiga)["breakdown"]["timing"]

        assert timing_nova > timing_antiga
        assert timing_nova == 2.0
        assert timing_antiga == -1.0

    def test_remoto_pontua_mais_que_hibrido(self, motor, vaga_java_remota):
        """Trabalho remoto deve pontuar mais do que híbrido"""
        remoto = {**vaga_java_remota, "remote": True, "hybrid": False}
        hibrido = {**vaga_java_remota, "remote": False, "hybrid": True}

        assert motor.calculate(remoto)["breakdown"]["work_mode"] == 3.0
        assert motor.calculate(hibrido)["breakdown"]["work_mode"] == 1.0

    def test_presencial_fora_de_bauru_penaliza(self, motor, vaga_java_remota):
        """Vaga presencial fora de Bauru deve receber penalidade"""
        vaga = {**vaga_java_remota, "remote": False, "hybrid": False, "location": "São Paulo, SP"}
        resultado = motor.calculate(vaga)
        assert resultado["breakdown"]["work_mode"] == -3.0

    def test_presencial_em_bauru_nao_penaliza(self, motor, vaga_java_remota):
        """Vaga presencial em Bauru não deve receber penalidade"""
        vaga = {**vaga_java_remota, "remote": False, "hybrid": False, "location": "Bauru, SP"}
        resultado = motor.calculate(vaga)
        assert resultado["breakdown"]["work_mode"] == 0.0

    @pytest.mark.parametrize("nivel,esperado_positivo", [
        ("junior", True),
        ("jr", True),
        ("pleno", True),
        ("entry level", True),
        ("senior", False),
        ("sênior", False),
        ("especialista", False),
    ])
    def test_deteccao_de_nivel(self, motor, vaga_java_remota, nivel, esperado_positivo):
        """Motor deve detectar o nível da vaga corretamente"""
        vaga = {**vaga_java_remota, "title": f"Desenvolvedor {nivel}"}
        resultado = motor.calculate(vaga)
        pontos_nivel = resultado["breakdown"]["level"]

        if esperado_positivo:
            assert pontos_nivel >= 0
        else:
            assert pontos_nivel < 0

    def test_score_nunca_negativo(self, motor):
        """Score final nunca deve ser negativo, mesmo no pior cenário"""
        pior_caso = {
            "title": "Arquiteto .NET Sênior",
            "description": "C#, .NET, Kubernetes, TOTVS AGRO, Delphi",
            "techs": [".NET", "C#", "Kubernetes"],
            "remote": False,
            "hybrid": False,
            "location": "Curitiba, PR",
            "salary_informed": False,
            "published_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat(),
        }
        resultado = motor.calculate(pior_caso)
        assert resultado["score_rules"] >= 0.0

    def test_stack_python_ml_tem_pontuacao_extra(self, motor, vaga_java_remota):
        """Stack Python + ML deve ter pontuação de tecnologias alta"""
        vaga = {
            **vaga_java_remota,
            "title": "Analista de Dados Junior",
            "description": "Python, machine learning, scikit-learn, NLP, pandas, xgboost",
            "techs": ["Python", "scikit-learn", "NLP", "pandas"],
        }
        resultado = motor.calculate(vaga)
        assert resultado["breakdown"]["techs"] >= 8.0

    def test_detalhamento_contem_todas_as_chaves(self, motor, vaga_java_remota):
        """Detalhamento deve conter todas as chaves esperadas"""
        resultado = motor.calculate(vaga_java_remota)
        chaves_esperadas = {"techs", "level", "work_mode", "salary", "timing"}
        assert chaves_esperadas.issubset(resultado["breakdown"].keys())

    def test_published_at_nulo_retorna_timing_zero(self, motor, vaga_java_remota):
        """Quando published_at é None, timing deve ser zero"""
        vaga = {**vaga_java_remota, "published_at": None}
        resultado = motor.calculate(vaga)
        assert resultado["breakdown"]["timing"] == 0.0

    def test_lista_de_techs_vazia_nao_causa_erro(self, motor, vaga_java_remota):
        """Lista de tecnologias vazia não deve causar erros"""
        vaga = {**vaga_java_remota, "techs": [], "description": ""}
        resultado = motor.calculate(vaga)
        assert resultado is not None
        assert "score_rules" in resultado


# ─────────────────────────────────────────────
# TESTES DO PREDITOR ML
# ─────────────────────────────────────────────

class TestMLPredictor:

    def test_predicao_retorna_valor_entre_0_e_1(self, preditor_treinado):
        """Predição deve retornar probabilidade entre 0 e 1"""
        caracteristicas = {
            "is_remote": 1, "salary_informed": 1, "has_java": 1,
            "has_python": 1, "has_react": 1, "has_ml_skills": 1,
            "level_match": 1, "tech_match_score": 9.0,
            "glassdoor_score": 4.5, "days_since_published": 1,
        }
        resultado = preditor_treinado.predict(caracteristicas)
        assert 0.0 <= resultado <= 1.0

    def test_perfil_bom_tem_probabilidade_maior(self, preditor_treinado):
        """Perfil compatível com a vaga deve ter probabilidade maior que perfil incompatível"""
        perfil_bom = {
            "is_remote": 1, "salary_informed": 1, "has_java": 1,
            "has_python": 1, "has_react": 1, "has_ml_skills": 1,
            "level_match": 1, "tech_match_score": 9.0,
            "glassdoor_score": 4.5, "days_since_published": 1,
        }
        perfil_ruim = {
            "is_remote": 0, "salary_informed": 0, "has_java": 0,
            "has_python": 0, "has_react": 0, "has_ml_skills": 0,
            "level_match": 0, "tech_match_score": 1.0,
            "glassdoor_score": 2.5, "days_since_published": 90,
        }
        assert preditor_treinado.predict(perfil_bom) >= preditor_treinado.predict(perfil_ruim)

    def test_preditor_nao_treinado_retorna_05(self):
        """Preditor sem treinamento deve retornar 0.5 como valor padrão"""
        preditor = MLPredictor()
        preditor.modelo = None
        preditor.scaler = None

        resultado = preditor.predict({"is_remote": 1})
        assert resultado == 0.5

    def test_is_trained_retorna_true_apos_treino(self, preditor_treinado):
        """is_trained deve retornar True após o treinamento"""
        assert preditor_treinado.is_trained() is True

    def test_is_trained_retorna_false_antes_do_treino(self):
        """is_trained deve retornar False antes de qualquer treinamento"""
        preditor = MLPredictor()
        preditor.modelo = None
        preditor.scaler = None
        assert preditor.is_trained() is False

    def test_get_info_retorna_importancia_das_features(self, preditor_treinado):
        """get_info deve retornar a importância de cada feature do modelo"""
        info = preditor_treinado.get_info()
        assert info["trained"] is True
        assert "feature_importances" in info
        assert len(info["feature_importances"]) == 10

    def test_treino_exige_coluna_got_response(self):
        """train deve lançar erro se coluna 'got_response' estiver ausente"""
        preditor = MLPredictor()
        df = pd.DataFrame({"is_remote": [1, 0], "has_java": [1, 0]})

        with pytest.raises(ValueError, match="got_response"):
            preditor.train(df)

    def test_predicao_com_features_faltando_nao_falha(self, preditor_treinado):
        """Predição com features parciais não deve causar erro"""
        caracteristicas_parciais = {"is_remote": 1, "has_java": 1}
        resultado = preditor_treinado.predict(caracteristicas_parciais)
        assert 0.0 <= resultado <= 1.0

    def test_retreino_nao_quebra_o_modelo(self, preditor_treinado):
        """Re-treinar o modelo com novos dados não deve quebrar as predições"""
        caracteristicas = {
            "is_remote": 1, "salary_informed": 1, "has_java": 1,
            "has_python": 0, "has_react": 1, "has_ml_skills": 0,
            "level_match": 1, "tech_match_score": 7.0,
            "glassdoor_score": 4.0, "days_since_published": 2,
        }

        novos_dados = pd.DataFrame({
            "is_remote": [1, 1, 0], "salary_informed": [1, 0, 0],
            "has_java": [1, 1, 0], "has_python": [0, 1, 0],
            "has_react": [1, 0, 0], "has_ml_skills": [0, 1, 0],
            "level_match": [1, 1, 0], "tech_match_score": [8, 9, 2],
            "glassdoor_score": [4.0, 4.5, 3.0], "days_since_published": [1, 2, 45],
            "got_response": [1, 1, 0],
        })
        preditor_treinado.train(novos_dados)

        resultado = preditor_treinado.predict(caracteristicas)
        assert 0.0 <= resultado <= 1.0
