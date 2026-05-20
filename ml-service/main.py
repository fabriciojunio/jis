from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging

from ml.preditor import MLPredictor
from scoring.motor import ScoringEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JIS ML Service",
    description="Servico de Machine Learning do Job Intelligence System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = MLPredictor()
scoring_engine = ScoringEngine()


class JobFeatures(BaseModel):
    is_remote: int = 0
    salary_informed: int = 0
    has_java: int = 0
    has_python: int = 0
    has_react: int = 0
    has_ml_skills: int = 0
    level_match: int = 0
    tech_match_score: Optional[float] = 0.0
    glassdoor_score: Optional[float] = 0.0
    days_since_published: Optional[int] = 0


class TrainingData(BaseModel):
    data: list[dict]


class ScoreRequest(BaseModel):
    title: str
    description: str
    techs: list[str] = []
    remote: bool = False
    salary_informed: bool = False
    location: str = ""
    published_at: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok", "model_trained": predictor.is_trained()}


@app.post("/predict")
def predict(features: JobFeatures):
    """Prediz probabilidade de callback para uma vaga"""
    try:
        probability = predictor.predict(features.model_dump())
        return {
            "probability": probability,
            "percentage": f"{probability * 100:.1f}%",
            "recommendation": get_recommendation(probability)
        }
    except Exception as e:
        logger.error(f"Erro na predicao: {e}")
        return {"probability": 0.0, "percentage": "0.0%", "recommendation": "no_data"}


@app.post("/retrain")
def retrain(training_data: TrainingData):
    """Re-treina o modelo com novos dados de candidaturas"""
    try:
        if len(training_data.data) < 5:
            raise HTTPException(
                status_code=400,
                detail="Minimo de 5 amostras necessarias para treinar"
            )

        import pandas as pd
        df = pd.DataFrame(training_data.data)
        result = predictor.train(df)

        return {
            "status": "success",
            "samples": len(training_data.data),
            "accuracy": result.get("accuracy", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no re-treinamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/info")
def model_info():
    """Informacoes sobre o modelo atual"""
    return predictor.get_info()


def get_recommendation(probability: float) -> str:
    if probability >= 0.7:
        return "highly_recommended"
    if probability >= 0.5:
        return "recommended"
    if probability >= 0.3:
        return "possible"
    return "low_chance"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
