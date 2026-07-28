# ADR 0004 — Authorize roles from the JWT claim, not a DB re-query

- **Status:** Accepted
- **Date:** 2026-06-23 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

BR03 restricts report export and edit/delete of collaborator/company data to managers; BR06
restricts a collaborator to their own company. The manager role is a `gerente` boolean carried
in the JWT (see [ADR 0007](0007-manager-as-boolean-flag.md)). `require_manager` could either
re-query the collaborator's current role from the DB on every request, or trust the token claim.

## Decision

`require_manager` authorizes off the **`gerente` JWT claim** (`payload.get("gerente")`),
fail-closed, without re-querying the database. Company scoping (BR06) is likewise enforced from
the `empresa_id` claim. `auth.py` therefore has no DB/session dependency.

## Consequences

- **Positive:** authorization is a cheap, stateless claim check; the auth dependency stays free
  of persistence.
- **Accepted trade-off:** a demoted or deactivated manager keeps manager access **until their
  token expires** (≤ `JWT_EXPIRY_MINUTES`, default 60). Live revocation / short expiry is
  deferred as a separate decision if needed.
- Legacy pre-role tokens get a clean 403 and self-heal on re-login.

## Related

- Role field: [ADR 0007](0007-manager-as-boolean-flag.md).
- Bootstrap of the first manager: [ADR 0005](0005-first-manager-bootstrap.md).
