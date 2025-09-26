# backend/app/routes/farmer_routes.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, crud, schemas, auth
from jose import jwt
from ..realtime import notify_event

router = APIRouter(prefix="/farmer", tags=["farmer"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Auth required")
    token = authorization.split(" ")[1]
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    return payload

@router.post("/problems", response_model=schemas.ProblemOut)
def create_problem(p: schemas.ProblemCreate, authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    # Allow any authenticated user to create problems (farmer/user/officer/admin)
    if not payload.get("id"):
        raise HTTPException(401, "Invalid token")
    created = crud.create_problem(db, payload.get("id"), p)
    try:
        notify_event(created.sector, {
            "type": "problem_created",
            "problem_id": created.id,
            "sector": created.sector,
            "priority": created.priority,
            "high_priority": (str(created.priority).lower() == "high"),
            "title": created.title,
        })
    except Exception:
        pass
    return created

@router.get("/problems", response_model=List[schemas.ProblemOut])
def my_problems(authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    return crud.get_problems_by_user(db, payload.get("id"))
