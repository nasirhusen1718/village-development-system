# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None

class ProblemCreate(BaseModel):
    sector: str
    title: str
    description: str
    location: Optional[str] = None
    priority: Optional[str] = None  # low/medium/high
    officer_remarks: Optional[str] = None

class ProblemOut(BaseModel):
    id: int
    user_id: Optional[int]
    sector: str
    title: str
    description: str
    status: str
    assigned_to: Optional[int]
    location: Optional[str]
    priority: Optional[str]
    officer_remarks: Optional[str]
    escalated_to_admin: Optional[bool]
    date_submitted: datetime
    date_resolved: Optional[datetime]
    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode

class ProblemUpdate(BaseModel):
    status: Optional[str] = None  # Pending/In Progress/Resolved/Escalated
    officer_remarks: Optional[str] = None
    assign_to_self: Optional[bool] = False

class OfficerSummary(BaseModel):
    total_month: int
    pending: int
    high_priority: int
    resolved: int

class ProblemHistoryOut(BaseModel):
    id: int
    problem_id: int
    changed_by: Optional[int]
    action: str
    from_status: Optional[str]
    to_status: Optional[str]
    remark: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
