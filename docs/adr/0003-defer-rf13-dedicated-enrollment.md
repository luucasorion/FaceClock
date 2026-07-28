# ADR 0003 — Defer RF13; dedicated enrollment endpoint is the official flow

- **Status:** Accepted
- **Date:** 2026-06-22 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

RF13 asks the system to register a collaborator's facial biometrics on their **first punch**.
Implementing enroll-on-first-punch complicates the punch flow (branching between "enroll" and
"authenticate", partial-failure handling) for a low-frequency, one-time event.

## Decision

RF13 is **out of MVP scope**. Enrollment happens through the dedicated endpoint
`POST /colaborador/registro/cadastrar-biometria`, which extracts the embedding server-side and
binds it to the authenticated token holder. The punch flow **assumes the collaborator is already
enrolled**: a punch with no stored embedding fails with a validation error — it must **never**
auto-enroll.

## Consequences

- **Positive:** the punch flow stays single-purpose and fast (NFR: ~3s punch).
- **Negative:** a collaborator cannot punch until enrolled; onboarding requires an explicit step.
- **Future:** if RF13 is re-prioritized, add it as a separate, explicit flow — do not fold
  auto-enroll into punch.
- Consolidating the two enrollment paths (in-body `facial` vs server-side) is tracked as
  BIO-1 ([#5](https://github.com/luucasorion/FaceClock/issues/5)).

## Related

- Business rules: `PROJECT_CONTEXT.md` (RF04, RF13).
