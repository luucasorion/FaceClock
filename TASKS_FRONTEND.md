# FaceClock — Frontend Tasks

## 1. How to read this file

This file is the **actionable work backlog for the FaceClock frontend**. It is the frontend counterpart to `TASKS.md` (backend) and complements `PROJECT_CONTEXT.md`:

- `PROJECT_CONTEXT.md` is the source of truth for **product intent, requirements (RF/NFR/BR), and verified backend implementation state**.
- `TASKS.md` is the **backend** work backlog. Backend dependency tasks referenced here live there.
- `TASKS_FRONTEND.md` (this file) translates the frontend product surface into **concrete, reviewable units of work** for a new React + Vite client. Authored against the **real controllers** in `presentation/controller/` on **2026-06-23**.

Read order:

1. Start with **Section 4 — Current Completion Snapshot**: the frontend is greenfield, so this lists everything still to do.
2. **Section 5 — Confirmed backend contract** is the verified endpoint reference these tasks integrate against. Trust it over `TASKS.md` prose for shapes — it was read from the controllers.
3. **Section 6 — Shared building blocks** describes the reused pieces (API client, auth, `CameraCapture`, `ProfileForm`, CSV helper) that other tasks depend on.
4. **Section 7 — Tasks** is the live work queue. Work it top-down by priority: **P0 → P1 → P2**.
5. Each task is self-contained: why it exists, what to do, which files it touches, and how to know it is done.

### Ground rules (apply to every task)

- **Stack:** React + Vite in a **new top-level `frontend/` directory**. Do **not** modify the backend layers (`application/`, `domains/`, `infra/`, `presentation/`). The frontend only consumes the existing REST API.
- **MVP scope:** frontend input validation is **not** a priority. Focus on screens, flows, API integration, and component reuse. Do not add validation-heavy tasks.
- **No face recognition on the client (NFR05):** the frontend captures an image from the camera and POSTs the raw bytes as `multipart/form-data`. Embeddings are computed server-side. Captured images live only in memory and are discarded after upload — never persisted to disk/localStorage.
- **Mobile-first / responsive (NFR01):** collaborator-facing screens (kiosk punch, employee punch home, profile, login, registration, enrollment) are used primarily on phones and must be **operable one-handed with primary actions within thumb reach**, with **no horizontal scroll at mobile widths**. The punch flow must stay fast and low-friction (~3s target). Manager screens (My Employees, company report) are desktop-oriented but must **degrade gracefully** on small screens. Use responsive layout (mobile breakpoints first), not a fixed desktop width.
- **Never invent endpoints.** If a screen needs backend behavior that does not exist, the corresponding **backend task in `TASKS.md`** is referenced and the frontend task is marked `blocked on <TASK-ID>`. Do not fake or stub missing endpoints.
- **HTTPS in transit (NFR06):** biometric/credential traffic must go over HTTPS in any non-local environment. CORS in `main.py` is currently `allow_origins=["*"]` and must be narrowed to the real frontend origin before deployment (tracked alongside backend hardening, not a frontend task).

---

## 2. Priority Legend

| Priority | Meaning |
|---|---|
| **P0** | Foundations + the core punch loop. The app cannot demo without these: scaffold, API client, auth, `CameraCapture`, menu, login, registration, kiosk punch, employee punch home. Do first. |
| **P1** | Core product completion: biometric enrollment, employee profile + history/export, manager My-Employees + company report, the shared `ProfileForm` and CSV helper. |
| **P2** | Polish: punch result/error UX, responsive/one-handed QA pass, shared loading/empty/error primitives. |

| Status | Meaning |
|---|---|
| `todo` | Not started. |
| `in progress` | Actively being worked on. |
| `blocked` | Cannot proceed; depends on a backend task in `TASKS.md` (referenced inline). |
| `done` | Completed and acceptance criteria met. |

---

## 3. Task-ID scheme

| Prefix | Area |
|---|---|
| `FE-SHARED-` | Cross-cutting building blocks reused by many screens (scaffold, API client, auth, `CameraCapture`, `ProfileForm`, CSV helper, UI primitives) |
| `FE-MENU-` | Initial menu / app entry |
| `FE-AUTH-` | Login, employee registration, company registration |
| `FE-ENROLL-` | Biometric enrollment flow |
| `FE-PUNCH-` | Kiosk punch + authenticated employee punch home |
| `FE-PROFILE-` | Employee self-profile + own punch history/export |
| `FE-MANAGER-` | Manager-only screens (My Employees, employee file, company report) |

IDs are numbered within each prefix.

---

## 4. Current Completion Snapshot

The frontend scaffold now exists (`frontend/`, React+Vite); the screens are being built out. Updated during the orchestrator run on 2026-06-23.

**Verification gate (frontend):** `npm install` + `npm run build` (Vite) from `frontend/`, run by the orchestrator. Node 24 / npm 11 confirmed available at `C:\Program Files\nodejs` (prepend to PATH per call). There is no automated test suite; the build gate proves the app compiles, not runtime correctness.

**At a glance**

| Group | Tasks |
|---|---|
| ✅ Done | FE-SHARED-1 |
| ⬜ P0 | FE-SHARED-2, FE-SHARED-3, FE-SHARED-4, FE-MENU-1, FE-AUTH-1, FE-AUTH-2, FE-AUTH-3, FE-PUNCH-1, FE-PUNCH-2 |
| ⬜ P1 | FE-SHARED-5, FE-SHARED-6, FE-ENROLL-1, FE-PROFILE-1, FE-MANAGER-1, FE-MANAGER-2 |
| ⬜ P2 | FE-PUNCH-3, FE-SHARED-7 |

**Backend dependencies (in `TASKS.md`) that block frontend tasks**

| Backend task | Status | Blocks |
|---|---|---|
| **AUTHZ-1** (surface `gerente` in JWT claims + `ColaboradorResponse`) | **done** (2026-06-23) | ~~FE-AUTH-1 (role routing), FE-MANAGER-1, FE-MANAGER-2~~ — unblocked |
| **COLAB-3** (authenticated self-edit endpoint, `PUT /colaborador/me`) | **done** (2026-06-23) | ~~FE-PROFILE-1 (edit/save)~~ — unblocked |
| **RECOG-2** (validate company existence/active at registration) | todo | FE-AUTH-2 (clean "company not found" error) |
| **BIO-1** (consolidate enrollment; remove in-body `facial`) | todo | FE-AUTH-2 (lets registration stop sending `facial: []`) |
| **REPORT-5** (pagination on history) — optional P2 | todo | FE-PROFILE-1 (frontend paginates client-side until then) |

> **Note (2026-06-23, orchestrator run):** `ColaboradorResponse` now includes `gerente`, and the JWT claims (login + registration) carry `gerente`, so role-based routing and `RequireManager` can now be implemented. A new `PUT /colaborador/me` (bearer, self-scoped; body `{nome, login, senha}`; returns `ColaboradorResponse`) exists — FE-PROFILE-1 Save wires to it. **Bootstrap caveat:** no API path currently mints the first manager (registration forces `gerente=False`; promotion only via the manager-gated `PUT /colaborador/{cpf}`), so the manager screens can't be exercised end-to-end until a manager is seeded — a backend/ops decision flagged in `ORCHESTRATOR_LOG.md`.

---

## 5. Confirmed backend contract

Read from the controllers in `presentation/controller/` on 2026-06-23. **Trust this over `TASKS.md` prose.**

| Endpoint | Auth | Body / params | Returns |
|---|---|---|---|
| `POST /auth/login` | public | JSON `{ login, senha }` | `{ access_token, token_type:"bearer", colaborador }` (`AuthTokenResponse`) |
| `POST /colaborador/registro/` | public | JSON `{ cpf, nome, login, senha, empresa_id, facial }` — `facial` is **required** (send `[]`); `gerente` ignored server-side | `{ access_token, token_type, colaborador }` — **auto-login** |
| `POST /colaborador/registro/cadastrar-biometria` | bearer | multipart `imagem` | enrolls the **token holder's** face |
| `GET /colaborador/me` | bearer | — | `ColaboradorResponse` (own profile) |
| `GET /colaborador/` | manager | — | `list[ColaboradorResponse]` (own company) |
| `PUT /colaborador/me` | bearer | JSON `{ nome, login, senha }` (self-scoped; no `gerente`) | `ColaboradorResponse` |
| `PUT /colaborador/{cpf}` | manager | JSON `{ nome, login, gerente, senha }` | `ColaboradorResponse` |
| `DELETE /colaborador/{cpf}` | manager | — | `ColaboradorResponse` (soft-deactivate) |
| `POST /ponto/` | bearer | multipart `geo`, `imagem` | punch as token holder |
| `POST /ponto/embarcado` | public | multipart `imagem`, `geo` | blind kiosk punch (recognizes across all enrolled faces) |
| `POST /empresa` | public | JSON `{ cnpj, razao_social, endereco, limite_hora }` | `EmpresaResponse` (201) |
| `GET /empresa` / `GET /empresa/{cnpj}` | bearer / bearer | — | `EmpresaResponse` |
| `PUT /empresa/{cnpj}` / `DELETE /empresa/{cnpj}` | manager | JSON / — | `EmpresaResponse` |
| `GET /relatorio/dia?data=` | bearer | optional `data` (defaults to today, UTC) | `{ colaborador_id, data, total, batidas[] }` (`ResumoDiarioResponse`) |
| `GET /relatorio/historico?data_inicio&data_fim` | bearer | both **required** | `HistoricoPontoResponse` (grouped by day; **JSON only, not paginated**) |
| `GET /relatorio/empresa/{empresa_id}?data_inicio&data_fim&formato=json\|csv` | manager | both dates required; `formato` default `json` | JSON report or CSV download |

**Shapes that matter for the UI**

- `ColaboradorResponse` = `{ cpf, nome, login, empresa_id, status, gerente }`. (`gerente` added by AUTHZ-1, 2026-06-23.)
- JWT claims = `{ sub (=login), cpf, empresa_id, gerente }` on **both** login and registration tokens (AUTHZ-1 done). → the client can now distinguish managers; `RequireManager` and role routing are unblocked. (Bootstrap caveat: no manager exists until one is seeded — see §4 note.)
- `BatidaItemResponse` (inside `/dia` and `/historico`) = `{ id, colaborador_id, geo, batida (datetime), tipo: "entrada"|"saida" }`. `tipo` is derived server-side by sequence position.
- `/relatorio/dia` returns `total` (count) + ordered `batidas` for the day — this is the employee home's "today's punches" source.
- Registration's `facial` field is currently **required** by `RegistroColaboradorRequest`; until BIO-1 removes it, the client sends `facial: []` and enrolls separately via `cadastrar-biometria`.

---

## 6. Shared building blocks

These are defined as their own tasks (Section 7) because multiple screens reuse them. Build them before the screens that consume them.

- **API client (`FE-SHARED-2`)** — fetch wrapper with bearer-token injection and a typed module per resource (`auth`, `colaborador`, `ponto`, `empresa`, `relatorio`).
- **Auth context + route guards (`FE-SHARED-3`)** — stores the JWT, exposes `cpf`/`empresa_id`; `RequireAuth` / `RequireManager` guards. Manager gating depends on AUTHZ-1.
- **`CameraCapture` (`FE-SHARED-4`)** — `getUserMedia` + **oval face guide** overlay → captures a frame to a `Blob`, hands it to the caller. Parameterized by upload target. **Reused by kiosk punch (`/ponto/embarcado`), authenticated punch (`/ponto/`), and biometric enrollment (`cadastrar-biometria`).**
- **`ProfileForm` (`FE-SHARED-5`)** — renders collaborador fields read-only with an Edit toggle + Save handler; the Save target is injected by the caller. **Reused by the employee's own profile (`FE-PROFILE-1`) and the manager's employee file (`FE-MANAGER-1`).**
- **CSV export helper (`FE-SHARED-6`)** — builds a `.csv` client-side from a punch list. Used by the employee's own history export (the self-history endpoint returns JSON only).

---

## 7. Tasks

### P0 — Foundations + core punch loop

#### [FE-SHARED-1] Scaffold the React + Vite app with routing and a responsive base
- **Priority:** P0
- **Status:** done — 2026-06-23. `frontend/` Vite app: `package.json` (react 18.3, react-dom 18.3, react-router-dom 6.26, vite 5.4, @vitejs/plugin-react 4.3), `index.html` (responsive `viewport-fit=cover`), `vite.config.js` (port 5173 + dev proxy `/auth`,`/colaborador`,`/ponto`,`/empresa`,`/relatorio` → `http://localhost:8000`), `src/main.jsx`, `src/App.jsx` (BrowserRouter with all screen routes as inline placeholders + `*` NotFound), `src/styles/base.css` (mobile-first: `.app-shell` max-width 480px / `overflow-x:hidden` / 100dvh, `.thumb-zone` with safe-area inset, `.btn-primary` 48px). `.gitignore` for node_modules/dist. **Verified:** `npm install` (66 pkgs) + `npm run build` (vite, 34 modules) both exit 0. Route paths: `/`,`/login`,`/registro/colaborador`,`/registro/empresa`,`/enroll`,`/kiosk`,`/home`,`/perfil`,`/gerente/colaboradores`,`/gerente/colaboradores/:cpf`,`/gerente/relatorio`.
- **Why it exists:** There is no `frontend/` directory. Every other task needs a Vite app, a router, and a mobile-first layout shell to live in.
- **What must be done:**
  - Create `frontend/` as a Vite React app (`index.html`, `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`).
  - Add a dev proxy in `vite.config.js` forwarding API calls to the backend (FastAPI) so the SPA and API share an origin in dev.
  - Add `react-router` routes for every screen (menu, login, employee/company registration, enrollment, kiosk, punch home, profile, manager employees/file, manager report).
  - Establish a **mobile-first** layout shell: a base stylesheet with mobile breakpoints, a responsive viewport meta tag, a max content width that centers on desktop, and a bottom/thumb-reach action zone convention for collaborator screens.
- **Relevant files / areas:**
  - new: `frontend/index.html`, `frontend/package.json`, `frontend/vite.config.js`
  - new: `frontend/src/main.jsx`, `frontend/src/App.jsx`
  - new: `frontend/src/styles/base.css` (mobile-first tokens)
- **Done when:**
  - `npm run dev` serves the SPA; API calls reach the backend via the dev proxy.
  - All routes resolve (placeholder pages acceptable at this stage).
  - The layout is fluid down to ~360px wide with no horizontal scroll; there is a reusable thumb-reach action zone for collaborator screens.

#### [FE-SHARED-2] API client with bearer-token injection and per-resource wrappers
- **Priority:** P0
- **Status:** todo
- **Why it exists:** Every screen talks to the REST API; a single client centralizes the base URL, JSON vs `multipart/form-data` handling, bearer-token injection, and error normalization so screens don't re-implement fetch.
- **What must be done:**
  - `frontend/src/api/client.js`: a `request()` wrapper that injects `Authorization: Bearer <token>` when a token is present, handles JSON and `FormData` bodies (do **not** set `Content-Type` for `FormData`), and normalizes error responses (status + backend `detail`) into a consistent thrown error.
  - Typed wrappers per resource:
    - `api/auth.js` → `login({login, senha})`.
    - `api/colaborador.js` → `registrar(body)`, `me()`, `listar()`, `atualizar(cpf, body)`, `desativar(cpf)`, `cadastrarBiometria(blob)`.
    - `api/ponto.js` → `baterPonto({blob, geo})` (`/ponto/`), `baterPontoEmbarcado({blob, geo})` (`/ponto/embarcado`).
    - `api/empresa.js` → `cadastrar(body)`, `listar()`, `buscar(cnpj)`, `atualizar(cnpj, body)`, `desativar(cnpj)`.
    - `api/relatorio.js` → `dia(data?)`, `historico({dataInicio, dataFim})`, `empresa(empresaId, {dataInicio, dataFim, formato})`.
  - Image uploads send the captured `Blob` as a multipart field named exactly `imagem` (plus `geo` for punches).
- **Relevant files / areas:**
  - new: `frontend/src/api/client.js`, `frontend/src/api/{auth,colaborador,ponto,empresa,relatorio}.js`
- **Done when:**
  - Authenticated calls automatically carry the bearer token; public calls work without one.
  - Multipart uploads use field names matching the controllers (`imagem`, `geo`).
  - Backend error `detail` is surfaced to callers in a consistent shape.

#### [FE-SHARED-3] Auth context and route guards
- **Priority:** P0
- **Status:** todo
- **Why it exists:** The JWT must be stored once and shared; protected screens need a guard; the manager flow needs role gating. Login and registration both return a token + `colaborador` that must be captured app-wide.
- **What must be done:**
  - `frontend/src/auth/AuthContext.jsx`: store the JWT and the `colaborador`; expose `login`, `cpf`, `empresa_id` (decoded from the token or the `colaborador`), plus `setSession(token, colaborador)` and `logout()`. Persist the token (e.g. `localStorage`) so a refresh keeps the session; **never** persist captured images.
  - `frontend/src/auth/guards.jsx`: `RequireAuth` (redirect to login if no token) and `RequireManager` (manager-only).
  - **Role gating is blocked on AUTHZ-1:** neither the JWT nor `ColaboradorResponse` exposes `gerente` today, so `RequireManager` cannot be implemented correctly yet. Build `RequireAuth` now; stub `RequireManager` to read a future `gerente` claim/field and mark the manager routes `blocked on AUTHZ-1`.
- **Relevant files / areas:**
  - new: `frontend/src/auth/AuthContext.jsx`, `frontend/src/auth/guards.jsx`
  - consumes: `FE-SHARED-2` (api client) — `blocked on` AUTHZ-1 for the manager-gating portion only
- **Done when:**
  - The token from login/registration is stored and injected into subsequent API calls (via `FE-SHARED-2`).
  - `RequireAuth` redirects unauthenticated users to login; a page refresh preserves the session.
  - `cpf` and `empresa_id` are readable from context for downstream screens.
  - `RequireManager` is wired but explicitly gated behind AUTHZ-1 (documented in code).

#### [FE-SHARED-4] `CameraCapture` component (oval face guide → Blob)
- **Priority:** P0
- **Status:** todo
- **Why it exists:** Three flows (kiosk punch, authenticated punch, biometric enrollment) all need the same capture experience. The client never runs recognition (NFR05) — it only captures bytes and hands them to a caller-supplied submit.
- **What must be done:**
  - `frontend/src/components/CameraCapture.jsx`: open `getUserMedia` (prefer front camera, `facingMode: "user"`), render the live video with an **oval face-guide overlay**, and a large capture button. On capture, draw the current frame to a canvas and export a `Blob`.
  - Props: `onCapture(blob)` (or a caller-supplied `onSubmit(blob)`), plus state callbacks for `capturing`/`error`. The component does **not** know which endpoint receives the upload — the parent wires that.
  - Mobile: portrait orientation, full-bleed video, capture button in the thumb-reach zone; release the camera stream (`stop()` all tracks) on unmount/after capture; **discard the Blob from memory after the parent finishes uploading** (no caching, no object URLs left dangling).
  - Handle permission-denied / no-camera gracefully with a clear message.
- **Relevant files / areas:**
  - new: `frontend/src/components/CameraCapture.jsx`
  - reused by: `FE-PUNCH-1`, `FE-PUNCH-2`, `FE-ENROLL-1`
- **Done when:**
  - The component streams the camera with an oval guide and captures a frame to a `Blob`.
  - The camera stream is stopped and the captured image is discarded after the parent's upload completes (NFR05) — nothing written to disk/storage.
  - It works in portrait on a phone, one-handed, with the capture button in thumb reach.
  - Permission/no-camera failures show a clear message rather than a blank screen.

#### [FE-MENU-1] Initial menu screen
- **Priority:** P0
- **Status:** todo
- **Why it exists:** The app needs a single entry point offering the four starting actions before any session exists.
- **What must be done:**
  - `frontend/src/pages/MenuPage.jsx` with four entry points: **Kiosk clock-in**, **Login**, **Employee registration**, **Company registration**, each routing to its screen.
  - Mobile-first stacked layout; primary actions large and within thumb reach.
- **Relevant files / areas:**
  - new: `frontend/src/pages/MenuPage.jsx`
- **Done when:**
  - All four entry points navigate to the correct routes.
  - **Mobile:** operable one-handed, actions in thumb reach, no horizontal scroll at mobile widths.

#### [FE-AUTH-1] Login screen
- **Priority:** P0
- **Status:** todo
- **Why it exists:** Collaborators and managers authenticate here. `POST /auth/login` returns the token + `colaborador`; the session must be stored and the user routed to their home.
- **What must be done:**
  - `frontend/src/pages/LoginPage.jsx`: `login` + `senha` fields → `api/auth.login` → `setSession(token, colaborador)` (FE-SHARED-3) → navigate to the employee punch home (`FE-PUNCH-2`).
  - **Role-based routing (manager vs employee view) is blocked on AUTHZ-1:** the token/`colaborador` carry no `gerente`, so the client cannot route managers to manager entry points yet. For now route everyone to the punch home; once AUTHZ-1 lands, surface manager entry points there based on the role.
  - Surface backend auth errors (bad credentials → 401/403) as a clear inline message.
- **Relevant files / areas:**
  - new: `frontend/src/pages/LoginPage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3` — manager routing `blocked on AUTHZ-1`
- **Done when:**
  - A valid login stores the session and lands on the punch home.
  - Invalid credentials show a clear error; no token is stored.
  - **Mobile:** one-handed operation, primary action in thumb reach, no horizontal scroll at mobile widths.
  - Manager-specific routing is explicitly deferred to AUTHZ-1 (documented in code).

#### [FE-AUTH-2] Employee registration screen
- **Priority:** P0
- **Status:** todo
- **Why it exists:** New collaborators self-register. `POST /colaborador/registro/` returns a token (auto-login), so registration flows straight into the punch experience.
- **What must be done:**
  - `frontend/src/pages/RegistroColaboradorPage.jsx`: collect `cpf`, `nome`, `login`, `senha`, `empresa_id`. **Do not** list/suggest companies (`empresa_id` is typed in). **No manager flag** — do not send `gerente` (server forces `false` and ignores it).
  - Because `RegistroColaboradorRequest.facial` is currently **required**, send `facial: []`; embeddings are enrolled separately via `FE-ENROLL-1`. (When BIO-1 removes the in-body field, drop `facial` from the payload.)
  - On success, `setSession(token, colaborador)` and route the new collaborator onward — to biometric enrollment (`FE-ENROLL-1`) since punching requires a stored embedding, then to the punch home (`FE-PUNCH-2`).
  - **"Company not found" error is blocked on RECOG-2:** registration does not yet validate company existence/active status, so a bad `empresa_id` may fail only at the DB/FK level with an unclear error. Surface whatever the backend returns now; once RECOG-2 lands, show a clean "company not found / inactive" message.
- **Relevant files / areas:**
  - new: `frontend/src/pages/RegistroColaboradorPage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3` — clean company error `blocked on RECOG-2`; `facial: []` workaround clears with BIO-1
- **Done when:**
  - A successful registration auto-logs-in (token stored) and routes to enrollment → punch home.
  - The payload never includes a manager flag and never includes a client-computed embedding (`facial: []` only).
  - **Mobile:** one-handed operation, primary action in thumb reach, no horizontal scroll at mobile widths.
  - A non-existent company surfaces a clear error once RECOG-2 lands (deferred until then, documented).

#### [FE-AUTH-3] Company registration screen
- **Priority:** P0
- **Status:** todo
- **Why it exists:** Companies must exist before collaborators can register against them. `POST /empresa` is public.
- **What must be done:**
  - `frontend/src/pages/RegistroEmpresaPage.jsx`: a simple form for `cnpj`, `razao_social`, `endereco`, `limite_hora` → `api/empresa.cadastrar` → confirmation, then back to the menu or to employee registration.
- **Relevant files / areas:**
  - new: `frontend/src/pages/RegistroEmpresaPage.jsx`
  - consumes: `FE-SHARED-2`
- **Done when:**
  - Submitting creates a company and shows confirmation (including the `cnpj` to use as `empresa_id`).
  - **Responsive:** usable on a phone (degrades gracefully); no horizontal scroll at mobile widths.

#### [FE-PUNCH-1] Kiosk clock-in (embedded) screen
- **Priority:** P0
- **Status:** todo
- **Why it exists:** The kiosk is a single-purpose, public punch-only screen where identity is established purely by facial recognition (`POST /ponto/embarcado`, no token).
- **What must be done:**
  - `frontend/src/pages/KioskPage.jsx`: a prominent **Clock In** button opens `CameraCapture` (oval guide) → captures → submits the `Blob` to `api/ponto.baterPontoEmbarcado({blob, geo})`.
  - Acquire `geo` from `navigator.geolocation` if available; submit whatever the backend accepts as the `geo` field (best-effort string).
  - Show distinct result states: **success** (recognized + punched), **face not recognized** (401), and **too soon** (BR02, 429). Reset to ready for the next person after a result.
- **Relevant files / areas:**
  - new: `frontend/src/pages/KioskPage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-4`
- **Done when:**
  - Clock-in captures a frame and submits to `/ponto/embarcado`; success/not-recognized/too-soon are clearly distinguished.
  - The screen returns to a ready state for the next user after each attempt.
  - **Mobile:** one-handed, Clock-In button in thumb reach, fast (~3s) flow, no horizontal scroll at mobile widths.

#### [FE-PUNCH-2] Employee punch home (post-login / post-registration)
- **Priority:** P0
- **Status:** todo
- **Why it exists:** This is the authenticated collaborator's home: punch as themselves, see today's punches, and reach their profile.
- **What must be done:**
  - `frontend/src/pages/PunchHomePage.jsx` behind `RequireAuth`.
  - A **Clock In** button (above the cards, in thumb reach) opens the same `CameraCapture` flow but submits to `api/ponto.baterPonto({blob, geo})` (`/ponto/`, token identity) — **not** the kiosk endpoint.
  - **Today's punches:** load `api/relatorio.dia()` and render each punch as a card (time + derived `tipo` entrada/saida + count/`total`). Refresh after a successful punch.
  - A **circular profile button** in a top corner routes to the employee profile (`FE-PROFILE-1`).
  - Result states for the punch mirror the kiosk: success / not recognized / too soon / not enrolled (the last is expected before `FE-ENROLL-1` is completed; show a clear "enroll your face first" prompt linking to enrollment).
- **Relevant files / areas:**
  - new: `frontend/src/pages/PunchHomePage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3`, `FE-SHARED-4`; links to `FE-PROFILE-1`, `FE-ENROLL-1`
- **Done when:**
  - Clock-in submits to `/ponto/` as the token holder; today's punches render from `/relatorio/dia` and refresh after a punch.
  - The profile button navigates to the profile screen.
  - A not-enrolled punch shows a clear prompt to enroll (links to `FE-ENROLL-1`).
  - **Mobile:** one-handed, Clock-In in thumb reach, ~3s flow, no horizontal scroll at mobile widths.

### P1 — Core product completion

#### [FE-SHARED-5] `ProfileForm` component (read-only + edit toggle)
- **Priority:** P1
- **Status:** todo
- **Why it exists:** Both the employee profile and the manager employee file show the same collaborador fields with an Edit→Save pattern; only the Save target differs. One component avoids duplication.
- **What must be done:**
  - `frontend/src/components/ProfileForm.jsx`: render `ColaboradorResponse` fields (`cpf` read-only always, `nome`, `login`, `empresa_id`, `status`) read-only by default; an **Edit** toggle enables editable fields; **Save** calls a caller-supplied `onSave(patch)` handler. Editable field set is caller-configurable (employee self-edit allows fewer fields than manager edit).
  - Do not bake an endpoint in — the parent injects `onSave` (employee → `PUT /colaborador/me`; manager → `PUT /colaborador/{cpf}`).
- **Relevant files / areas:**
  - new: `frontend/src/components/ProfileForm.jsx`
  - reused by: `FE-PROFILE-1`, `FE-MANAGER-1`
- **Done when:**
  - The form renders read-only by default and toggles to editable; Save delegates to the injected handler.
  - The same component is reused by employee profile and manager employee file with different `onSave` and editable-field sets.

#### [FE-SHARED-6] CSV export helper
- **Priority:** P1
- **Status:** todo
- **Why it exists:** The employee's own history endpoint (`/relatorio/historico`) returns JSON only — no server CSV. The employee history export must build the CSV client-side. (The manager company report already supports server-side CSV via `formato=csv`, so it does not need this helper.)
- **What must be done:**
  - `frontend/src/lib/csv.js`: `punchesToCsv(items)` building a `.csv` string from a punch list (columns e.g. `data, hora, tipo, geo`), and a `downloadCsv(filename, content)` trigger.
- **Relevant files / areas:**
  - new: `frontend/src/lib/csv.js`
  - reused by: `FE-PROFILE-1`
- **Done when:**
  - Given a punch list, the helper produces a well-formed `.csv` and triggers a browser download.

#### [FE-ENROLL-1] Biometric enrollment flow
- **Priority:** P1
- **Status:** todo
- **Why it exists:** Punching as a token holder (`/ponto/`) requires a stored embedding; RF13 (enroll on first punch) is out of MVP scope, so enrollment is an explicit self-service step via `POST /colaborador/registro/cadastrar-biometria`. The client captures and uploads; the server extracts the embedding.
- **What must be done:**
  - `frontend/src/pages/EnrollPage.jsx` behind `RequireAuth`: explain the step, open `CameraCapture` (oval guide), capture, submit the `Blob` to `api/colaborador.cadastrarBiometria(blob)`.
  - Reachable from the post-registration onboarding (`FE-AUTH-2`) and from the punch home's "not enrolled" prompt (`FE-PUNCH-2`).
  - Show success → route to the punch home; show capture/no-face errors clearly. Discard the captured image after upload (NFR05).
- **Relevant files / areas:**
  - new: `frontend/src/pages/EnrollPage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3`, `FE-SHARED-4`
- **Done when:**
  - The token holder can capture and upload their face; success enables subsequent `/ponto/` punches.
  - No-face / capture errors are surfaced clearly; the image is discarded after upload.
  - **Mobile:** one-handed, capture button in thumb reach, no horizontal scroll at mobile widths.

#### [FE-PROFILE-1] Employee profile + own punch history/export
- **Priority:** P1
- **Status:** todo
- **Why it exists:** RF09 — collaborators view (and edit) their own profile and consult their punch history. Combines the shared `ProfileForm` with a self-history search/export section.
- **What must be done:**
  - `frontend/src/pages/ProfilePage.jsx` behind `RequireAuth`.
  - **Profile section:** load `GET /colaborador/me` into `ProfileForm` (read-only by default). Edit→Save issues the self-update.
    - **Save is blocked on COLAB-3:** there is no authenticated self-edit endpoint today (`PUT /colaborador/{cpf}` is manager-only). Do **not** call the manager endpoint from here. Build the read-only view + Edit UI now, but wire Save to `PUT /colaborador/me` only once COLAB-3 exists; until then disable/hide Save and mark it pending.
  - **No self-deactivate** here — deactivation lives in the manager flow (backend disallows self-deactivate).
  - **Punch history section:** start date + end date + **Search** → `GET /relatorio/historico` → render as a **client-side paginated** list (the endpoint is not paginated; REPORT-5 would add server pagination later, but the frontend paginates client-side for now).
  - **Export:** enabled once results load; builds a `.csv` for the searched period via the CSV helper (`FE-SHARED-6`).
- **Relevant files / areas:**
  - new: `frontend/src/pages/ProfilePage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3`, `FE-SHARED-5`, `FE-SHARED-6` — Save `blocked on COLAB-3`; server pagination tracked by REPORT-5 (client-side until then)
- **Done when:**
  - The profile loads from `/colaborador/me` read-only; Edit→Save is built but wired only after COLAB-3 (the manager endpoint is never called from here).
  - History search calls `/relatorio/historico` and renders a client-side paginated list.
  - Export becomes enabled after results load and downloads a `.csv` for the period.
  - **Mobile:** one-handed, primary actions in thumb reach, no horizontal scroll at mobile widths.

#### [FE-MANAGER-1] Manager — My Employees + employee file
- **Priority:** P1
- **Status:** todo — **blocked on AUTHZ-1**
- **Why it exists:** RF10 — managers list and manage their company's collaborators. Listing uses `GET /colaborador/`; the employee file reuses `ProfileForm` for manager edit (`PUT /colaborador/{cpf}`) and deactivate (`DELETE /colaborador/{cpf}`).
- **What must be done:**
  - `frontend/src/pages/ManagerEmployeesPage.jsx` (behind `RequireManager`): list collaborators via `api/colaborador.listar()`. Clicking a row opens the employee file.
  - `frontend/src/pages/EmployeeFilePage.jsx`: render that employee's profile via `ProfileForm` with manager-editable fields; **Edit→Save** → `PUT /colaborador/{cpf}`; **Deactivate** → `DELETE /colaborador/{cpf}` behind a **confirmation modal**. Surface backend guard errors (self-deactivate / last-active-manager / cross-company BR06) as clear messages.
  - Optionally show that employee's punch history scoped to them (reuse the history rendering from `FE-PROFILE-1` / `/relatorio/empresa` filtered to the collaborator).
  - **Blocked on AUTHZ-1:** the client cannot identify managers (no `gerente` in JWT/`ColaboradorResponse`), so `RequireManager` and the route to this screen cannot be enforced/reached correctly until AUTHZ-1 lands.
- **Relevant files / areas:**
  - new: `frontend/src/pages/ManagerEmployeesPage.jsx`, `frontend/src/pages/EmployeeFilePage.jsx`
  - new: `frontend/src/components/ConfirmModal.jsx` (deactivate confirmation; reusable)
  - consumes: `FE-SHARED-2`, `FE-SHARED-3`, `FE-SHARED-5` — **blocked on AUTHZ-1**
- **Done when:**
  - A manager lists their company's collaborators and opens an employee file.
  - Edit→Save updates via `PUT /colaborador/{cpf}`; Deactivate requires confirmation and calls `DELETE /colaborador/{cpf}`.
  - Self/last-manager/cross-company guard errors are shown clearly.
  - **Responsive:** desktop-oriented but degrades gracefully on small screens (no horizontal scroll at mobile widths).
  - Reachable only after AUTHZ-1 surfaces the role.

#### [FE-MANAGER-2] Manager — company report
- **Priority:** P1
- **Status:** todo — **blocked on AUTHZ-1**
- **Why it exists:** RF12 — managers request the whole company's punches for a period via `GET /relatorio/empresa/{empresa_id}` (JSON view + CSV export, both supported server-side).
- **What must be done:**
  - `frontend/src/pages/ManagerReportPage.jsx` (behind `RequireManager`): date range inputs → `api/relatorio.empresa(empresa_id, {dataInicio, dataFim, formato})` with `empresa_id` from the auth context (`empresa_id` claim).
  - Render the JSON report (per-collaborator hours, overtime flags BR05) as a table; an **Export CSV** action requests `formato=csv` and downloads the server-generated file (no client CSV helper needed here).
  - **Blocked on AUTHZ-1** for the same role-detection reason as `FE-MANAGER-1`.
- **Relevant files / areas:**
  - new: `frontend/src/pages/ManagerReportPage.jsx`
  - consumes: `FE-SHARED-2`, `FE-SHARED-3` — **blocked on AUTHZ-1**
- **Done when:**
  - A manager fetches the company report for a period (JSON table) and exports CSV via `formato=csv`.
  - Overtime flags appear in the table.
  - **Responsive:** desktop-oriented, degrades gracefully on small screens (no horizontal scroll at mobile widths).
  - Reachable only after AUTHZ-1 surfaces the role.

### P2 — Polish

#### [FE-PUNCH-3] Punch result & error UX polish
- **Priority:** P2
- **Status:** todo
- **Why it exists:** The punch loop is the most-used, most time-sensitive flow (~3s target, NFR-aligned). Both the kiosk and authenticated punch should share consistent, legible result feedback.
- **What must be done:**
  - Unify the result/error taxonomy across `FE-PUNCH-1` and `FE-PUNCH-2`: **success**, **face not recognized** (401), **too soon / BR02** (429), **not enrolled** (login punch with no embedding). Map backend `detail`/status to friendly copy.
  - Add capture→upload progress feedback and an auto-reset so the kiosk is ready for the next person quickly; keep total interaction near the ~3s target.
- **Relevant files / areas:**
  - `frontend/src/pages/KioskPage.jsx`, `frontend/src/pages/PunchHomePage.jsx`
  - new: `frontend/src/components/PunchResult.jsx` (shared result banner)
- **Done when:**
  - Both punch screens show consistent success/not-recognized/too-soon/not-enrolled states from the backend response.
  - Feedback is fast and the kiosk auto-resets; the flow stays close to ~3s.
  - **Mobile:** result and retry actions are in thumb reach; no horizontal scroll at mobile widths.

#### [FE-SHARED-7] Responsive/one-handed QA pass + shared loading/empty/error primitives
- **Priority:** P2
- **Status:** todo
- **Why it exists:** After the screens exist, a cross-cutting pass ensures NFR01 holds everywhere and that loading/empty/error states are consistent rather than re-invented per screen.
- **What must be done:**
  - Extract shared primitives: `Spinner`/loading, empty-state, error banner, and toast — and apply them across the screens that currently inline these states.
  - Run a responsive/one-handed QA pass at mobile widths (~360–414px) over every collaborator-facing screen: thumb-reach primary actions, no horizontal scroll, tap targets large enough; verify manager screens degrade gracefully.
- **Relevant files / areas:**
  - new: `frontend/src/components/{Spinner,EmptyState,ErrorBanner,Toast}.jsx`
  - all `frontend/src/pages/*`
- **Done when:**
  - Loading/empty/error states are consistent and use the shared primitives.
  - Every collaborator-facing screen passes the one-handed/no-horizontal-scroll check at mobile widths; manager screens degrade gracefully.

---

## 8. Task format

Every task follows this template (mirrors `TASKS.md`):

```markdown
#### [FE-PREFIX-N] Task title
- **Priority:** P0/P1/P2
- **Status:** todo
- **Why it exists:** the gap/problem
- **What must be done:**
  - concrete steps
- **Relevant files / areas:**
  - real `frontend/...` paths (or clearly-marked `new:`)
- **Done when:**
  - objective acceptance criteria (collaborator-facing tasks include a mobile/responsive criterion)
```

## 9. Task-writing rules

- **Verify against the controllers**, not `TASKS.md` prose — Section 5 is the confirmed contract.
- **Never invent endpoints.** Missing backend behavior → a task in `TASKS.md` + `blocked on <TASK-ID>` here.
- **Reuse over duplication.** `CameraCapture`, `ProfileForm`, the API client, and the CSV helper are shared; screens consume them.
- **Stay in MVP scope.** No input-validation tasks; no features absent from the product surface.
- **Mobile-first.** Every collaborator-facing task's "Done when" carries a one-handed / thumb-reach / no-horizontal-scroll criterion (NFR01); manager screens degrade gracefully.
- **No backend edits.** Frontend lives only under `frontend/`; `application/`, `domains/`, `infra/`, `presentation/` are off-limits.
