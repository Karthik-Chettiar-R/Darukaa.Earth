# Darukaa.earth

Darukaa.earth is a conservation project management dashboard for creating projects, mapping monitoring sites, and viewing carbon-storage and biodiversity analytics.

## Architecture

The repository contains two applications:

- `frontend/`: React 19 + Vite application styled with Tailwind CSS and shared design tokens.
- `backend/`: FastAPI application using plain parameterized `psycopg` SQL, Passlib bcrypt password hashing, and JWT authentication.
- Neon PostgreSQL/PostGIS: stores users, projects, polygon site geometries, and site analytics.
- Mapbox GL JS: renders maps and Mapbox Draw captures site polygons.
- Chart.js: renders project and site analytics charts.

The frontend calls the backend through `VITE_BACKEND_URL`. The backend is exposed to Vercel through `backend/api/index.py` and `backend/vercel.json`.

## Database Schema

The application expects PostgreSQL with the PostGIS extension enabled.

### `users`

Stores authentication records:

- `ID SERIAL PRIMARY KEY`
- `name VARCHAR(100)`
- `email VARCHAR(100) UNIQUE`
- `password VARCHAR(255)` containing a bcrypt hash, never a plaintext password

### `projects`

Stores project metadata:

- `id SERIAL PRIMARY KEY`
- `name VARCHAR(150)`
- `color VARCHAR(100)`
- `created_at TIMESTAMP`
- `updated_at TIMESTAMP`

### `sites`

Stores project monitoring sites:

- `id SERIAL PRIMARY KEY`
- `project_id INTEGER` referencing `projects(id)` with cascade delete
- `name VARCHAR(150)`
- `location GEOMETRY(POLYGON, 4326)`
- `area_hectares DECIMAL(12, 2)`
- `created_at TIMESTAMP`
- `updated_at TIMESTAMP`

### `site_analytics`

Stores monthly or field-measurement values:

- `id SERIAL PRIMARY KEY`
- `site_id INTEGER` referencing `sites(id)` with cascade delete
- `recorded_at DATE`
- `carbon_storage DECIMAL(12, 2)`
- `biodiversity_index DECIMAL(5, 2)`
- Unique constraint on `(site_id, recorded_at)`

## Local Setup

### Backend

Create or activate the backend virtual environment and install dependencies:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` locally. Do not commit it:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

Run the API:

```powershell
uvicorn main:app --reload
```

The local API is available at `http://localhost:8000`.

### Frontend

Install and run the Vite application:

```powershell
cd frontend
npm install
npm run dev
```

Create `frontend/.env` locally:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_public_token
```

The frontend is available at `http://localhost:5173`.

## Seed Analytics

After the database contains sites with IDs 5 through 13, seed five monthly analytics records per site:

```powershell
cd backend
.\venv\Scripts\python.exe seed_analytics.py
```

The script seeds May 1 through September 1, 2026 and safely upserts existing `(site_id, recorded_at)` records.

## API Routes

- `POST /api/register`: create a bcrypt-backed user account.
- `POST /api/login`: validate credentials and return a JWT bearer token.
- `GET /api/projects`: return projects, sites, timestamps, and GeoJSON polygons.
- `POST /api/projects`: create a project and its polygon sites transactionally.
- `GET /api/projects/{project_id}/analytics`: return aggregated project analytics.
- `GET /api/sites/{site_id}/analytics`: return site details and analytics.
- `GET /api/analytics/summary`: return total carbon storage.

Authenticated requests should send:

```http
Authorization: Bearer <access_token>
```

## CI/CD and Git Hooks

There is no GitHub Actions workflow in this repository currently. Deployment is configured for Vercel:

- Backend Vercel project root: `backend/`
- Frontend Vercel project root: `frontend/`
- Backend entrypoint: `backend/api/index.py`
- Backend production environment variables: `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_EXPIRE_MINUTES`, and `FRONTEND_URL`
- Frontend production environment variables: `VITE_BACKEND_URL` and `VITE_MAPBOX_ACCESS_TOKEN`

The root pre-commit hook runs Husky and lint-staged. Staged JavaScript and JSX files are formatted with Prettier and checked with ESLint. Staged CSS, JSON, and Markdown files are formatted with Prettier.

Useful checks:

```powershell
cd frontend
npm run lint
npm run format:check
npm run build
```

## Review Notes

- Never commit `.env` files, database URLs, JWT secrets, or Mapbox tokens.
- Rotate any credential that is accidentally exposed.
- The frontend requires a valid Mapbox public token for map rendering.
- The backend requires a Neon/PostgreSQL database with PostGIS and the application tables created before project creation or analytics seeding.
- Production deployments must define environment variables in Vercel; local `.env` files are ignored by Git.
