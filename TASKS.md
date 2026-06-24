# FaceClock — Tasks

## 1. How to read this file

This file is the **actionable work backlog** for FaceClock. It complements `PROJECT_CONTEXT.md`:

- `PROJECT_CONTEXT.md` is the source of truth for **product intent, requirements, and verified implementation state**.
- `TASKS.md` (this file) translates the gaps found in the latest code review into **concrete, reviewable units of work**. Last synced with the real codebase on **2026-06-23**.

Read order:

1. Start with **Section 3 — Current Project Completion Snapshot** to understand what already exists.
2. **Section 4 — ✅ Done** lists completed tasks (kept for traceability and acceptance evidence).
3. **Section 5 — 🚧 To do / In progress** is the live work queue. Work it top-down by priority: **P0 → P1 → P2 → P3**.
4. Each task is self-contained: it states why it exists, what to do, which files it touches, and how to know it is done.
5. Tasks reference **real files** in this repository. Always confirm the current file state before starting (some "empty" files exist as placeholders).
6. Do not start a build-from-scratch task on something already implemented — check the snapshot and the task wording (`implement` vs `complete/fix/refine`).

Architectural guardrails (from `PROJECT_CONTEXT.md` §13 and the architecture agent rules) apply to every task:

- Controllers handle HTTP only; business rules live in use cases; persistence/external tech lives in infra.
- Do not introduce new frameworks or replace the stack (Python, FastAPI, SQLAlchemy, SQLite, DeepFace, JWT).
- Prefer small, incremental, reviewable steps over large rewrites.

---

## 2. Priority Legend

**Priority levels**

| Priority | Meaning |
|---|---|
| **P0** | Critical / deliverable-blocking. Affects punch validity, security, or makes the system unsafe to demo. Do first. |
| **P1** | Core minimum product. Required for FaceClock to fulfill its primary requirements (CRUD, history, reports, roles). |
| **P2** | Important secondary. Robustness, validation, edge cases, response shaping, open product decisions. |
| **P3** | Cleanup / refactor / maintainability. Architectural debt; non-blocking but improves quality and future work. |

**Status labels**

| Status | Meaning |
|---|---|
| `todo` | Not started. |
| `in progress` | Actively being worked on. |
| `blocked` | Cannot proceed; depends on another task or an open decision. |
| `done` | Completed and acceptance criteria met. |

---

## 3. Current Project Completion Snapshot

Based on the real code review of 2026-06-23 (re-audited against code on 2026-06-23), updated as tasks complete. See `PROJECT_CONTEXT.md` §15–25 for detailed flow descriptions, domain model, and known gaps.

**At a glance**

| Group | Tasks |
|---|---|
| ✅ Done | AUTH-1, AUTH-2, AUTH-3, BIO-3, PUNCH-1, EMPRESA-1, EMPRESA-2, REPORT-1, REPORT-2, REPORT-3, REPORT-4, COLAB-1, COLAB-2, PUNCH-2, BIO-2, RECOG-1, AUTHZ-1 |
| 🚧 In progress | AUTHZ-2, API-1 |
| ⬜ To do | AUTH-4, COLAB-3, REPORT-6, REPORT-5, PUNCH-3, BIO-1, RECOG-2, ARCH-1, ARCH-2, ARCH-3, ARCH-4 |

> Note (2026-06-23 re-audit): `application/use_cases/ponto/get_ponto_usecase.py` no longer exists — its history-grouping logic was relocated to `application/use_cases/relatorio/` (`_agrupamento.py` + the report use cases). Task file-references were corrected accordingly.

### Implemented (confirmed in code)
- Collaborator registration with CPF/login uniqueness and bcrypt password hashing — `application/use_cases/colaborador/registrar_colaborador_usecase.py`, `application/services/hash_service.py`.
- Facial embedding enrollment via dedicated endpoint with server-side DeepFace (ArcFace) extraction; the enrolled embedding is bound to the authenticated token holder (`current_colaborador["sub"]`), not a client-supplied body field — `application/use_cases/ponto/cadastrar_biometria_usecase.py`, `presentation/controller/colaborador_controller.py` (BIO-3 done).
- Login-based punch with face validation; the punching collaborator's identity comes from the bearer token (`current_colaborador["sub"]`), not a body field — `application/use_cases/ponto/batida_ponto_usecase.py`, `presentation/controller/batida_ponto_controller.py`.
- Blind (embarcado) punch with recognition across all stored embeddings — `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`.
- **BR02 5-minute interval enforced** in both punch flows via a single `INTERVALO_MINIMO` constant and a `buscar_ultima_por_colaborador` last-punch query — `infra/repositories/batida_ponto_repository.py`, `application/use_cases/ponto/batida_ponto_usecase.py`, `batida_ponto_embarcado_usecase.py` (PUNCH-1 done).
- Password login with JWT — `application/use_cases/colaborador/login_colaborador_usecase.py`, `infra/security/token_service.py` (AUTH-1 done).
- Safe login/registration response DTO — `presentation/schema/responses/colaborador_response.py` (AUTH-2 done).
- **Auth dependency applied to routes** — `get_current_colaborador()` protects login-based punch, biometric enrollment, and collaborator/report reads; `require_manager` gates collaborator edit/deactivate, empresa edit/deactivate, and company reports. Public endpoints (login, registration, embarcado kiosk punch) are documented inline (AUTH-3 done).
- **Collaborator get/list** — `GetColaboradorUseCase` (self profile + company-scoped manager list, active-only); endpoints `GET /colaborador/me` and `GET /colaborador/` (manager-only) (COLAB-1 done).
- **Collaborator edit/deactivate** — `EdicaoColaboradorUseCase` with field edits, password re-hash, BR06 company-scope guard, self- and last-active-manager deactivation guards; manager-gated `PUT/DELETE /colaborador/{cpf}` (COLAB-2 done).
- **`gerente` boolean on `Colaborador`** with a startup `ALTER TABLE` migration — `domains/models/colaborador.py`, `main.py` (AUTHZ-1 partial — persisted and settable, but not yet in JWT claims or response DTOs, and registration still hard-codes `gerente=False`).
- **Empresa CRUD** — `CadastroEmpresaUseCase` (CNPJ uniqueness), `GetEmpresaUseCase` (by CNPJ / list), `EdicaoEmpresaUseCase` (edit + soft-deactivate with domain-level company-scope check), backed by `EmpresaRepository` (EMPRESA-1 done).
- **Empresa controller mounted** — `/empresa` REST endpoints with `require_manager` on edit/deactivate; router registered in `main.py` (EMPRESA-2 done).
- **Attendance history + reports** — `BatidaPontoRepository.listar_por_colaborador`/`listar_por_empresa`, the `application/use_cases/relatorio/` package (history + worked-hours), entry/exit `tipo` derived by sequence position, and a mounted `/relatorio` controller (self history + manager company report, JSON/CSV) (REPORT-1, REPORT-2, REPORT-3, REPORT-4, PUNCH-2 done).
- Facial service: embedding, cosine similarity, threshold validation — `application/services/facial_service.py`.
- Domain models `Colaborador`, `Empresa`, `BatidaPonto` — `domains/models/`.
- `ColaboradorRepository` full CRUD + soft delete + `contar_gerentes_ativos` — `infra/repositories/colaborador_repository.py`.
- `EmpresaRepository` create/get/list/update/soft-deactivate — `infra/repositories/empresa_repository.py`.
- `BatidaPontoRepository` with `salvar`, `buscar_ultima_por_colaborador`, `listar_por_colaborador`, `listar_por_empresa` — `infra/repositories/batida_ponto_repository.py`.
- Response DTOs `ColaboradorResponse`, `EmpresaResponse`, history/report DTOs; request DTOs for empresa + collaborator edit — `presentation/schema/`.
- SQLite + auto schema creation + lightweight `gerente` migration at startup — `infra/db/database.py`, `main.py`.

### Partially implemented
- **Authorization (AUTHZ)**: `gerente` is persisted and now surfaced in the JWT claims (login + registration tokens, identical shape) and in `ColaboradorResponse` (AUTHZ-1 done); `require_manager` is built and applied broadly (empresa edit/deactivate, collaborator edit/deactivate, company reports); BR06 company scoping is enforced on collaborator edit/deactivate, collaborator listing, and reports. Controlled promotion is intentionally manager-only via `PUT /colaborador/{cpf}`; public registration stays `gerente=False`. **Remaining (AUTHZ-2)**: `require_manager` still re-queries the DB instead of reading the new `gerente` claim. **Known follow-on**: no API path creates the first manager (bootstrap chicken-and-egg) — resolve via seed/CLI, not by reopening public registration.
- **Punch thresholds**: aligned to BR01 (0.65) via a single `LIMIAR_RECONHECIMENTO` constant in `facial_service.py`, reused by the login punch (`validar_rosto` default) and the embarcado punch cutoff (RECOG-1 done).
- **Response shaping (API-1)**: collaborator and empresa endpoints use response DTOs, but punch endpoints still return ad-hoc dicts and login returns a hand-built dict.
- **Domain model**: no dedicated PunchProfile entity — `Empresa.limite_hora` is the only hour limit.

### Still missing
- Bearer token issued on registration (AUTH-4).
- Daily self punch-summary endpoint — "today's punches" (REPORT-6).
- Composite DB indexes + pagination on punch history queries (REPORT-5).
- Punch robustness: a live `TypeError` when an unenrolled collaborator punches via the login flow (`None`-guard on `colaborador.facial`), plus FacialService error translation and upload validation (PUNCH-3).
- Single hardened enrollment path — registration still accepts a client-supplied `facial` list alongside the dedicated server-side endpoint (BIO-1).
- Company existence/active validation at registration (RECOG-2).
- Punch/login output DTOs (API-1 remainder); domain exceptions (ARCH-2); repository interfaces (ARCH-3); centralized DI wiring (ARCH-4); `FacialService` relocated to `infra/` (ARCH-1).
- RF13 (biometrics on first punch) — out of MVP scope; dedicated enrollment endpoint is the official flow.

---

## 4. ✅ Done

Completed tasks, grouped by priority. Retained for traceability and acceptance evidence.

### [AUTH-1] Implement JWT token service and issue tokens on login
- **Priority:** P0
- **Status:** done
- **Why it exists:** No JWT existed in the codebase. Login only validated the password and returned the raw ORM object.
- **What was done:**
  - `infra/security/token_service.py` — `TokenService` with `gerar_token(payload)` and `validar_token(token)` (HS256, expiry via `JWT_EXPIRY_MINUTES` env var).
  - `POST /auth/login` now returns a signed JWT + `ColaboradorResponse` DTO.
- **Relevant files / areas:**
  - `infra/security/token_service.py`
  - `application/use_cases/colaborador/login_colaborador_usecase.py`
  - `presentation/controller/login_controller.py`
- **Done when:**
  - ✅ Login returns a signed JWT without the password hash.
  - ✅ Token service encodes/decodes with configurable expiry.
  - ✅ Secret read from environment, not hard-coded.

### [AUTH-2] Stop leaking the password hash on login (output DTO)
- **Priority:** P0
- **Status:** done
- **Why it exists:** Login returned the raw `Colaborador` ORM object including the bcrypt hash.
- **What was done:**
  - `presentation/schema/responses/colaborador_response.py` — `ColaboradorResponse` with safe fields only (`cpf`, `nome`, `login`, `empresa_id`, `status`); excludes `senha` and `facial`.
  - Login and registration endpoints use this DTO.
- **Relevant files / areas:**
  - `presentation/schema/responses/colaborador_response.py`
  - `presentation/controller/login_controller.py`
  - `presentation/controller/colaborador_controller.py`
- **Done when:**
  - ✅ No endpoint response includes `senha`.
  - ✅ Login and registration return `ColaboradorResponse`.

### [AUTH-3] Add authentication dependency and protect routes
- **Priority:** P0
- **Status:** done
- **Why it exists:** No routes were protected despite the auth dependency being built.
- **What was done:**
  - `presentation/dependencies/auth.py` — `get_current_colaborador()` (validates via `TokenService`, raises 401 at the boundary on invalid/expired token) and `require_manager()` dependencies.
  - `Depends(get_current_colaborador)` applied to login-based punch (`POST /ponto/`) and biometric enrollment (`POST /colaborador/registro/cadastrar-biometria`).
  - Login-based punch now derives identity from the token (`current_colaborador["sub"]`) instead of a body `login` field.
  - Empresa list/get require authentication; empresa edit/deactivate require `require_manager`. (Collaborator and report routes added their guards under COLAB-1/COLAB-2/REPORT-3.)
  - Public endpoints documented inline: `POST /auth/login`, `POST /colaborador/registro/`, `POST /ponto/embarcado` (kiosk — identity via facial recognition).
- **Relevant files / areas:**
  - `presentation/dependencies/auth.py`
  - `presentation/controller/batida_ponto_controller.py`, `colaborador_controller.py`, `login_controller.py`, `empresa_controller.py`
- **Done when:**
  - ✅ Protected endpoints reject unauthenticated requests with 401.
  - ✅ Intentionally public endpoints are explicitly documented.
  - ✅ The current collaborator identity is available in all protected handlers.

### [BIO-3] Derive biometric-enrollment identity from the bearer token, not a body field
- **Priority:** P0
- **Status:** done
- **Why it exists:** `POST /colaborador/registro/cadastrar-biometria` took the target `login` from a `Form(...)` field and passed it straight into `CadastrarBiometriaUseCase`, while the authenticated `current_colaborador` token was required but **ignored**. Any authenticated collaborator could therefore enroll (or overwrite) the facial embedding of *any other* collaborator by supplying a different `login`. Enrollment must be bound to the token holder, mirroring how login-based punch derives identity from `current_colaborador["sub"]` (AUTH-3).
- **What was done (2026-06-23):**
  - Removed the `login: str = Form(...)` parameter from `cadastrar_biometria` in `presentation/controller/colaborador_controller.py`.
  - The use-case call now passes `login=current_colaborador["sub"]`, deriving the target identity from the token claim (JWT `sub` = login convention), mirroring the AUTH-3 punch pattern in `batida_ponto_controller.py`.
  - Removed the now-unused `Form` import (verified no other handler in the file uses it).
  - **Approach chosen: self-enrollment only.** Manager-assisted cross-enrollment was intentionally *not* added, as it would depend on `gerente` in JWT claims (AUTHZ-1) and a collaborator-level BR06 company-scope check (COLAB-2 / AUTHZ-2). If product later needs it, add a separate manager endpoint taking the target as a path param under `require_manager` + an explicit `empresa_id` scope check — never reintroduce a free-form body `login`.
  - `cadastrar_biometria_usecase.py` and `presentation/dependencies/auth.py` were left unchanged.
- **Relevant files / areas:**
  - `presentation/controller/colaborador_controller.py` (`cadastrar_biometria`)
  - `application/use_cases/ponto/cadastrar_biometria_usecase.py`
  - `presentation/dependencies/auth.py` (`get_current_colaborador`, `require_manager`)
- **Done when:**
  - ✅ The enrollment endpoint no longer accepts a client-supplied `login`.
  - ✅ The enrolled embedding is always bound to the authenticated token holder (`current_colaborador["sub"]`).
  - ✅ A collaborator cannot enroll biometrics for an arbitrary other collaborator.

### [PUNCH-1] Enforce BR02 (block punches within 5 minutes of the previous one)
- **Priority:** P0
- **Status:** done
- **Why it exists:** BR02 requires blocking a new punch if the interval since the immediately previous punch is under 5 minutes. It was not enforced anywhere, and `BatidaPontoRepository` had only `salvar`, so the last punch could not even be queried.
- **What was done (verified 2026-06-23):**
  - `BatidaPontoRepository.buscar_ultima_por_colaborador(colaborador_id)` — most recent `BatidaPonto`, ordered `batida DESC`, `.first()` — `infra/repositories/batida_ponto_repository.py`.
  - A single `INTERVALO_MINIMO = timedelta(minutes=5)` constant defined in `batida_ponto_usecase.py` and reused by both flows (`batida_ponto_embarcado_usecase.py` imports it), so the interval cannot drift.
  - Both punch use cases compute the delta from the last punch and reject `< 5 min` (HTTP 429), using `datetime.utcnow()` consistent with `BatidaPonto.batida`'s default.
- **Relevant files / areas:**
  - `infra/repositories/batida_ponto_repository.py`
  - `application/use_cases/ponto/batida_ponto_usecase.py`
  - `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`
  - `domains/models/batida_ponto.py`
- **Done when:**
  - ✅ A second punch for the same collaborator within 5 minutes is rejected with a clear error.
  - ✅ A punch after 5+ minutes succeeds.
  - ✅ The last-punch query exists on the repository and is unit-testable.

### [EMPRESA-1] Implement Empresa CRUD use cases
- **Priority:** P1
- **Status:** done
- **Why it exists:** RF01/RF05 require company registration, editing, and deactivation. All empresa use cases were empty and there was no `EmpresaRepository`.
- **What was done:**
  - `EmpresaRepository` (`criar`, `buscar_por_cnpj`, `listar`, `atualizar`, `desativar` soft delete) — `infra/repositories/empresa_repository.py`.
  - `CadastroEmpresaUseCase` — CNPJ uniqueness check, persists `razao_social`, `endereco`, `limite_hora`, `status=True`.
  - `GetEmpresaUseCase` — `por_cnpj` (404 if missing) and `listar`.
  - `EdicaoEmpresaUseCase` — partial field edit and `desativar`; both accept `requester_cnpj`/`target_cnpj` and assert they match (domain-level company-scope guard).
  - `CadastroEmpresaRequest`, `EdicaoEmpresaRequest`, `EmpresaResponse` schemas added.
- **Relevant files / areas:**
  - `application/use_cases/empresa/cadastro_empresa_usecase.py`, `get_empresa_usecase.py`, `edicao_empresa_usecase.py`
  - `infra/repositories/empresa_repository.py`
  - `presentation/schema/requests/cadastro_empresa_request.py`, `edicao_empresa_request.py`, `presentation/schema/responses/empresa_response.py`
  - `domains/models/empresa.py`
- **Done when:**
  - ✅ A company can be created, fetched, listed, edited, and deactivated through use cases.
  - ✅ CNPJ uniqueness is enforced on create.
  - ✅ Deactivation is a soft delete (`status = False`).
- **Follow-up (tracked elsewhere):** the use cases raise `HTTPException` directly — to be replaced with domain exceptions under ARCH-2.

### [EMPRESA-2] Implement and mount the Empresa controller
- **Priority:** P1
- **Status:** done
- **Why it exists:** `empresa_controller.py` was empty and not registered in `main.py`, so company endpoints were unreachable.
- **What was done:**
  - `/empresa` router with `POST` (create, public), `GET ""`/`GET /{cnpj}` (authenticated), `PUT /{cnpj}` and `DELETE /{cnpj}` (manager-only) wired to the EMPRESA-1 use cases.
  - `require_manager` applied to edit/deactivate; the use case re-checks `requester_cnpj == target_cnpj` (the token's `empresa_id` is passed in), so role-only access cannot edit another company (BR06).
  - Router registered in `main.py` (`app.include_router(empresaRouter)`).
- **Relevant files / areas:**
  - `presentation/controller/empresa_controller.py`
  - `main.py`
  - `presentation/dependencies/auth.py`
- **Done when:**
  - ✅ Company endpoints are reachable and documented in the OpenAPI schema.
  - ✅ Edit/deactivate require a manager token and are company-scoped.
  - ✅ The router is included in `main.py`.
- **Open point:** `POST /empresa` (company creation) is currently unauthenticated — revisit who may create companies once the bootstrap/manager-provisioning story is settled (ties into AUTHZ-1).

### [REPORT-1] Implement attendance history retrieval (RF09)
- **Priority:** P1
- **Status:** done
- **Why it exists:** History retrieval was empty and `BatidaPontoRepository` had no query methods, so monthly punch history (RF09) and manager consultation (RF10) could not be served.
- **What was done (verified 2026-06-23):**
  - `BatidaPontoRepository.listar_por_colaborador(colaborador_id, data_inicio, data_fim)` and `listar_por_empresa(empresa_id, data_inicio, data_fim)` (the latter joins through `Colaborador` on `empresa_id`); both ordered `batida ASC` — `infra/repositories/batida_ponto_repository.py`.
  - History retrieval + per-day grouping live in the `application/use_cases/relatorio/` package (`historico_colaborador_usecase.py` + `_agrupamento.py`); `tipo` is derived per `(day, colaborador_id)` (see PUNCH-2).
  - DTOs in `presentation/schema/responses/historico_ponto_response.py` (`BatidaItemResponse` with `tipo`, `DiaHistoricoResponse`, `HistoricoPontoResponse`).
  - Wired and mounted: `GET /relatorio/historico` and `GET /relatorio/empresa/{empresa_id}` with auth + BR06 scoping (done in REPORT-3).
- **Relevant files / areas:**
  - `application/use_cases/relatorio/historico_colaborador_usecase.py`, `_agrupamento.py`
  - `infra/repositories/batida_ponto_repository.py`
  - `presentation/schema/responses/historico_ponto_response.py`
  - `domains/models/batida_ponto.py`
- **Done when:**
  - ✅ The use case can retrieve a collaborator's punch history.
  - ✅ The use case can retrieve company-scoped history.
  - ✅ Queries support a date range and are unit-testable.
  - ✅ Exposed via a controller and mounted (REPORT-3).
- **Note:** the original task named `application/use_cases/ponto/get_ponto_usecase.py`; that file no longer exists — the logic moved into the `relatorio/` package (REPORT-4).

### [REPORT-2] Implement worked-hours and overtime calculation (RF11, BR04, BR05)
- **Priority:** P1
- **Status:** done
- **Why it exists:** No worked-hours or overtime logic existed. RF11 requires daily worked hours and overtime; BR04 counts only the portion exceeding the company's hour limit; BR05 flags collaborators exceeding the overtime limit. `Empresa.limite_hora` is the only hour limit modeled.
- **Classification strategy (2026-06-23):** Punch type is derived from sequence position (odd = entry, even = exit — see PUNCH-2). No `tipo` column is stored. The calculation uses index-based pairing directly: punch[0]+punch[1] = first pair, punch[2]+punch[3] = second pair, etc.
- **What was done:**
  - `application/use_cases/relatorio/horas_trabalhadas_usecase.py` — `HorasTrabalhadasUseCase` with entry point `executar(dias, limite_hora)`. Pure calculation: no repository, HTTP, FastAPI, SQLAlchemy or presentation imports. Returns layer-neutral dataclasses (`HorasTrabalhadasResult`, `DiaHorasResult`, `AnomaliaResult`).
  - Index-based pairing of each day's `batidas`; BR04 overtime clamp `max(0, total - limite_hora*60)`; BR05 per-day `excedeu_limite = overtime > 0`; odd-count days record the trailing unpaired punch in `anomalias`.
  - `application/use_cases/relatorio/__init__.py` created.
  - `presentation/schema/responses/horas_trabalhadas_response.py` — `AnomaliaResponse`, `DiaHorasResponse`, `HorasTrabalhadasResponse`.
- **Relevant files / areas:**
  - `application/use_cases/relatorio/__init__.py`
  - `application/use_cases/relatorio/horas_trabalhadas_usecase.py`
  - `presentation/schema/responses/horas_trabalhadas_response.py`
  - `domains/models/empresa.py` (`limite_hora`)
- **Done when:**
  - ✅ Daily worked hours and overtime are computed correctly for a well-formed sequence of punches.
  - ✅ Overtime counts only the excess over `limite_hora`; never negative.
  - ✅ Days with an odd punch count are handled without crashing — the unpaired punch is recorded in `anomalias`.
  - ✅ The use case has no repository or HTTP dependency and can be unit-tested with a plain list of datetimes.
- **Wired (2026-06-23):** called per-collaborator from `relatorio_controller.py` (`GET /relatorio/empresa/{empresa_id}`).

### [REPORT-3] Implement and mount the report controller (RF10, RF12)
- **Priority:** P1
- **Status:** done
- **Why it exists:** `relatorio_controller.py` was empty and not mounted in `main.py`. RF10 (manager consults all company collaborators) and RF12 (generate/export reports) had no endpoint.
- **What was done (2026-06-23):**
  - `presentation/controller/relatorio_controller.py` — `router = APIRouter(prefix="/relatorio", tags=["Relatorio"])` with two endpoints, wired inline (`get_db` → repos → use cases):
    - `GET /relatorio/historico` — self-access via `Depends(get_current_colaborador)`; identity from `payload["cpf"]` (the JWT `cpf` claim matches `BatidaPonto.colaborador_id`, NOT `sub`/login); required `data_inicio`/`data_fim`; returns `HistoricoPontoResponse` for the caller only.
    - `GET /relatorio/empresa/{empresa_id}` — manager-only via `Depends(require_manager)`; BR06 scoping (`empresa_id != payload["empresa_id"]` → 403); required `data_inicio`/`data_fim`; `formato: Literal["json","csv"] = "json"`. JSON returns `RelatorioEmpresaResponse`; CSV returns a stdlib-`csv` download.
  - Per-collaborator grouping so REPORT-2 index-pairing never mixes collaborators; `HorasTrabalhadasUseCase.executar(...)` called once per collaborator with `Empresa.limite_hora`.
  - `presentation/schema/responses/relatorio_empresa_response.py` (new) — `RelatorioEmpresaResponse` / `ColaboradorRelatorioItem` / `PeriodoResponse` envelope.
  - `main.py` — imports and mounts `relatorioRouter`.
  - `404` guard when `buscar_por_cnpj(empresa_id)` returns `None`.
- **Relevant files / areas:**
  - `presentation/controller/relatorio_controller.py`
  - `presentation/schema/responses/relatorio_empresa_response.py`
  - `main.py`
- **Done when:**
  - ✅ A manager can generate and export a company attendance report for a period (JSON + CSV).
  - ✅ Overtime flags (BR05) appear in the report.
  - ✅ Non-managers cannot access multi-user reports (403); cross-company `empresa_id` → 403; the router is mounted and appears in OpenAPI.
- **Not yet verified:** end-to-end runtime request/response (verified by clean import + route registration only).

### [REPORT-4] Restructure report use cases under `application/use_cases/relatorio/`
- **Priority:** P2
- **Status:** done
- **Why it exists:** Architecture decision (2026-06-22): report use cases belong in their own `relatorio/` subfolder, separate from `ponto/`, to keep reporting concerns isolated and extensible.
- **What was done (verified 2026-06-23):**
  - `application/use_cases/relatorio/` package exists with `__init__.py`, `historico_colaborador_usecase.py` (calls `listar_por_colaborador`), `historico_empresa_usecase.py` (calls `listar_por_empresa`), and `horas_trabalhadas_usecase.py`. None contains SQL or HTTP concerns.
  - `relatorio_controller.py` wires the `relatorio/` use cases, not the `ponto/` ones.
- **Relevant files / areas:**
  - `application/use_cases/relatorio/__init__.py`
  - `application/use_cases/relatorio/historico_colaborador_usecase.py`
  - `application/use_cases/relatorio/historico_empresa_usecase.py`
  - `application/use_cases/relatorio/horas_trabalhadas_usecase.py`
  - `presentation/controller/relatorio_controller.py`
- **Done when:**
  - ✅ The `relatorio/` use-case subfolder exists with the three use cases above.
  - ✅ Each use case calls repository methods; none contains SQL or HTTP concerns.
  - ✅ `relatorio_controller.py` wires these use cases, not the `ponto/` use cases.
- **Follow-up note:** `historico_empresa_usecase.py` is currently **not** called by the controller (the controller builds the company report by calling `historico_colaborador` per-collaborator and composing hours inline). It is effectively dead code — consider wiring it in or removing it under a future cleanup. The BR06 scope check also lives in the controller rather than inside the use case.

### [COLAB-1] Implement collaborator get/list use case (RF09)
- **Priority:** P1
- **Status:** done
- **Why it exists:** `GetColaboradorUseCase` was empty. Collaborators must view their own profile (RF09) and managers must list collaborators (RF10).
- **What was done (verified 2026-06-23):**
  - `application/use_cases/colaborador/get_colaborador_usecase.py` — `por_login` (404 if missing) and `listar_por_empresa`. The repo's `listar_por_empresa` filters by company AND `status == True` — `infra/repositories/colaborador_repository.py`.
  - Endpoints: `GET /colaborador/me` (self, `get_current_colaborador`) and `GET /colaborador/` (manager-only via `require_manager`, scoped by `payload["empresa_id"]`) — `presentation/controller/colaborador_controller.py`.
  - Returns `ColaboradorResponse` (no `senha`/`facial`).
- **Relevant files / areas:**
  - `application/use_cases/colaborador/get_colaborador_usecase.py`
  - `infra/repositories/colaborador_repository.py`
  - `presentation/controller/colaborador_controller.py`
  - `presentation/schema/responses/colaborador_response.py`
- **Done when:**
  - ✅ A collaborator can fetch their own profile.
  - ✅ A manager can list collaborators of their own company only.
  - ✅ No sensitive fields are returned.

### [COLAB-2] Implement collaborator edit and deactivate use case (RF05)
- **Priority:** P1
- **Status:** done
- **Why it exists:** `EdicaoColaboradorUseCase` was empty. RF05 requires editing and deactivating user records.
- **What was done (verified 2026-06-23):**
  - `application/use_cases/colaborador/edicao_colaborador_usecase.py` — `executar` edits `nome`/`login`/`gerente`/`senha` (re-hashes via `hash_service.hash`), enforces BR06 (`empresa_id != requester_empresa_id` → 403), and guards login uniqueness.
  - `desativar` blocks self-deactivation and last-active-manager deactivation (repo `contar_gerentes_ativos`).
  - Manager-gated endpoints `PUT/DELETE /colaborador/{cpf}` via `require_manager` — `presentation/controller/colaborador_controller.py`.
  - `presentation/schema/requests/edicao_colaborador_request.py` carries the editable fields.
- **Relevant files / areas:**
  - `application/use_cases/colaborador/edicao_colaborador_usecase.py`
  - `infra/repositories/colaborador_repository.py` (`atualizar`, `deletar`, `contar_gerentes_ativos`)
  - `presentation/controller/colaborador_controller.py`
  - `presentation/dependencies/auth.py` (`require_manager`)
  - `application/services/hash_service.py`
- **Done when:**
  - ✅ A manager can edit and deactivate a collaborator of their own company.
  - ✅ A manager cannot edit or deactivate a collaborator from another company (403).
  - ✅ Password updates are stored hashed.
  - ✅ Non-managers cannot edit/deactivate (403).
  - ✅ Self / last-manager deactivation is blocked (no silent lockout).

### [PUNCH-2] Implement entry/exit punch type classification
- **Priority:** P2
- **Status:** done
- **Why it exists:** Punch type (entry vs exit) was not implemented, so punch history responses could not label each record and worked-hours pairing (REPORT-2) had no sequence to follow.
- **Decision (2026-06-23):** Type is **derived from position in the day's ordered punch sequence** — no `tipo` column is stored. 1-indexed: odd = entry, even = exit; ordered by `batida ASC` within a calendar day.
- **What was done (verified 2026-06-23):**
  - `tipo` derived 1-based per `(day, colaborador_id)` in `application/use_cases/relatorio/_agrupamento.py` (odd = `entrada`, even = `saida`); no `tipo` column on `domains/models/batida_ponto.py`.
  - Exposed as `tipo: Literal["entrada","saida"]` in `presentation/schema/responses/historico_ponto_response.py`.
- **Relevant files / areas:**
  - `application/use_cases/relatorio/_agrupamento.py` (derives `tipo`; original task named the now-removed `ponto/get_ponto_usecase.py`)
  - `presentation/schema/responses/historico_ponto_response.py`
- **Done when:**
  - ✅ Punch history responses include `tipo` (`"entrada"` or `"saida"`) on each item.
  - ✅ The sequence is consistent: the Nth punch of the day yields `"entrada"` for odd N, `"saida"` for even N.
  - ✅ No `tipo` column exists on `BatidaPonto`; no schema migration needed.

### [BIO-2] ~~Decide and act on RF13 (biometrics on first punch)~~ — DEFERRED
- **Priority:** P2
- **Status:** done
- **Why it exists:** RF13 says biometrics should be registered on the first punch. Currently only the separate dedicated enrollment endpoint exists.
- **Decision (2026-06-22):** RF13 is **out of MVP scope**. The dedicated enrollment endpoint (`POST /colaborador/registro/cadastrar-biometria`) is the official enrollment flow. The punch flow must **not** auto-enroll; if a collaborator has no stored embedding, the punch must fail with a clear validation error.
- **What must be done:** Nothing for this delivery. RF13 is a future enhancement.
- **Relevant files / areas:**
  - `PROJECT_CONTEXT.md` §25 (decision recorded)
- **Done when:**
  - N/A — out of scope. Future work tracked separately if RF13 is re-prioritized.

### [RECOG-1] Align recognition thresholds with BR01 (0.65)
- **Priority:** P0
- **Status:** done
- **Why it existed:** BR01 requires a minimum recognition similarity of **0.65** for a valid punch. Previously `FacialService.validar_rosto` defaulted `limiar=0.6`; `BaterPontoUseCase` called it without a threshold (silently 0.6); `BatidaPontoEmbarcadoUseCase` used a literal `0.4`. Both accepted faces that should be rejected.
- **What was done (verified 2026-06-23):**
  - Added a single module-level constant `LIMIAR_RECONHECIMENTO = 0.65  # BR01` in `application/services/facial_service.py`.
  - `validar_rosto`'s default is now `limiar: float = LIMIAR_RECONHECIMENTO`, so the login punch (`BaterPontoUseCase`, which calls it with no threshold) inherits 0.65.
  - `BatidaPontoEmbarcadoUseCase` imports the constant and rejects `melhor_similaridade < LIMIAR_RECONHECIMENTO` (was `< 0.4`); best-match selection then cutoff order preserved.
  - Verified no recognition literal `0.6`/`0.4` remains in punch logic; smoke gate green.
- **Relevant files / areas:**
  - `application/services/facial_service.py`
  - `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`
  - `application/use_cases/ponto/batida_ponto_usecase.py` (unchanged; inherits the default)
- **Done when:**
  - ✅ Both punch flows reject matches with similarity < 0.65 (inclusive boundary: 0.65 accepted).
  - ✅ The threshold is defined in exactly one place and reused by all flows.
  - ✅ No remaining literal `0.6`/`0.4` recognition thresholds exist in punch logic.
- **Follow-up (non-blocking):** raising the embarcado cutoff 0.4→0.65 is a meaningful behavior tightening; legitimate blind-recognition punches may now be rejected more often — a recognition-quality concern for QA, not an architecture one.

### [AUTHZ-1] Add `gerente` boolean to Colaborador (RF02)
- **Priority:** P1
- **Status:** done
- **Why it existed:** RF02/BR03 distinguish Manager from Collaborator via a **boolean field (`gerente`) on `Colaborador`**, not a separate entity. The column existed and was persisted, but was absent from JWT claims and `ColaboradorResponse`, and registration advertised an ignored `gerente` field.
- **What was done (verified 2026-06-23):**
  - `gerente` Boolean column (default `False`, not null) on `Colaborador` + startup `ALTER TABLE` migration (pre-existing).
  - `gerente` added to the JWT claims in **both** token-mint sites — login (`login_controller.py` via `LoginColaboradorUseCase`'s returned dict) and registration (`colaborador_controller.py`) — so both tokens carry an identical claim set `sub`/`cpf`/`empresa_id`/`gerente`.
  - `gerente: bool` added to `ColaboradorResponse` (still no `senha`/`facial`); all construction sites (login `(**result)`, registration `model_validate`, `/me`, `/` list, `PUT`, `DELETE`) verified.
  - Removed the ignored `gerente` field from the public `RegistroColaboradorRequest` so the API no longer advertises self-promotion; registration stays hard-coded `gerente=False`.
  - Controlled promotion path: manager-only `PUT /colaborador/{cpf}` (COLAB-2) is the sole way to set `gerente=True`.
- **Relevant files / areas:**
  - `domains/models/colaborador.py`, `main.py` (migration)
  - `presentation/schema/requests/registro_colaborador_request.py` (ignored field removed)
  - `presentation/schema/responses/colaborador_response.py`
  - `application/use_cases/colaborador/login_colaborador_usecase.py`
  - `presentation/controller/colaborador_controller.py`, `login_controller.py`
- **Done when:**
  - ✅ `Colaborador` has a persisted `gerente` boolean; existing data continues to work.
  - ✅ The flag is surfaced in tokens and responses, and settable only in a controlled (manager-gated) way.
- **Follow-on (separate, not blocking):** (1) AUTHZ-2's remaining item — `require_manager` should read the new claim instead of re-querying the DB; (2) first-manager bootstrap (no API path mints the first manager) — resolve via seed/CLI, never by reopening public registration.

---

## 5. 🚧 To do / In progress

The live work queue. Work top-down by priority: **P0 → P1 → P2 → P3**.

### P1 — Core product completion tasks

#### [AUTH-4] Issue a bearer token on collaborator registration
- **Priority:** P1
- **Status:** todo
- **Why it exists:** Requirement: a collaborator must receive a bearer token upon registration. Today `POST /colaborador/registro/` returns only a `ColaboradorResponse` (no token), so a newly-registered collaborator must make a separate `/auth/login` call before reaching any protected endpoint. The token-issuing logic already exists in `TokenService`.
- **What must be done:**
  - After a successful `RegistrarColaboradorUseCase.execute(...)`, mint a JWT with `TokenService.gerar_token(...)` using the same claims shape as login (`sub`=login, `cpf`, `empresa_id` — and `gerente` once AUTHZ-1 adds it to claims).
  - Return a typed response wrapping `access_token`, `token_type: "bearer"`, and the existing `ColaboradorResponse` — mirror the login response shape (ties into API-1).
  - Do not leak the password hash or facial vector in the response (reuse `ColaboradorResponse`).
- **Relevant files / areas:**
  - `presentation/controller/colaborador_controller.py` (`registro_colaborador`)
  - `infra/security/token_service.py`
  - `presentation/controller/login_controller.py` (claims shape to mirror)
  - `presentation/schema/responses/` (typed registration/login response model — ties into API-1)
- **Done when:**
  - Registration returns a valid signed bearer token plus the safe collaborator DTO.
  - The token authenticates against protected endpoints without a separate login call.
  - The response contains no `senha` or `facial` data.

#### [AUTHZ-2] Enforce manager-only access (BR03) and company-scoped access (BR06)
- **Priority:** P1
- **Status:** in progress
- **Why it exists:** BR03 restricts report export and edit/delete of collaborator/company data to managers. BR06 restricts a collaborator to their own company's data.
- **What was done:**
  - `require_manager()` dependency — checks `gerente` (re-queried via `ColaboradorRepository`) and returns 403 for non-managers — `presentation/dependencies/auth.py`.
  - Applied to empresa edit/deactivate; collaborator edit/deactivate (COLAB-2); company reports (REPORT-3).
  - Company scoping (BR06) enforced at the domain level for empresa edit/deactivate, collaborator edit/deactivate, collaborator listing, and reports (`empresa_id` claim check).
- **What still needs to be done:**
  - Once `gerente` is in the JWT claims (AUTHZ-1), `require_manager` should read the claim instead of re-querying the DB. This is the only remaining item — the access-control coverage itself is effectively complete.
- **Relevant files / areas:**
  - `presentation/dependencies/auth.py` (`require_manager`)
  - collaborator and report controllers (done)
- **Done when:**
  - ✅ Non-managers receive 403 on manager-only endpoints; a manager cannot edit/view another company's data.
  - ✅ Collaborator edit/deactivate and reports are manager-gated and company-scoped.
  - ✅ Collaborators can only access their own company's history/profile.
  - `require_manager` reads the role from the JWT claim (blocked on AUTHZ-1).

#### [REPORT-6] Implement a daily punch-summary endpoint for the authenticated collaborator (RF09)
- **Priority:** P1
- **Status:** todo
- **Why it exists:** A collaborator must be able to see, for the current day, **how many punches they have recorded so far and at what times**. The existing history endpoints (REPORT-3) cover arbitrary date ranges and a manager's company-wide report, but there is no quick "today's punches" self-view.
- **What must be done:**
  - Add a self-access endpoint (e.g. `GET /relatorio/hoje` or `GET /relatorio/dia`) protected by `Depends(get_current_colaborador)`; identity from the `cpf` claim (matches `BatidaPonto.colaborador_id`, **not** `sub`).
  - Default the day to "today" (server clock); optionally accept a `data` query param.
  - Reuse the existing history retrieval (`historico_colaborador` in the `relatorio/` package / `BatidaPontoRepository.listar_por_colaborador`) with `data_inicio`/`data_fim` set to the start/end of the chosen day rather than adding a new repository query.
  - Return a typed response with the punch `total` (count) and the ordered list of times (reuse/compose `BatidaItemResponse`, including the derived `tipo`).
- **Relevant files / areas:**
  - `presentation/controller/relatorio_controller.py` (new endpoint)
  - `application/use_cases/relatorio/historico_colaborador_usecase.py`
  - `infra/repositories/batida_ponto_repository.py` (`listar_por_colaborador`)
  - new/extend: `presentation/schema/responses/` (daily-summary response DTO: `total` + ordered punch items)
  - `presentation/dependencies/auth.py` (`get_current_colaborador`)
- **Done when:**
  - An authenticated collaborator can fetch their own punches for the current day: a count plus each punch time (and derived entrada/saida type).
  - The endpoint is self-scoped and mounted in OpenAPI.
  - Defaults to today; querying a specific day is supported.

#### [COLAB-3] Add an authenticated self-edit endpoint for a collaborator's own profile
- **Priority:** P1
- **Status:** todo
- **Why it exists:** A collaborator must be able to edit their own profile (RF09 / RF05 self-service), but the only edit path today is `PUT /colaborador/{cpf}`, which is gated by `require_manager`. There is no endpoint a non-manager can call to update their own record, so the frontend employee-profile edit flow has nothing to call. Reusing the manager endpoint from an employee context is wrong (it would 403 for non-managers and conflates self-edit with manager-edit authorization).
- **What must be done:**
  - Add a self-scoped endpoint (e.g. `PUT /colaborador/me`) protected by `Depends(get_current_colaborador)`; identity comes from the token (`sub`/`cpf`), never from a path param or body.
  - Allow editing only safe self-service fields (e.g. `nome`, `login`, `senha`); **must not** allow a collaborator to set `gerente`, change `empresa_id`, or reactivate/deactivate themselves.
  - Reuse `EdicaoColaboradorUseCase` (or a thin self-edit path on it) so login-uniqueness and password re-hashing stay centralized; pass the token identity as both requester and target so BR06 scoping holds.
  - Return `ColaboradorResponse` (no `senha`/`facial`).
- **Relevant files / areas:**
  - `presentation/controller/colaborador_controller.py` (new `PUT /colaborador/me` handler)
  - `application/use_cases/colaborador/edicao_colaborador_usecase.py`
  - `presentation/schema/requests/edicao_colaborador_request.py` (reuse or a self-edit subset)
  - `presentation/dependencies/auth.py` (`get_current_colaborador`)
- **Done when:**
  - An authenticated collaborator can update their own `nome`/`login`/`senha` without a manager token.
  - A collaborator cannot elevate themselves to manager, move companies, or change another collaborator via this endpoint.
  - Password updates are stored hashed; the response contains no `senha`/`facial`.
  - The endpoint is mounted and appears in OpenAPI.

### P2 — Important improvements

#### [REPORT-5] Add composite DB indexes and pagination to punch history queries
- **Priority:** P2
- **Status:** todo
- **Why it exists:** `BatidaPontoRepository` time-range queries will be slow without indexes as data grows, and unbounded history queries will produce oversized payloads. Pagination and indexing must be designed together.
- **What must be done:**
  - Add a composite index on `BatidaPonto(colaborador_id, batida)` to `domains/models/batida_ponto.py` via `__table_args__`.
  - Add an index on `Colaborador.empresa_id` to support the manager join (`listar_por_empresa`).
  - Extend `listar_por_colaborador` and `listar_por_empresa` to accept `page: int` and `page_size: int` (default 50); apply `.offset().limit()` internally.
  - Both `data_inicio` and `data_fim` must be required (no open-ended queries).
  - Create `presentation/schema/responses/historico_response.py` with a paginated envelope: `{ total, page, page_size, items: list[BatidaPontoResponse] }`.
  - Create `presentation/schema/responses/batida_ponto_response.py` with safe punch fields (no raw embedding vectors).
- **Relevant files / areas:**
  - `domains/models/batida_ponto.py` (add `__table_args__` composite index)
  - `domains/models/colaborador.py` (add `empresa_id` index)
  - `infra/repositories/batida_ponto_repository.py` (add pagination)
  - new: `presentation/schema/responses/historico_response.py`
  - new: `presentation/schema/responses/batida_ponto_response.py`
- **Done when:**
  - Composite index exists on `(colaborador_id, batida)` and index on `empresa_id`.
  - Both repository query methods accept page/page_size and apply correct offset/limit.
  - `data_inicio` and `data_fim` are required.
  - History response DTOs use the paginated envelope and never include `facial` embedding vectors.

#### [PUNCH-3] Robust error handling and edge cases in punch flows
- **Priority:** P2
- **Status:** todo
- **Why it exists:** Punch flows have fragile spots. **Live bug:** `BaterPontoUseCase` checks `len(colaborador.facial) < 128` against a possibly-`None` value (the `facial` column is nullable), raising `TypeError` instead of a clear "not enrolled" error when a collaborator has no biometrics. (`BatidaPontoEmbarcadoUseCase` already guards with `if not colaborador.facial: continue`.) Image decode/embedding failures raise raw `ValueError` from `FacialService`.
- **What must be done:**
  - Guard against `colaborador.facial` being `None` before length checks in `BaterPontoUseCase` — a missing embedding must return a clear error ("collaborator not enrolled"), not auto-enroll (RF13 out of scope).
  - Translate `FacialService` failures (invalid image, no face) into clear, consistent error responses.
  - Validate uploaded file type/size at the controller boundary.
- **Relevant files / areas:**
  - `application/use_cases/ponto/batida_ponto_usecase.py`
  - `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`
  - `application/services/facial_service.py`
  - `presentation/controller/batida_ponto_controller.py`
- **Done when:**
  - Missing biometrics, invalid images, and no-face cases return clear, consistent errors (no unhandled `ValueError`/`TypeError`).
  - Basic upload validation happens at the controller.

#### [BIO-1] Consolidate and harden biometric enrollment
- **Priority:** P2
- **Status:** todo
- **Why it exists:** Two enrollment paths exist: registration accepts `facial: list[float]` directly in-body (client-computed), and `POST /colaborador/registro/cadastrar-biometria` extracts the embedding server-side. The dual path is inconsistent and the in-body path trusts client-provided embeddings.
- **What must be done:**
  - Decide the single supported enrollment path (recommended: server-side extraction only) and document it.
  - Remove or restrict the in-body `facial` acceptance at registration if it is dropped.
  - Validate that a usable face was detected before storing.
- **Relevant files / areas:**
  - `presentation/schema/requests/registro_colaborador_request.py` (still has `facial: list[float]`)
  - `application/use_cases/colaborador/registrar_colaborador_usecase.py`
  - `application/use_cases/ponto/cadastrar_biometria_usecase.py`
  - `presentation/controller/colaborador_controller.py`
- **Done when:**
  - There is one documented enrollment path.
  - Stored embeddings are validated, not blindly trusted from the client.

#### [RECOG-2] Validate company existence and active status at registration
- **Priority:** P2
- **Status:** todo
- **Why it exists:** `RegistrarColaboradorUseCase` does not verify that `empresa_id` refers to an existing, active company — it only checks CPF/login uniqueness. The FK references `empresas.cnpj` but no application-level check is done.
- **What must be done:**
  - In registration, look up the company (via `EmpresaRepository.buscar_por_cnpj`, which already exists) and reject if it does not exist or is inactive.
- **Relevant files / areas:**
  - `application/use_cases/colaborador/registrar_colaborador_usecase.py`
  - `infra/repositories/empresa_repository.py` (`buscar_por_cnpj` ready to reuse)
- **Done when:**
  - Registering a collaborator against a non-existent or inactive company is rejected with a clear error.

#### [API-1] Standardize API response shaping with output schemas
- **Priority:** P2
- **Status:** in progress
- **Why it exists:** Response shaping is partly done but inconsistent. `presentation/schema/responses/` exists with `ColaboradorResponse`/`EmpresaResponse`, and empresa/collaborator endpoints declare `response_model`. But punch endpoints still return ad-hoc dicts and login returns a hand-built dict.
- **What still needs to be done:**
  - Add response models for punch payloads.
  - Apply `response_model` on the punch endpoints.
  - Consider a typed login response model wrapping the token + `ColaboradorResponse` (shared with AUTH-4's registration response).
- **Relevant files / areas:**
  - `presentation/schema/responses/` (extend)
  - `presentation/controller/batida_ponto_controller.py`, `login_controller.py`
- **Done when:**
  - Public endpoints declare a `response_model`.
  - No endpoint returns a raw ORM object or an untyped ad-hoc dict.

### P3 — Architecture / cleanup / maintainability

#### [ARCH-1] Move FacialService into the infra layer
- **Priority:** P3
- **Status:** todo
- **Why it exists:** `FacialService` lives in `application/services/` but wraps an external dependency (DeepFace/OpenCV/scipy), which per `PROJECT_CONTEXT.md` §13 belongs in `infra/`. (Confirmed: no `infra/services/` exists yet.)
- **What must be done:**
  - Move `FacialService` to `infra/` (e.g. `infra/services/facial_service.py`).
  - Update all imports/wiring; do not change behavior in this task.
- **Relevant files / areas:**
  - `application/services/facial_service.py` (move)
  - importers: `application/use_cases/ponto/*`, `presentation/controller/*`, `main.py`
- **Done when:**
  - `FacialService` resides in infra and all imports are updated.
  - The app starts and punch flows behave identically.

#### [ARCH-2] Remove HTTPException from use cases via domain exceptions
- **Priority:** P3
- **Status:** todo
- **Why it exists:** `HTTPException` is raised inside use cases (`registrar_colaborador_usecase`, `cadastrar_biometria_usecase`, both punch use cases, `get_colaborador_usecase`, `edicao_colaborador_usecase`, and the empresa use cases). HTTP concerns inside business logic violate the layering rules. (Confirmed: no `domains/exceptions` exists.)
- **What must be done:**
  - Define a small set of domain exceptions (e.g. `NotFound`, `Conflict`, `Unauthorized`, `Forbidden`, `BusinessRuleViolation`) under `domains/`.
  - Replace `HTTPException` raises in use cases with domain exceptions.
  - Add an exception-handling layer (FastAPI exception handlers or controller-level mapping) translating domain exceptions to HTTP responses.
- **Relevant files / areas:**
  - new: `domains/exceptions.py` (or `domains/exceptions/`)
  - all use cases under `application/use_cases/`
  - `main.py` / controllers (exception handlers)
- **Done when:**
  - No `HTTPException` import remains in any use case.
  - Domain exceptions map to correct HTTP status codes at the boundary.
  - Behavior (status codes) is preserved.

#### [ARCH-3] Define repository interfaces / contracts in the domain layer
- **Priority:** P3
- **Status:** todo
- **Why it exists:** Use cases depend directly on concrete repository classes; there are no contracts in `domains/`. (Confirmed: `domains/` has only `models/`.) This couples business logic to infra and hinders testing.
- **What must be done:**
  - Define repository interfaces (abstract base classes) in the domain layer for collaborator, company, and punch repositories.
  - Have infra implementations conform to the interfaces; have use cases depend on the abstractions.
  - Keep changes incremental.
- **Relevant files / areas:**
  - new: `domains/repositories/` (contracts)
  - `infra/repositories/colaborador_repository.py`
  - `infra/repositories/batida_ponto_repository.py`
  - `infra/repositories/empresa_repository.py`
- **Done when:**
  - Repository contracts exist in the domain layer.
  - Infra repositories implement them; use cases reference the abstractions.

#### [ARCH-4] Reduce controller↔persistence coupling and standardize wiring
- **Priority:** P3
- **Status:** todo
- **Why it exists:** Controllers wire use cases, repositories, sessions, and services inline (e.g. `colaborador_controller.py`, `relatorio_controller.py`), with no consistent dependency assembly. `presentation/dependencies/` holds only `auth.py`.
- **What must be done:**
  - Introduce a consistent dependency-assembly approach (FastAPI dependencies/factory functions) for sessions, repositories, services, and use cases.
  - Ensure controllers only resolve dependencies and call use cases.
  - Apply incrementally across existing controllers.
- **Relevant files / areas:**
  - `presentation/controller/` (all — currently each builds repos/services/use cases inline)
  - `presentation/dependencies/` (add session/repository/use-case factories here)
  - `infra/db/database.py` (`get_db` already exists)
- **Done when:**
  - Dependency wiring is centralized and reused.
  - Controllers contain no business or persistence logic, only HTTP handling and dependency resolution.

---

## 6. Task format

Every task in this file must follow exactly this template:

```markdown
### [TASK-ID] Task title
- **Priority:** P0/P1/P2/P3
- **Status:** todo
- **Why it exists:** short explanation of the gap/problem
- **What must be done:**
  - concrete implementation steps
- **Relevant files / areas:**
  - real file paths from this codebase
- **Done when:**
  - objective acceptance criteria
```

**TASK-ID prefixes** group work by domain:

| Prefix | Domain |
|---|---|
| `AUTH-` | Authentication / JWT / login |
| `AUTHZ-` | Authorization / roles / access scope |
| `PUNCH-` | Time punch flow |
| `RECOG-` | Facial recognition logic |
| `EMPRESA-` | Company CRUD |
| `COLAB-` | Collaborator management |
| `REPORT-` | Attendance history, hours, reports |
| `BIO-` | Biometric enrollment |
| `ARCH-` | Architecture / cleanup / refactor |

IDs are numbered within each prefix (e.g. `AUTH-1`, `AUTH-2`).

---

## 7. Task-writing rules

- **Verify before writing.** Do not assume a requirement is implemented; confirm in the actual code. Use `PROJECT_CONTEXT.md` §15–27 and read the files.
- **Existing vs missing.** If something already exists, write the task as `complete/fix/refine X`, not build-from-scratch. Only use `implement X` for confirmed-empty/missing code.
- **One coherent deliverable per task.** No tiny meaningless tasks; no giant catch-all tasks. Split when a task spans multiple layers with independent acceptance.
- **Concrete and domain-specific.** Reference FaceClock concepts (collaborator, company, punch, history, biometrics, authentication, reports) and real file paths.
- **No invented scope.** Do not add features absent from the requirement baseline (`PROJECT_CONTEXT.md` §9–11) or the code review.
- **Respect the architecture.** Keep HTTP in controllers, rules in use cases, tech in infra. Do not introduce new frameworks or replace the stack.
- **Incremental.** Prefer small, reviewable steps; do not turn a small task into a full refactor.
- **Keep links real.** Every "Relevant files / areas" path must exist or be a clearly-marked `new:` file.
- **Update status honestly.** Move tasks through `todo → in progress → done`; mark `blocked` with the blocking task ID. When a task reaches `done`, move it from Section 5 to Section 4.

---

## 8. Final quality bar

A task is considered complete only when all of the following hold:

- **Acceptance met.** Every "Done when" criterion is satisfied and verifiable.
- **Requirement traceability.** The work maps to the requirement/business rule it addresses (RF/NFR/BR in `PROJECT_CONTEXT.md`), and any divergence is documented.
- **Security preserved.** No secrets, password hashes, tokens, or biometric raw data are leaked in responses or logs (NFR04, NFR05). New auth code follows least privilege.
- **Architecture respected.** Controllers stay HTTP-only, use cases stay free of HTTP/infra details where an abstraction exists, infra holds external tech. No new framework or stack change.
- **No regressions.** Existing flows (registration, enrollment, both punch endpoints, login) still work; the app starts cleanly.
- **Consistency.** Naming, layering, and response shapes match existing conventions; no duplicated logic introduced (e.g. recognition threshold defined once).
- **Context updated.** `PROJECT_CONTEXT.md` implementation sections (§16–27) and this file's task status are updated to reflect the new real state.
- **Reviewable.** The change is small enough to review meaningfully and includes a clear path for the backend agent to verify.
