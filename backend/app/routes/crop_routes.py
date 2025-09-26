# backend/app/routes/crop_routes.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/crop", tags=["crop"])

class CropRequest(BaseModel):
    soil_type: str  # sandy, loamy, clayey
    season: str     # summer, winter, monsoon
    region: str = ""

@router.post("/recommend")
def recommend_crop(req: CropRequest):
    # simple rule-based stub; replace with ML model later
    st = req.soil_type.lower()
    sn = req.season.lower()
    suggestions = []
    if st == "loamy":
        suggestions = ["Wheat", "Maize"] if sn in ("winter", "summer") else ["Rice", "Vegetables"]
    elif st == "sandy":
        suggestions = ["Millets", "Groundnut"] if sn in ("summer", "monsoon") else ["Barley"]
    elif st == "clayey":
        suggestions = ["Rice", "Sugarcane"] if sn == "monsoon" else ["Wheat"]
    else:
        suggestions = ["Maize", "Pulses"]
    return {"recommended": suggestions, "confidence": "rule-based-stub"}
