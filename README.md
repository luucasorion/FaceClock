# FaceClock

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?logo=mui&logoColor=white)

Facial-recognition time clock — collaborators punch in/out with their face, managers get
company-scoped attendance, worked-hours, and overtime reports. Attendance is **identity-bound**,
so it resists proxy punching and cuts HR reconciliation.

## Technology Stack and Features

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) for the Python backend API.
    - 🗄️ [**SQLAlchemy**](https://www.sqlalchemy.org) as the Python ORM.
    - 🧾 [**Pydantic**](https://docs.pydantic.dev), used by FastAPI, for request/response schemas and settings.
    - 💾 [**SQLite**](https://www.sqlite.org) as the SQL database.
    - 🧠 [**DeepFace**](https://github.com/serengil/deepface) (ArcFace) for server-side face embedding and recognition.
- 🚀 [**React**](https://react.dev) for the frontend.
    - ⚡ Built with [**Vite**](https://vite.dev) as a single-page app.
    - 🎨 [**MUI**](https://mui.com) components for a responsive, mobile-first UI.
    - 📷 In-browser camera capture — frames are uploaded as bytes; embeddings are computed server-side and images are never persisted on device (NFR05).
- 🏛️ **Clean architecture** — `presentation → application → domain`, with `infra` at the edges. See [ADR 0002](docs/adr/0002-clean-architecture-layering.md).
- 🔐 **JWT authentication** with role-based access — a `gerente` claim gates manager actions; access is company-scoped (BR03/BR06).
- 👤 **Secure password hashing** by default (bcrypt, NFR04); embeddings and hashes never leak in responses or logs.
- 🕒 **Punch rules enforced** — 0.65 recognition threshold (BR01) and a 5-minute minimum interval (BR02).
- 📊 **Attendance reports** — self history + daily summary, and a manager company report with worked-hours/overtime (JSON/CSV).
- 📐 **Decisions recorded as ADRs** and work tracked in **GitHub Issues** — see below.

## Screenshots

<!-- Add screenshots to docs/img/ and reference them here, e.g. ![Kiosk punch](docs/img/kiosk.png) -->

Key screens: kiosk/totem punch · employee punch home · biometric enrollment · profile & history ·
manager "My Employees" · manager company report. _(Screenshots to be added under `docs/img/`.)_

## How To Use It

### 1. Clone

```bash
git clone https://github.com/luucasorion/FaceClock.git
cd FaceClock
```

### 2. Backend

From the repo root:

```bash
pip install -r requirements.txt
python main.py
```

The API serves on `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

### 4. Configure

The backend loads a `.env` from the repo root. Configure at least:

```dotenv
JWT_SECRET=change_me
JWT_EXPIRY_MINUTES=60
HOST=0.0.0.0
PORT=8000
```

⚠️ **Change `JWT_SECRET` before any non-local use** — the default is insecure. Generate a strong one:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

> Note: CORS is currently `allow_origins=["*"]` and traffic must be HTTPS for biometric/credential
> data (NFR06). Narrow origins and terminate TLS before deploying.

## How It Works

- **Enrollment** — a collaborator's face embedding is registered server-side via a dedicated endpoint; the punch flow assumes prior enrollment ([ADR 0003](docs/adr/0003-defer-rf13-dedicated-enrollment.md)).
- **Punch** — two flows: authenticated (`POST /ponto/`, identity from the bearer token) and kiosk/blind (`POST /ponto/embarcado`, identity by 1:N face match). Both enforce BR01 and BR02.
- **Auth & roles** — password login issues a JWT (`sub`/`cpf`/`empresa_id`/`gerente`); role and company scope are read from the token ([ADR 0004](docs/adr/0004-role-authz-from-jwt-claim.md)).
- **Reports** — self history/daily summary for collaborators; company worked-hours + overtime for managers, company-scoped (BR06).

## Project Structure

```
presentation/   HTTP controllers, request/response schemas, DI
application/     use cases (business rules) + services
domains/         entities / models (and future contracts, exceptions)
infra/           repositories, DB, security (JWT), external tech
main.py          FastAPI app + router wiring
frontend/        React + Vite SPA
```

FastAPI conventions follow the [official full-stack template](https://github.com/fastapi/full-stack-fastapi-template),
adapted to our layering — [ADR 0001](docs/adr/0001-align-with-fastapi-template-conventions.md).

## Documentation

- **Project rules / conventions** — [`CLAUDE.md`](CLAUDE.md)
- **Product requirements + status** — [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- **Architecture decisions** — [`docs/adr/`](docs/adr/)
- **Git workflow** — Gitflow-lite, [ADR 0009](docs/adr/0009-gitflow-lite-branching.md)
- **Backlog** — [GitHub Issues](https://github.com/luucasorion/FaceClock/issues) (`P2`/`P3` + domain labels)
- **Archived task files** — [`docs/archive/`](docs/archive/)

## License

No license has been specified yet. Add a `LICENSE` file to define usage terms.
