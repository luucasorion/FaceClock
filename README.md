# FaceClock

Facial-recognition time clock. Collaborators punch in/out with their face; managers get
company-scoped attendance, worked-hours, and overtime reports. Built to make attendance
**identity-bound** and reduce HR reconciliation effort.

## Stack

- **Backend:** Python · FastAPI · SQLAlchemy · SQLite · DeepFace (ArcFace) · JWT
- **Frontend:** React + Vite + MUI (separate SPA in `frontend/`)

## Quickstart

**Backend** (from repo root):

```bash
pip install -r requirements.txt
python main.py
```

Serves on `http://localhost:8000`; interactive API docs at `/docs`. Config via environment
variables (a `.env` is loaded): `JWT_SECRET`, `JWT_EXPIRY_MINUTES`, `HOST`, `PORT`.

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev
```

## How it works

- **Enrollment** — a collaborator's face embedding is registered server-side via a dedicated
  endpoint; the punch flow assumes prior enrollment (see [ADR 0003](docs/adr/0003-defer-rf13-dedicated-enrollment.md)).
- **Punch** — two flows: authenticated (`POST /ponto/`, identity from the bearer token) and
  kiosk/blind (`POST /ponto/embarcado`, identity by 1:N face match). Both enforce the 0.65
  recognition threshold ([ADR 0008](docs/adr/0008-recognition-threshold-single-source.md)) and a
  5-minute minimum interval (BR02).
- **Reports** — self history/daily summary for collaborators; company-wide worked-hours + overtime
  (JSON/CSV) for managers, company-scoped (BR06).
- **Roles** — a `gerente` boolean carried in the JWT gates manager actions
  ([ADR 0007](docs/adr/0007-manager-as-boolean-flag.md), [ADR 0004](docs/adr/0004-role-authz-from-jwt-claim.md)).

## Architecture

Clean architecture — dependencies point inward: `presentation → application → domain`, with
`infra` implementing the outer edges. See [ADR 0002](docs/adr/0002-clean-architecture-layering.md).

```
presentation/   HTTP controllers, request/response schemas, DI
application/     use cases (business rules) + services
domains/         entities / models (and future contracts, exceptions)
infra/           repositories, DB, security (JWT), external tech
main.py          FastAPI app + router wiring
frontend/        React + Vite SPA
```

FastAPI conventions follow the [official full-stack template](https://github.com/fastapi/full-stack-fastapi-template),
adapted to our layering — see [ADR 0001](docs/adr/0001-align-with-fastapi-template-conventions.md).

## Project docs & process

| What | Where |
|---|---|
| Project rules / conventions | [`CLAUDE.md`](CLAUDE.md) |
| Decisions (ADRs) | [`docs/adr/`](docs/adr/) |
| Product requirements + implementation status | [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) |
| Work backlog | [GitHub Issues](https://github.com/luucasorion/FaceClock/issues) (`P2`/`P3` + domain labels) |
| Historical task files | [`docs/archive/`](docs/archive/) |

## Contributing

Work top-down by priority (`P2` → `P3`). Keep changes small and layered: controllers do HTTP only,
business rules live in use cases, external tech lives in infra. Never leak password hashes,
embeddings, or tokens in responses or logs. See [`CLAUDE.md`](CLAUDE.md) for the full rules.
