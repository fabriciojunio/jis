from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Pontuação por tecnologia — stack do candidato
PONTUACAO_TECNOLOGIAS = {
    "java": 3.0, "spring boot": 3.0, "python": 3.0,
    "react": 2.0, "node.js": 2.0, "nodejs": 2.0,
    "fastapi": 2.0, "postgresql": 2.0, "sql": 1.5,
    "javascript": 1.5, "typescript": 1.5,
    "next.js": 1.5, "nextjs": 1.5, "react native": 1.5,
    "docker": 1.0, "git": 0.5,
    "machine learning": 2.0, "scikit-learn": 2.0,
    "nlp": 2.0, "pandas": 1.5, "xgboost": 1.5,
    "api rest": 1.0, "rest api": 1.0, "supabase": 1.0,
}

# Penalizações por tecnologia incompatível com o perfil
PENALIZACOES_TECNOLOGIAS = {
    ".net": -3.0, "c#": -3.0, "kotlin": -2.5,
    "flutter": -2.0, "computer vision": -2.0,
    "totvs agro": -3.0, "cobol": -3.0, "delphi": -3.0,
}

# Pontuação por nível da vaga
PONTUACAO_NIVEL = {
    "junior": 3.0, "jr": 3.0, "júnior": 3.0,
    "entry level": 3.0, "pleno": 2.0, "mid": 2.0,
    "senior": -3.0, "sênior": -3.0, "sr": -2.0,
    "especialista": -2.0, "arquiteto": -3.0,
}


class ScoringEngine:
    def calculate(self, vaga: dict) -> dict:
        """Calcula a pontuação total de uma vaga com detalhamento por critério"""
        detalhamento = {}

        pontos_tecnologia = self._pontuar_tecnologias(vaga)
        detalhamento["techs"] = pontos_tecnologia

        pontos_nivel = self._pontuar_nivel(vaga)
        detalhamento["level"] = pontos_nivel

        pontos_trabalho = self._pontuar_modelo_trabalho(vaga)
        detalhamento["work_mode"] = pontos_trabalho

        pontos_salario = 2.0 if vaga.get("salary_informed") else 0.0
        detalhamento["salary"] = pontos_salario

        pontos_timing = self._pontuar_timing(vaga.get("published_at"))
        detalhamento["timing"] = pontos_timing

        total = pontos_tecnologia + pontos_nivel + pontos_trabalho + pontos_salario + pontos_timing
        total = max(total, 0.0)  # score nunca negativo

        return {
            "score_rules": round(total, 2),
            "breakdown": detalhamento
        }

    def _pontuar_tecnologias(self, vaga: dict) -> float:
        """Pontua com base nas tecnologias da vaga"""
        conteudo = self._extrair_conteudo(vaga).lower()
        pontuacao = 0.0

        for tecnologia, pontos in PONTUACAO_TECNOLOGIAS.items():
            if tecnologia in conteudo:
                pontuacao += pontos

        for tecnologia, penalidade in PENALIZACOES_TECNOLOGIAS.items():
            if tecnologia in conteudo:
                pontuacao += penalidade  # penalidade já é negativa

        return pontuacao

    def _pontuar_nivel(self, vaga: dict) -> float:
        """Pontua com base no nível exigido pela vaga"""
        conteudo = (
            (vaga.get("title") or "") + " " + (vaga.get("description") or "")
        ).lower()

        for termo, pontos in PONTUACAO_NIVEL.items():
            if termo in conteudo:
                return pontos
        return 0.0

    def _pontuar_modelo_trabalho(self, vaga: dict) -> float:
        """Pontua conforme o modelo de trabalho (remoto, híbrido ou presencial)"""
        if vaga.get("remote"):
            return 3.0
        if vaga.get("hybrid"):
            return 1.0

        # Presencial fora de Bauru recebe penalidade
        localizacao = (vaga.get("location") or "").lower()
        if localizacao and "bauru" not in localizacao:
            return -3.0
        return 0.0

    def _pontuar_timing(self, publicado_em: Optional[str]) -> float:
        """Pontua com base em quantos dias a vaga foi publicada"""
        if not publicado_em:
            return 0.0
        try:
            if isinstance(publicado_em, str):
                data = datetime.fromisoformat(publicado_em.replace("Z", "+00:00"))
            else:
                data = publicado_em

            agora = datetime.now(timezone.utc)
            if data.tzinfo is None:
                data = data.replace(tzinfo=timezone.utc)

            dias = (agora - data).days

            if dias <= 1:
                return 2.0   # vaga nova — bônus máximo
            if dias <= 3:
                return 1.0   # vaga recente
            if dias > 30:
                return -1.0  # vaga antiga — penaliza
            return 0.0
        except Exception as e:
            logger.warning(f"Erro ao calcular pontuação de timing: {e}")
            return 0.0

    def _extrair_conteudo(self, vaga: dict) -> str:
        """Concatena título, descrição e tecnologias para busca de palavras-chave"""
        partes = [
            vaga.get("title") or "",
            vaga.get("description") or "",
            " ".join(vaga.get("techs") or [])
        ]
        return " ".join(partes)
