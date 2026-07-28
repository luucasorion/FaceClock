# ADR 0001 — Adopt selective conventions from the FastAPI full-stack template

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** lucas.orion

## Context

FaceClock is a FastAPI backend built on a clean-architecture layout
(`presentation / application / domain / infra`) with SQLAlchemy + SQLite, JWT, and
DeepFace. Several conventions were never standardized: dependency wiring is copy-pasted
into every handler, configuration is read via scattered `os.getenv` calls, schema changes
are applied as ad-hoc `ALTER TABLE` / `CREATE INDEX` statements at startup in `main.py`,
and there is no test / lint / type-check tooling.

The official [FastAPI full-stack template](https://github.com/fastapi/full-stack-fastapi-template)
is the reference implementation for FastAPI practice. It uses `app/api/routes/*` +
`app/api/deps.py` (`SessionDep` / `CurrentUser`), Pydantic `Settings` in `core/config.py`,
Alembic migrations, and pytest + ruff + mypy + pre-commit — but also SQLModel and PostgreSQL,
which would collapse our deliberate model/schema separation and change our datastore.

## Decision

Use the template as the **convention reference**, adopting **selectively** and adapting to our
clean-architecture layering. We keep our layers, SQLAlchemy, and SQLite.

**Adopt:**

1. Dependency injection via a `deps` module (FastAPI `Depends` + `Annotated` aliases, the
   `SessionDep` / `CurrentUser` pattern) in `presentation/dependencies/`; stop hand-wiring in handlers.
2. A single Pydantic `Settings` object for configuration.
3. Alembic for schema migrations; retire the startup DDL in `main.py`.
4. Per-resource route modules aggregated by one API router.
5. Tooling: pytest, ruff, mypy, pre-commit.

**Do not adopt:**

- SQLModel — keep SQLAlchemy ORM models (`domains/models`) separate from Pydantic DTOs (`presentation/schema`).
- PostgreSQL — SQLite stays.
- Docker / Traefik / generated frontend client.

## Consequences

- **Positive:** wiring, config, and migrations gain one canonical pattern each; the codebase
  becomes testable and CI-checkable; new contributors have an external reference for "the FastAPI way."
- **Negative / cost:** real migration work — this decision motivates issues ARCH-2 (domain
  exceptions), ARCH-3 (repository contracts), ARCH-4 (DI providers), plus new work for a Settings
  object and an Alembic setup. Existing startup `ALTER TABLE`/index code is now debt to remove.
- **Compatibility:** clean-architecture layering (the other ADRs) is preserved; this ADR governs
  conventions *within* those layers, not a re-layering.

## Related

- Rule file: `/CLAUDE.md`
- Issues: [#8 ARCH-2](https://github.com/luucasorion/FaceClock/issues/8), [#9 ARCH-3](https://github.com/luucasorion/FaceClock/issues/9), [#10 ARCH-4](https://github.com/luucasorion/FaceClock/issues/10)
