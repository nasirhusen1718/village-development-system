# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas, auth
from datetime import datetime, timedelta

# User CRUD

def get_user_by_email(db: Session, email: str):
	return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: int):
	return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
	hashed = auth.get_password_hash(user.password)
	db_user = models.User(name=getattr(user, "name", None), email=user.email, hashed_password=hashed, role=user.role)
	db.add(db_user)
	db.commit()
	db.refresh(db_user)
	return db_user


def authenticate_user(db: Session, email: str, password: str):
	user = get_user_by_email(db, email)
	if not user:
		return None
	if not auth.verify_password(password, user.hashed_password):
		return None
	return user

# Problem CRUD

def create_problem(db: Session, user_id: int, p: schemas.ProblemCreate):
	db_p = models.Problem(
		user_id=user_id,
		sector=p.sector,
		title=p.title,
		description=p.description,
		status="Pending",
		location=getattr(p, "location", None),
		priority=getattr(p, "priority", None),
		officer_remarks=getattr(p, "officer_remarks", None),
		date_submitted=datetime.utcnow(),
	)
	db.add(db_p)
	db.commit()
	db.refresh(db_p)
	return db_p


def get_problems_by_user(db: Session, user_id: int):
	return (
		db.query(models.Problem)
		.filter(models.Problem.user_id == user_id)
		.order_by(models.Problem.date_submitted.desc())
		.all()
	)


def get_problems_by_sector(db: Session, sector: str):
	return (
		db.query(models.Problem)
		.filter(models.Problem.sector == sector)
		.order_by(models.Problem.date_submitted.desc())
		.all()
	)


def get_problem(db: Session, problem_id: int):
	return db.query(models.Problem).filter(models.Problem.id == problem_id).first()


def update_problem_status(db: Session, problem_id: int, status: str, officer_id: int=None, officer_remarks: str=None, escalated: bool=False):
	p = get_problem(db, problem_id)
	if not p:
		return None
	prev_status = p.status
	p.status = status
	if status.lower() in ("solved", "resolved"):
		p.date_resolved = datetime.utcnow()
	if officer_id:
		p.assigned_to = officer_id
	if officer_remarks is not None:
		p.officer_remarks = officer_remarks
	if escalated:
		p.escalated_to_admin = True
	db.commit()
	db.refresh(p)
	# record history (if model exists)
	try:
		h = models.ProblemHistory(
			problem_id=p.id,
			changed_by=officer_id,
			action=("Escalated" if escalated else "StatusChanged"),
			from_status=prev_status,
			to_status=status,
			remark=officer_remarks,
			created_at=datetime.utcnow(),
		)
		db.add(h)
		db.commit()
	except Exception:
		db.rollback()
	return p


def get_all_problems(db: Session):
	return db.query(models.Problem).order_by(models.Problem.date_submitted.desc()).all()


def list_users(db: Session):
	return db.query(models.User).all()

# Filtering for officer sector list

def list_sector_problems(db: Session, sector: str, status: str=None, priority: str=None, location: str=None, q: str=None, order_by: str="date_submitted", order_dir: str="desc"):
	qset = db.query(models.Problem).filter(models.Problem.sector == sector)
	if status:
		statuses = [s.strip() for s in str(status).split(',') if s.strip()]
		if len(statuses) > 1:
			qset = qset.filter(models.Problem.status.in_(statuses))
		elif len(statuses) == 1:
			qset = qset.filter(models.Problem.status.ilike(f"%{statuses[0]}%"))
	if priority:
		priorities = [p.strip() for p in str(priority).split(',') if p.strip()]
		if len(priorities) > 1:
			qset = qset.filter(models.Problem.priority.in_(priorities))
		elif len(priorities) == 1:
			qset = qset.filter(models.Problem.priority == priorities[0])
	if location:
		qset = qset.filter(models.Problem.location.ilike(f"%{location}%"))
	if q:
		like = f"%{q}%"
		qset = qset.filter((models.Problem.title.ilike(like)) | (models.Problem.description.ilike(like)))
	# ordering
	col_map = {
		"date_submitted": models.Problem.date_submitted,
		"priority": models.Problem.priority,
		"status": models.Problem.status,
		"location": models.Problem.location,
	}
	col = col_map.get(order_by, models.Problem.date_submitted)
	qset = qset.order_by(col.asc() if order_dir == "asc" else col.desc())
	return qset.all()

# Officer dashboard summary for current month

def officer_summary(db: Session, sector: str=None):
	now = datetime.utcnow()
	month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
	qset = db.query(models.Problem).filter(models.Problem.date_submitted >= month_start)
	if sector:
		qset = qset.filter(models.Problem.sector == sector)
	total_month = qset.count()
	pending = qset.filter(models.Problem.status.ilike("%Pending%") ).count()
	high_priority = qset.filter(models.Problem.priority == "high").count()
	resolved = qset.filter(models.Problem.status.ilike("%Resolved%") | models.Problem.status.ilike("%Solved%") ).count()
	return {
		"total_month": total_month,
		"pending": pending,
		"high_priority": high_priority,
		"resolved": resolved,
	}

# Admin helpers

def delete_user(db: Session, user_id: int) -> bool:
	u = db.query(models.User).filter(models.User.id == user_id).first()
	if not u:
		return False
	# Optional: also delete user's problems
	db.query(models.Problem).filter(models.Problem.user_id == user_id).delete()
	db.delete(u)
	db.commit()
	return True


def problem_status_counts(db: Session):
	# returns dict like {"Pending": 10, "In Progress": 3, "Resolved": 5, "Escalated": 2}
	rows = db.query(models.Problem.status, func.count(models.Problem.id)).group_by(models.Problem.status).all()
	return { (r[0] or "Unknown"): r[1] for r in rows }


def problem_sector_counts(db: Session):
	rows = db.query(models.Problem.sector, func.count(models.Problem.id)).group_by(models.Problem.sector).all()
	return { (r[0] or "Unknown" ): r[1] for r in rows }

# History retrieval

def get_problem_history(db: Session, problem_id: int):
	return (
		db.query(models.ProblemHistory)
		.filter(models.ProblemHistory.problem_id == problem_id)
		.order_by(models.ProblemHistory.created_at.asc())
		.all()
	)
