# ADR 0002 — Clean-architecture layering

- **Status:** Accepted
- **Date:** 2026-07-28 (records a decision in force since project start)
- **Deciders:** lucas.orion

## Context

FaceClock needs correctness of identification, secure auth, and testable business rules
(punch validity, overtime, role/company scoping). Mixing HTTP, business logic, and persistence
in one place makes those rules hard to test and reason about.

## Decision

Organize the backend in four layers with dependencies pointing inward only:

- **presentation** (`presentation/`) — HTTP handlers, request/response DTOs, DI providers.
- **application** (`application/`) — business rules and orchestration (use cases, services).
- **domain** (`domains/`) — entities, contracts, domain exceptions.
- **infra** (`infra/`) — SQLAlchemy, DeepFace, JWT, and other external tech.

Controllers handle HTTP only; use cases hold business rules; infra holds external tech.
The stack is fixed: Python, FastAPI, SQLAlchemy, SQLite, DeepFace, JWT.

## Consequences

- **Positive:** business rules are testable without HTTP or a DB; external tech is swappable at the edges.
- **Negative:** more files/indirection than a flat layout; some ceremony for small features.
- **Open debt (tracked as issues):** HTTPException still raised in use cases (ARCH-2, #8);
  no repository contracts yet (ARCH-3, #9); wiring is hand-rolled per handler (ARCH-4, #10);
  `FacialService` still sits in `application/` (ARCH-1, #7).

## Related

- Conventions *within* these layers: [ADR 0001](0001-align-with-fastapi-template-conventions.md).
- Rule file: `/CLAUDE.md`.
