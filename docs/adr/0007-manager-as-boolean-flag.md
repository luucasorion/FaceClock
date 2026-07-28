# ADR 0007 — Model the manager role as a boolean, not a separate entity

- **Status:** Accepted
- **Date:** 2026-06-23 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

RF02/BR03 distinguish two access profiles: Manager and Collaborator. This could be a separate
entity/role table or a flag on the collaborator. FaceClock has exactly two roles and no
per-permission granularity.

## Decision

Model the role as a **`gerente` boolean on `Colaborador`** (default `False`, not null). It is
surfaced in the JWT claims (login and registration tokens carry an identical claim set:
`sub` / `cpf` / `empresa_id` / `gerente`) and in `ColaboradorResponse`. It is settable only via the
manager-gated `PUT /colaborador/{cpf}` and the company-creation bootstrap
([ADR 0005](0005-first-manager-bootstrap.md)); public registration cannot self-promote.

## Consequences

- **Positive:** minimal model; role travels in the token, enabling stateless authorization
  ([ADR 0004](0004-role-authz-from-jwt-claim.md)).
- **Negative:** no room for additional roles or fine-grained permissions without revisiting this;
  a full RBAC model would supersede this ADR.

## Related

- Authorization: [ADR 0004](0004-role-authz-from-jwt-claim.md).
