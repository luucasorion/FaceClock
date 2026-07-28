# ADR 0008 — Single recognition threshold of 0.65 (BR01)

- **Status:** Accepted
- **Date:** 2026-06-23 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

BR01 requires a minimum facial-recognition similarity of **0.65** for a valid punch. Previously the
threshold was duplicated and inconsistent: `validar_rosto` defaulted to `0.6`, the login punch used
that default silently, and the embarcado punch used a literal `0.4` — both accepting faces that
should be rejected.

## Decision

Define the threshold **once** as `LIMIAR_RECONHECIMENTO = 0.65` in
`application/services/facial_service.py` and reuse it everywhere. The login punch inherits it via
`validar_rosto`'s default; the embarcado punch imports the constant for its cutoff. Acceptance is
inclusive at the boundary (0.65 accepted). No recognition literal `0.6`/`0.4` may remain in punch
logic.

## Consequences

- **Positive:** the rule lives in one place and cannot drift between the two punch flows.
- **Negative:** raising the embarcado cutoff `0.4 → 0.65` tightens behavior — some legitimate blind
  recognitions may now be rejected. This is a recognition-quality concern for QA to tune, not an
  architecture one.

## Related

- Both punch flows: `application/use_cases/ponto/*`.
