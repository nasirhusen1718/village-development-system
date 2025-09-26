# backend/app/routes/officer_routes.py
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, crud, schemas, auth
from jose import jwt
from ..realtime import notify_event

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

@router.get("/sector/{sector}", response_model=List[schemas.ProblemOut])
def sector_problems(
    sector: str,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    orderBy: Optional[str] = Query("date_submitted"),
    orderDir: Optional[str] = Query("desc"),
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = get_current_user(authorization)
    if payload.get("role") not in ("officer", "admin"):
        raise HTTPException(403, "Only officers or admin can view sector problems")
    return crud.list_sector_problems(
        db,
        sector=sector,
        status=status,
        priority=priority,
        location=location,
        q=q,
        order_by=orderBy,
        order_dir=orderDir,
    )

@router.patch("/problems/{problem_id}/status", response_model=schemas.ProblemOut)
def update_status(
    problem_id: int,
    payload_body: schemas.ProblemUpdate = Body(...),
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = get_current_user(authorization)
    if payload.get("role") not in ("officer", "admin"):
        raise HTTPException(403, "Only officers/admin can update status")
    assign_to_self = bool(payload_body.assign_to_self)
    officer_id = payload.get("id") if assign_to_self else None
    if not payload_body.status:
        raise HTTPException(422, "status is required")
    updated = crud.update_problem_status(
        db,
        problem_id,
        status=payload_body.status,
        officer_id=officer_id,
        officer_remarks=payload_body.officer_remarks,
        escalated=False,
    )
    if not updated:
        raise HTTPException(404, "Problem not found")
    try:
        notify_event(updated.sector, {
            "type": "status_changed",
            "problem_id": updated.id,
            "sector": updated.sector,
            "status": updated.status,
            "priority": updated.priority,
        })
    except Exception:
        pass
    return updated

@router.post("/problems/{problem_id}/escalate", response_model=schemas.ProblemOut)
def escalate_problem(
    problem_id: int,
    remarks: Optional[str] = Body(None, embed=True),
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = get_current_user(authorization)
    if payload.get("role") not in ("officer", "admin"):
        raise HTTPException(403, "Only officers/admin can escalate")
    updated = crud.update_problem_status(
        db,
        problem_id,
        status="Escalated",
        officer_id=payload.get("id"),
        officer_remarks=remarks,
        escalated=True,
    )
    if not updated:
        raise HTTPException(404, "Problem not found")
    try:
        notify_event(updated.sector, {
            "type": "problem_escalated",
            "problem_id": updated.id,
            "sector": updated.sector,
            "status": updated.status,
            "priority": updated.priority,
        })
    except Exception:
        pass
    return updated

@router.get("/dashboard/summary", response_model=schemas.OfficerSummary)
def dashboard_summary(
    sector: Optional[str] = Query(None),
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = get_current_user(authorization)
    if payload.get("role") not in ("officer", "admin"):
        raise HTTPException(403, "Only officers/admin can view summary")
    data = crud.officer_summary(db, sector=sector)
    return data

@router.get("/problems/{problem_id}/history", response_model=List[schemas.ProblemHistoryOut])
def problem_history(
    problem_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    payload = get_current_user(authorization)
    if payload.get("role") not in ("officer", "admin"):
        raise HTTPException(403, "Only officers/admin can view history")
    history = crud.get_problem_history(db, problem_id)
    return history
