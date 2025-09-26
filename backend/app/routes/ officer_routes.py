from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .. import database, crud, auth
from jose import jwt

router = APIRouter(prefix="/officer", tags=["officer"])

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

@router.get("/sector/{sector}")
def sector_problems(sector: str, authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "officer":
        raise HTTPException(403, "Officer only")
    return crud.get_problems_by_sector(db, sector)

@router.patch("/problems/{pid}/status")
def update_status(pid: int, status: str, authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "officer":
        raise HTTPException(403, "Officer only")
    updated = crud.update_problem_status(db, pid, status, officer_id=payload.get("id"))
    if not updated:
        raise HTTPException(404, "Problem not found")
    return updated