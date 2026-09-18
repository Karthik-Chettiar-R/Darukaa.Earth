import os
import json
from datetime import datetime, timedelta, timezone

import psycopg
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from jose import jwt

load_dotenv()

def build_database_url():
    configured_url = os.getenv("DATABASE_URL")
    if not configured_url:
        raise RuntimeError("DATABASE_URL must be set in backend/.env")
    return configured_url.replace("postgresql+psycopg://", "postgresql://", 1)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    name: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    name: str
    email: EmailStr


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: dict
    area_hectares: float | None = None


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    color: str = Field(min_length=1, max_length=100)
    sites: list[SiteCreate] = Field(min_length=1)


class ProjectResponse(BaseModel):
    id: int
    name: str
    color: str
    site_count: int


class SiteResponse(BaseModel):
    id: int
    name: str
    location: dict
    created_at: datetime


class ProjectWithSitesResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    sites: list[SiteResponse]


class AnalyticsSummaryResponse(BaseModel):
    carbon_storage: float


class AnalyticsPoint(BaseModel):
    recorded_at: str
    carbon_storage: float
    biodiversity_index: float


class SiteAnalyticsResponse(BaseModel):
    site: SiteResponse
    project_name: str
    project_color: str
    analytics: list[AnalyticsPoint]


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY must be set in the backend .env file")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if frontend_url:
    allowed_origins.append(frontend_url)


def validate_bcrypt_password(password: str):
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be 72 bytes or fewer",
        )

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    with psycopg.connect(build_database_url()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
            """
        )


def get_db():
    with psycopg.connect(build_database_url()) as connection:
        yield connection


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.post("/api/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, database=Depends(get_db)):
    normalized_email = str(payload.email).lower()
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name cannot be blank")
    validate_bcrypt_password(payload.password)

    try:
        user = database.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            RETURNING name, email
            """,
            (name, normalized_email, password_context.hash(payload.password)),
        ).fetchone()
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    return RegisterResponse(name=user[0], email=user[1])


def create_access_token(name: str, email: str):
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": email, "name": name, "exp": expires_at}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


@app.post("/api/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, database=Depends(get_db)):
    normalized_email = str(payload.email).lower()
    validate_bcrypt_password(payload.password)
    user = database.execute(
        "SELECT name, email, password FROM users WHERE email = %s",
        (normalized_email,),
    ).fetchone()

    if not user or not password_context.verify(payload.password, user[2]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return AuthResponse(
        access_token=create_access_token(user[0], user[1]),
        token_type="bearer",
        name=user[0],
        email=user[1],
    )


@app.get("/api/projects", response_model=list[ProjectWithSitesResponse])
def list_projects(database=Depends(get_db)):
    rows = database.execute(
        """
        SELECT
            p.id,
            p.name,
            p.color,
            p.created_at,
            s.id,
            s.name,
            s.created_at,
            ST_AsGeoJSON(s.location)::json
        FROM projects p
        LEFT JOIN sites s ON s.project_id = p.id
        ORDER BY p.created_at DESC, s.created_at ASC
        """
    ).fetchall()

    projects_by_id = {}
    for project_id, project_name, project_color, project_created_at, site_id, site_name, site_created_at, location in rows:
        if project_id not in projects_by_id:
            projects_by_id[project_id] = {
                "id": project_id,
                "name": project_name,
                "color": project_color,
                "created_at": project_created_at,
                "sites": [],
            }
        if site_id is not None:
            projects_by_id[project_id]["sites"].append({
                "id": site_id,
                "name": site_name,
                "created_at": site_created_at,
                "location": json.loads(location) if isinstance(location, str) else location,
            })

    return list(projects_by_id.values())


@app.get("/api/projects/{project_id}/analytics", response_model=list[AnalyticsPoint])
def project_analytics(project_id: int, database=Depends(get_db)):
    rows = database.execute(
        """
        SELECT
            a.recorded_at,
            COALESCE(SUM(a.carbon_storage), 0),
            COALESCE(AVG(a.biodiversity_index), 0)
        FROM site_analytics a
        JOIN sites s ON s.id = a.site_id
        WHERE s.project_id = %s
        GROUP BY a.recorded_at
        ORDER BY a.recorded_at ASC
        """,
        (project_id,),
    ).fetchall()
    return [
        AnalyticsPoint(
            recorded_at=recorded_at.isoformat(),
            carbon_storage=float(carbon_storage),
            biodiversity_index=float(biodiversity_index),
        )
        for recorded_at, carbon_storage, biodiversity_index in rows
    ]


@app.get("/api/analytics/summary", response_model=AnalyticsSummaryResponse)
def analytics_summary(database=Depends(get_db)):
    carbon_storage = database.execute(
        "SELECT COALESCE(SUM(carbon_storage), 0) FROM site_analytics"
    ).fetchone()[0]
    return AnalyticsSummaryResponse(carbon_storage=float(carbon_storage))


@app.get("/api/sites/{site_id}/analytics", response_model=SiteAnalyticsResponse)
def site_analytics(site_id: int, database=Depends(get_db)):
    site = database.execute(
        """
        SELECT s.id, s.name, ST_AsGeoJSON(s.location)::json, s.created_at, p.name, p.color
        FROM sites s
        JOIN projects p ON p.id = s.project_id
        WHERE s.id = %s
        """,
        (site_id,),
    ).fetchone()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    rows = database.execute(
        """
        SELECT recorded_at, carbon_storage, biodiversity_index
        FROM site_analytics
        WHERE site_id = %s
        ORDER BY recorded_at ASC
        """,
        (site_id,),
    ).fetchall()
    return SiteAnalyticsResponse(
        site=SiteResponse(id=site[0], name=site[1], location=site[2], created_at=site[3]),
        project_name=site[4],
        project_color=site[5],
        analytics=[
            AnalyticsPoint(
                recorded_at=recorded_at.isoformat(),
                carbon_storage=float(carbon_storage),
                biodiversity_index=float(biodiversity_index),
            )
            for recorded_at, carbon_storage, biodiversity_index in rows
        ],
    )


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, database=Depends(get_db)):
    project_name = payload.name.strip()
    if not project_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Project name cannot be blank")

    for site in payload.sites:
        if site.location.get("type") != "Polygon":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Each site must have a polygon location")

    try:
        project = database.execute(
            """
            INSERT INTO projects (name, color)
            VALUES (%s, %s)
            RETURNING id, name, color
            """,
            (project_name, payload.color),
        ).fetchone()

        for site in payload.sites:
            database.execute(
                """
                INSERT INTO sites (project_id, name, location, area_hectares)
                VALUES (%s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), %s)
                """,
                (project[0], site.name.strip(), json.dumps(site.location), site.area_hectares),
            )
    except psycopg.Error:
        database.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not save project and sites")

    return ProjectResponse(id=project[0], name=project[1], color=project[2], site_count=len(payload.sites))