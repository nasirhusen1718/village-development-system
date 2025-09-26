from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Problem
from ..dashboard_schemas import SectorDistributionResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/sector-distribution", response_model=SectorDistributionResponse)
async def get_sector_distribution(db: Session = Depends(get_db)):
    """
    Get the distribution of problems across different sectors
    """
    try:
        # Get counts for each sector
        sectors = ["healthcare", "agriculture", "village", "education", "water"]
        distribution = {}
        
        for sector in sectors:
            count = db.query(Problem).filter(
                Problem.sector == sector,
                Problem.date_submitted >= (datetime.utcnow() - timedelta(days=30))
            ).count()
            distribution[sector] = count
            
        return {"distribution": distribution}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sector distribution: {str(e)}")

@router.get("/status-summary")
async def get_status_summary(db: Session = Depends(get_db)):
    """
    Get summary of problem statuses
    """
    try:
        # Get counts for different statuses
        statuses = ["Pending", "In Progress", "Resolved", "Escalated"]
        summary = {status.lower().replace(" ", "_"): 0 for status in statuses}
        
        for status in statuses:
            count = db.query(Problem).filter(
                Problem.status == status,
                Problem.date_submitted >= (datetime.utcnow() - timedelta(days=30))
            ).count()
            summary[status.lower().replace(" ", "_")] = count
            
        # Add total count for the month
        total = sum(summary.values())
        summary["total_month"] = total
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching status summary: {str(e)}")
