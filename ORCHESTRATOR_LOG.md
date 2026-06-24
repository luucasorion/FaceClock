# Orchestrator Run Log

**Run:** `orchestrator/all-2026-06-23` · scope=all · mode=unattended
**Started:** 2026-06-23
**Baseline:** smoke gate green (21 routes, exit 0) on commit fe5ff9c.

Ordering: backend (`TASKS.md`) by priority P0→P3 respecting dependencies, then
frontend (`TASKS_FRONTEND.md`). AUTHZ-1 is a key unblocker (JWT `gerente` claim)
for AUTHZ-2, AUTH-4 claims shape, and the frontend manager flow.

---

## Cycles

### Cycle 1 — RECOG-1 (P0, `TASKS.md`) — ✅ DONE
- **Selected:** RECOG-1 (align recognition thresholds to BR01 = 0.65), highest-priority open gap.
- **Architecture:** plan accepted — single `LIMIAR_RECONHECIMENTO` constant in `facial_service.py`; no new config module; mirrors the `INTERVALO_MINIMO` single-source pattern.
- **Implementation:** facial_service.py (constant + `validar_rosto` default), batida_ponto_embarcado_usecase.py (import + `< 0.65` cutoff). Login flow unchanged (inherits default).
- **Verify:** smoke green (21 routes); no stray 0.6/0.4 literals; qa PASS (boundary inclusive at 0.65, best-match-then-cutoff preserved, embarcado initializer `0` is below threshold).
- **Commit:** `541165e`.
- **Task files:** RECOG-1 moved to §4 done; §3 snapshot + PROJECT_CONTEXT §21/§23 updated.
- **qa note (for human):** raising embarcado 0.4→0.65 tightens blind recognition; may reject more legitimate punches — recognition-quality concern, not a defect.
- **Next:** AUTHZ-1 (P1) — surface `gerente` in JWT claims + `ColaboradorResponse` + controlled promotion (key unblocker).

### Cycle 2 — AUTHZ-1 (P1, `TASKS.md`) — ✅ DONE
- **Selected:** AUTHZ-1 (was "in progress"); key unblocker for AUTHZ-2, AUTH-4 claims shape, and the frontend manager flow.
- **Architecture:** plan accepted — 4 edits (login dict, DTO field, login claims, registration claims); promotion stays manager-only (no new mechanism); flagged Gap1↔Gap2 coupling on `ColaboradorResponse(**result)`.
- **Implementation:** the 4 edits + qa-identified cleanup (removed the ignored `gerente` from the public `RegistroColaboradorRequest`). 5 files.
- **Verify:** smoke green (21 routes); response DTO has no senha/facial; qa PASS (claims identical across both token sites, no self-promotion hole, all DTO construction sites valid).
- **Commit:** `d42217d`.
- **Task files:** AUTHZ-1 moved to §4 done; §3 snapshot + PROJECT_CONTEXT §24 updated.
- **Follow-ons recorded (not blocking):** (1) AUTHZ-2 — `require_manager` should read the new claim vs DB re-query; (2) first-manager bootstrap (no API path mints the first manager) → seed/CLI, never reopen public registration. **(2) is a product decision flagged for the human; default kept safe.**
- **Next:** AUTHZ-2 (P1) — now unblocked; switch `require_manager` to read the `gerente` claim (with DB fallback for legacy tokens).


