from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import jwt

from .. import auth
from ..database import get_db
from ..models import Problem, User
from ..dashboard_schemas import SectorDistributionResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Authorization header is required")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        return payload
    except Exception as e:
        raise HTTPException(401, "Invalid or expired token")

@router.get("/sector-distribution", response_model=SectorDistributionResponse)
async def get_sector_distribution(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
    sector: Optional[str] = None
):
    """
    Get the distribution of problems across different sectors
    If sector is provided, only returns data for that sector
    """
    try:
        # Get current user
        user = get_current_user(authorization)
        user_role = user.get("role")
        user_sector = user.get("sector")
        
        # If user is an officer and no sector is provided, use their assigned sector
        if user_role == "officer" and not sector:
            sector = user_sector
        
        # Get counts for each sector
        sectors = ["healthcare", "agriculture", "village", "education", "water"]
        distribution = {s: 0 for s in sectors}
        
        # Build base query
        query = db.query(Problem.sector, func.count(Problem.id))
        
        # Apply sector filter if provided
        if sector:
            query = query.filter(Problem.sector == sector)
            sectors = [sector]  # Only include the specified sector in results
        
        # Group by sector and execute
        results = query.group_by(Problem.sector).all()
        
        # Update distribution with actual counts
        for s, count in results:
            if s in distribution:
                distribution[s] = count
            
        return {"distribution": distribution}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sector distribution: {str(e)}")

@router.get("/status-summary")
async def get_status_summary(
    authorization: str = Header(None),
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get summary of problem statuses
    If sector is provided, only returns data for that sector
    """
    try:
        # Get current user
        user = get_current_user(authorization)
        user_role = user.get("role")
        user_sector = user.get("sector")
        
        # If user is an officer and no sector is provided, use their assigned sector
        if user_role == "officer" and not sector:
            sector = user_sector
        
        # Get counts for different statuses
        statuses = ["Pending", "In Progress", "Resolved", "Escalated"]
        summary = {status.lower().replace(" ", "_"): 0 for status in statuses}
        
        # Build base query
        query = db.query(Problem.status, func.count(Problem.id))
        
        # Apply sector filter if provided
        if sector:
            query = query.filter(Problem.sector == sector)
        
        # Group by status and execute
        results = query.group_by(Problem.status).all()
        
        # Update summary with actual counts
        for status, count in results:
            if status in statuses:
                summary[status.lower().replace(" ", "_")] = count
        
        # Add total count for the month
        summary["total_month"] = sum(summary.values())
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching status summary: {str(e)}")
