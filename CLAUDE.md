# FaceClock — Project Rules

Rules for anyone (human or agent) working in this repo. Keep changes small, reviewable, and layered.

## Architecture (keep as-is)

FaceClock follows **clean architecture**. Dependencies point inward only:

```
presentation → application → domain
        ↘         ↘
          infra (implements domain contracts, wraps external tech)
```

| Layer | Directory | Holds | Never holds |
|---|---|---|---|
| presentation | `presentation/controller`, `presentation/schema`, `presentation/dependencies` | HTTP handlers, request/response DTOs, DI providers | business rules, SQL |
| application | `application/use_cases`, `application/services` | business rules, orchestration | HTTP, SQL, framework details |
| domain | `domains/models` (and future `domains/exceptions`, `domains/repositories`) | entities, contracts, domain exceptions | infra imports |
| infra | `infra/repositories`, `infra/db`, `infra/security` | SQLAlchemy, DeepFace, JWT, external tech | business rules |

**Stack is fixed:** Python, FastAPI, SQLAlchemy, SQLite, DeepFace, JWT. Do not introduce new frameworks or swap the stack.

## Conventions adopted from the official FastAPI full-stack template

Reference: https://github.com/fastapi/full-stack-fastapi-template — when a FastAPI convention is unclear, follow that template, **adapted to our clean-architecture layering** below.

1. **Dependency injection via a deps module.** Assemble sessions, repositories, services, and use cases in `presentation/dependencies/` using FastAPI `Depends` and `Annotated` type aliases (the template's `SessionDep` / `CurrentUser` pattern). Handlers must not hand-wire repos/services/use-cases inline. *(tracked: ARCH-4)*
2. **Pydantic Settings for config.** Centralize configuration (JWT secret, expiry, DB URL, CORS origins) in one Pydantic `Settings` object. No scattered `os.getenv` calls across modules.
3. **Alembic for schema migrations.** Schema changes go through Alembic revisions. Do **not** add ad-hoc `ALTER TABLE` / `CREATE INDEX IF NOT EXISTS` at startup in `main.py` — existing ones are debt to migrate out.
4. **Per-resource route modules, one aggregating router.** Keep one controller module per resource (already the pattern) and register them through a single API router include.
5. **Tooling:** `pytest` for tests, `ruff` for lint + format, `mypy` for type checking, `pre-commit` to run them. Add these before the codebase grows further.

## Deliberately NOT adopted from the template

- **SQLModel** — keep SQLAlchemy ORM models in `domains/models` + **separate** Pydantic request/response schemas in `presentation/schema`. (SQLModel would merge table and schema, collapsing a layer we keep intentional.)
- **PostgreSQL** — SQLite stays for now.
- **Docker / Traefik / generated frontend client** — out of scope.

## Concept mapping (template → FaceClock)

| Template | FaceClock equivalent |
|---|---|
| `app/api/routes/*` | `presentation/controller/*` |
| `app/api/deps.py` | `presentation/dependencies/*` |
| `app/core/config.py` | new: a Pydantic `Settings` (config module) |
| `app/core/security.py` | `infra/security/token_service.py` + `application/services/hash_service.py` |
| `app/crud.py` | `infra/repositories/*` (repository classes) |
| `app/models.py` | `domains/models/*` (ORM) + `presentation/schema/*` (DTOs) |
| `app/alembic/` | new: `alembic/` migrations |

## Working guardrails

- Controllers do HTTP only; business rules live in use cases; external tech lives in infra.
- Use cases must not raise `HTTPException` — raise domain exceptions, map them at the edge. *(tracked: ARCH-2)*
- Recognition threshold, punch interval, and other rule constants are defined **once** and reused.
- Never leak `senha` (hash), `facial` (embedding), tokens, or secrets in responses or logs (NFR04/NFR05).
- Prefer small, incremental, reviewable steps over large rewrites.

## Git workflow

Gitflow-lite — see [ADR 0009](docs/adr/0009-gitflow-lite-branching.md).

- `main` = production (tagged releases); `dev` = integration (default). Never commit directly to either.
- Branch off `dev`: `feat/<issue>-slug`, `fix/<issue>-slug`, `chore/<slug>`, `docs/<slug>`.
- Hotfixes branch off `main` (`hotfix/<issue>-slug`), then back-merge to `dev`.
- PR into `dev` (squash-merge), link the issue with `Closes #N`. Release = PR `dev → main` + tag `vX.Y.Z`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …).

## Where things are tracked

- **Work backlog:** GitHub Issues (labels: `P2`/`P3` + domain). The former `TASKS.md` / `TASKS_FRONTEND.md` are archived under `docs/archive/`.
- **Decisions:** `docs/adr/`.
- **Product/requirements + implementation status:** `PROJECT_CONTEXT.md`.
