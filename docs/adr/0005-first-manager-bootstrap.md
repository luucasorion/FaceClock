# ADR 0005 — Bootstrap the first manager atomically on company creation

- **Status:** Accepted
- **Date:** 2026-06-24 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

There was a chicken-and-egg problem: public registration forces `gerente=False`, and the only
promotion path (`PUT /colaborador/{cpf}`) requires an *existing* manager. A brand-new company had
no API way to obtain its first manager.

## Decision

`POST /empresa` creates, in **one transaction**, a CNPJ-derived placeholder manager `Colaborador`:
`login = cnpj`, `senha = razao_social` (bcrypt-hashed, never plaintext), `gerente = True`,
`empresa_id = cnpj`, `facial = None`. `EmpresaRepository.criar_com_gestor` commits both rows or
neither. This is the **sole creation-time `gerente=True` path**; public registration stays
`gerente=False`.

## Consequences

- **Positive:** a new company can immediately log in as a manager; no manual seeding.
- **Negative / security:** the bootstrap credential is **predictable and public** (login = CNPJ,
  password = company name). This is acceptable only as a one-time bootstrap.
- **Required follow-up:** force a password change on first manager login so the predictable
  credential stops working — AUTHZ-4 ([#4](https://github.com/luucasorion/FaceClock/issues/4)),
  marked `# TODO(AUTHZ-4)` in `cadastro_empresa_usecase.py`. **Blocking for production.**

## Related

- Role authorization: [ADR 0004](0004-role-authz-from-jwt-claim.md).
