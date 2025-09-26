from pydantic import BaseModel
from typing import Dict

class SectorDistributionResponse(BaseModel):
    """Response model for sector distribution data"""
    distribution: Dict[str, int]

class StatusSummaryResponse(BaseModel):
    """Response model for status summary data"""
    pending: int
    in_progress: int
    resolved: int
    escalated: int
    total_month: int
