import joblib
import logging
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from typing import Optional

logger = logging.getLogger(__name__)

# Colunas de entrada usadas pelo modelo
COLUNAS_ENTRADA = [
    "is_remote",
    "salary_informed",
    "has_java",
    "has_python",
    "has_react",
    "has_ml_skills",
    "level_match",
    "tech_match_score",
    "glassdoor_score",
    "days_since_published",
]

CAMINHO_MODELO = "models/model.pkl"
CAMINHO_SCALER = "models/scaler.pkl"


class MLPredictor:
    def __init__(self):
        self.modelo: Optional[RandomForestClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self._carregar_se_existir()

    def _carregar_se_existir(self):
        """Carrega modelo salvo em disco se existir"""
        if os.path.exists(CAMINHO_MODELO) and os.path.exists(CAMINHO_SCALER):
            try:
                self.modelo = joblib.load(CAMINHO_MODELO)
                self.scaler = joblib.load(CAMINHO_SCALER)
                logger.info("Modelo carregado do disco com sucesso")
            except Exception as e:
                logger.warning(f"Não foi possível carregar o modelo salvo: {e}")

    def train(self, df: pd.DataFrame) -> dict:
        """Treina o modelo com histórico de candidaturas"""
        if "got_response" not in df.columns:
            raise ValueError("O DataFrame deve conter a coluna 'got_response'")

        # Preenche colunas ausentes com zero
        for col in COLUNAS_ENTRADA:
            if col not in df.columns:
                df[col] = 0

        X = df[COLUNAS_ENTRADA].fillna(0)
        y = df["got_response"]

        self.scaler = StandardScaler()
        X_normalizado = self.scaler.fit_transform(X)

        self.modelo = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42,
            class_weight="balanced",  # compensa desequilíbrio entre classes
            min_samples_leaf=2
        )

        # Validação cruzada para avaliar desempenho antes de salvar
        folds = max(2, min(3, len(df) // 2))
        pontuacoes = cross_val_score(self.modelo, X_normalizado, y, cv=folds)
        acuracia = float(pontuacoes.mean())

        self.modelo.fit(X_normalizado, y)

        # Persiste o modelo e o scaler em disco
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.modelo, CAMINHO_MODELO)
        joblib.dump(self.scaler, CAMINHO_SCALER)

        logger.info(f"Modelo treinado com {len(df)} amostras. Acurácia: {acuracia:.3f}")
        return {"accuracy": acuracia, "samples": len(df)}

    def predict(self, caracteristicas: dict) -> float:
        """Prediz a probabilidade de receber retorno para uma vaga"""
        if self.modelo is None or self.scaler is None:
            logger.warning("Modelo não treinado. Retornando valor padrão 0.5")
            return 0.5

        try:
            valores = [caracteristicas.get(col, 0) for col in COLUNAS_ENTRADA]
            X = np.array([valores])
            X_normalizado = self.scaler.transform(X)
            probabilidade = self.modelo.predict_proba(X_normalizado)[0][1]
            return round(float(probabilidade), 3)
        except Exception as e:
            logger.error(f"Erro ao realizar predição: {e}")
            return 0.5

    def is_trained(self) -> bool:
        """Retorna True se o modelo já foi treinado"""
        return self.modelo is not None

    def get_info(self) -> dict:
        """Retorna informações sobre o modelo atual"""
        if not self.is_trained():
            return {"trained": False, "message": "Modelo ainda não treinado"}

        return {
            "trained": True,
            "model_type": "RandomForestClassifier",
            "n_estimators": self.modelo.n_estimators,
            "features": COLUNAS_ENTRADA,
            "feature_importances": dict(zip(
                COLUNAS_ENTRADA,
                [round(float(v), 4) for v in self.modelo.feature_importances_]
            ))
        }
