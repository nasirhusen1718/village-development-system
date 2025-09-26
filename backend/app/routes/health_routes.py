# backend/app/routes/health_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ..ai.healthcare import predict_health, batch_predict, model_status
from ..realtime import notify_event

router = APIRouter(prefix="/health", tags=["healthcare"])


class HealthSample(BaseModel):
    # Vitals
    hr: Optional[float] = Field(None, description="Heart rate (bpm)")
    bp_sys: Optional[float] = Field(None, description="Systolic BP")
    bp_dia: Optional[float] = Field(None, description="Diastolic BP")
    spo2: Optional[float] = Field(None, description="Oxygen saturation (%)")
    temp_c: Optional[float] = Field(None, description="Body temperature (C)")
    rr: Optional[float] = Field(None, description="Respiratory rate (breaths/min)")

    # Demographics / history
    age: Optional[float] = None
    gender: Optional[str] = Field(None, description="male/female or 0/1")
    medical_history_count: Optional[float] = 0
    prior_events_count: Optional[float] = 0

    # Environment
    env_air_quality_index: Optional[float] = 50
    env_heat_index: Optional[float] = 28


class HealthBatch(BaseModel):
    samples: List[HealthSample]


@router.post("/predict")
def health_predict(sample: HealthSample) -> Dict[str, Any]:
    try:
        result = predict_health(sample.dict(exclude_none=True))
        # Broadcast high-severity alerts
        if result.get("severity", 0) >= 80:
            notify_event("healthcare", {"type": "ALERT", "payload": result})
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch")
def health_batch(body: HealthBatch) -> List[Dict[str, Any]]:
    try:
        payloads = [s.dict(exclude_none=True) for s in body.samples]
        results = batch_predict(payloads)
        # Broadcast any high-severity alerts
        for r in results:
            if r.get("severity", 0) >= 80:
                notify_event("healthcare", {"type": "ALERT", "payload": r})
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/model-status")
def health_model_status() -> Dict[str, Any]:
    """Get status of trained healthcare models."""
    try:
        status = model_status()
        return {
            "status": "success",
            "models_loaded": status,
            "message": "Healthcare models are ready for predictions"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Error checking model status"
        }
