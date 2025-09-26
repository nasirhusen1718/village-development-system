from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from . import auth, database, models, schemas, crud
from .routes.auth_routes import router as auth_router
from .routes.farmer_routes import router as farmer_router
from .routes.admin_routes import router as admin_router
from .routes.crop_routes import router as crop_router
from .routes.ai_routes import router as ai_router
from .routes.health_routes import router as health_router
from .routes.dashboard_routes import router as dashboard_router
from .database import engine
from sqlalchemy import text
from jose import jwt
from .realtime import ws_router  # websocket endpoints

# officer_routes may be unavailable due to a filename/import issue; guard it so API can still boot
try:
    from .routes.officer_routes import router as officer_router
except Exception as _import_err:
    officer_router = None
    print("WARNING: could not import officer_routes:", _import_err)

app = FastAPI()

# CORS settings to allow frontend (Vite dev server) to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if they don't exist (useful for first run / dev)
models.Base.metadata.create_all(bind=engine)

# Lightweight auto-migration for new Problem columns (SQLite only)
def _auto_migrate_sqlite():
    try:
        with engine.connect() as conn:
            cols = conn.execute(text("PRAGMA table_info(problems);")).fetchall()
            existing = {c[1] for c in cols}
            migrations = []
            if "sector" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN sector TEXT")
            if "status" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN status TEXT DEFAULT 'Pending'")
            if "assigned_to" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN assigned_to INTEGER")
            if "location" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN location TEXT")
            if "priority" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN priority TEXT")
            if "officer_remarks" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN officer_remarks TEXT")
            if "escalated_to_admin" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN escalated_to_admin INTEGER DEFAULT 0")
            if "date_submitted" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN date_submitted DATETIME")
            if "date_resolved" not in existing:
                migrations.append("ALTER TABLE problems ADD COLUMN date_resolved DATETIME")
            for sql in migrations:
                conn.execute(text(sql))
            if migrations:
                conn.commit()
    except Exception as e:
        print("WARNING: auto-migration failed:", e)

_auto_migrate_sqlite()

# Add missing columns for users table (name)
def _auto_migrate_users():
    try:
        with engine.connect() as conn:
            cols = conn.execute(text("PRAGMA table_info(users);")).fetchall()
            existing = {c[1] for c in cols}
            if "name" not in existing:
                conn.execute(text("ALTER TABLE users ADD COLUMN name TEXT"))
                conn.commit()
    except Exception as e:
        print("WARNING: users table migration failed:", e)

_auto_migrate_users()

@app.get("/")
def read_root():
    return {"message": "Village Development System API is running!"}

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # Authenticate via CRUD (checks email and password hash)
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Include role and id in the token so clients and API routes can use them
    role_value = getattr(getattr(user, "role", None), "value", getattr(user, "role", None))
    access_token = auth.create_access_token(data={"sub": user.email, "role": role_value, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_value
    }

# Mount sub-routers (auth includes /auth/register and /auth/token)
app.include_router(auth_router)
app.include_router(farmer_router)
if officer_router is not None:
    app.include_router(officer_router)
else:
    print("WARNING: officer_router is None, skipping officer endpoints.")
app.include_router(admin_router, prefix="/admin", tags=["admin"])
# Avoid double-prefixing: routers already define their own prefixes
app.include_router(ai_router)
app.include_router(health_router)
app.include_router(dashboard_router, tags=["dashboard"])
app.include_router(ws_router)
