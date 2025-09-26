# backend/app/routes/admin_routes.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, crud, schemas, auth
from jose import jwt

router = APIRouter(tags=["admin"], prefix="/admin")

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

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return crud.list_users(db)

@router.get("/problems", response_model=List[schemas.ProblemOut])
def all_problems(authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return crud.get_all_problems(db)

@router.get("/summary/status")
def summary_status(authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return crud.problem_status_counts(db)

@router.get("/summary/sector")
def summary_sector(authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return crud.problem_sector_counts(db)

@router.delete("/users/{user_id}")
def delete_user(user_id: int, authorization: str = Header(None), db: Session = Depends(get_db)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(404, "User not found")
    return {"deleted": True, "user_id": user_id}
