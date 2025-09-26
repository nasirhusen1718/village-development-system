from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from ..ai.serve_agri import predict_yield, suggest_schedule, recommend_crops

router = APIRouter(prefix="/ai", tags=["ai"])

class YieldPayload(BaseModel):
    crop: str
    state: str
    season: str
    area: float
    annual_rainfall: Optional[float] = 0.0
    fertilizer: Optional[float] = 0.0
    pesticide: Optional[float] = 0.0

@router.post("/agri/predict_yield")
async def agri_predict_yield(body: YieldPayload):
    try:
        res = predict_yield(body.dict())
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/agri/schedule")
async def agri_schedule(
    crop: str = Query(...),
    state: str = Query(""),
    season: str = Query("Kharif"),
):
    try:
        return suggest_schedule(crop=crop, village_state=state, season=season)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class RecommendPayload(BaseModel):
    state: str = ""
    season: str = "Kharif"
    area: float = 0.0
    annual_rainfall: Optional[float] = 0.0
    fertilizer: Optional[float] = 0.0
    pesticide: Optional[float] = 0.0

@router.post("/agri/recommend_crops")
async def agri_recommend_crops(body: RecommendPayload, top_n: int = Query(2, ge=1, le=10)):
    try:
        return recommend_crops({
            "state": body.state,
            "season": body.season,
            "area": body.area,
            "annual_rainfall": body.annual_rainfall,
            "fertilizer": body.fertilizer,
            "pesticide": body.pesticide,
        }, top_n=top_n)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
