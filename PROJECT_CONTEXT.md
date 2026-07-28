# FaceClock — Project Context

The stable product + requirements reference for FaceClock. It defines **what the product is and
must do**. It is *not* the backlog and *not* the decision log:

- **Backlog / status** → [GitHub Issues](https://github.com/luucasorion/FaceClock/issues)
- **Decisions** → [`docs/adr/`](docs/adr/)
- **Working rules / conventions** → [`CLAUDE.md`](CLAUDE.md)

> Requirements below describe intended behavior. They are **not** proof a feature is implemented —
> check the code and the issues for status.

---

## 1. Product

FaceClock is a **facial-recognition time clock** that makes attendance identity-bound and
fraud-resistant. It replaces manual spreadsheets, badges, and PINs with a flow centered on
identity-verified punch registration.

A company can: register collaborators, associate facial biometrics, authenticate collaborators by
face, register attendance punches, track daily worked hours and overtime, and give HR/management
attendance visibility and reports.

**Core goals:** identity assurance for punches · reliable per-collaborator/company tracking ·
manager visibility and auditability · reduced manual HR effort.

### Users

- **Collaborator** — performs daily punches; views own profile and history. The punch flow must be
  fast and simple (target ~3s), operable one-handed on a phone.
- **HR Manager** — manages collaborators and company data, audits attendance, exports reports,
  reviews overtime. Values report reliability and low payroll-closing rework.

### Scope

**In:** attendance registration, auditing, worked-hours + daily overtime tracking, reports.
**Out:** payroll/payslips, social charges, complex time-bank, shift-rotation planning, turnstile /
physical access-control hardware.

**Constraints:** recognition depends on image quality (baseline ≥ 300 lux); biometric and
credential data must be handled securely; no hardware access-device integration.

---

## 2. Functional Requirements (RF)

| ID | Requirement |
|---|---|
| RF01 | Company registration (legal name, CNPJ, address). |
| RF02 | User registration with access profile (**Manager** or **Collaborator**). |
| RF03 | Punch Profiles per company, including overtime limits. |
| RF04 | Link facial biometrics to a collaborator. |
| RF05 | Edit and deactivate company and user records. |
| RF06 | Authenticate collaborators by facial recognition via device camera. |
| RF07 | Register attendance timestamps bound to the recognized collaborator. |
| RF08 | User login. |
| RF09 | Collaborator views own profile, linked Punch Profile, and monthly history. |
| RF10 | Manager consults attendance for all collaborators of their company. |
| RF11 | Calculate daily worked hours and overtime from the Punch Profile. |
| RF12 | Generate and export attendance reports. |
| RF13 | Register biometrics on the **first** punch. *(Deferred — see [ADR 0003](docs/adr/0003-defer-rf13-dedicated-enrollment.md).)* |

## 3. Non-Functional Requirements (NFR)

| ID | Requirement |
|---|---|
| NFR01 | Collaborator UI operable one-handed; primary actions in thumb reach. |
| NFR02 | Facial validation returns within 30s. |
| NFR03 | Built in Python. |
| NFR04 | Passwords stored with one-way hashing (bcrypt). Plaintext prohibited. |
| NFR05 | Captured facial images are **not** persisted on device; processed in memory then discarded. |
| NFR06 | Biometric/credential traffic between frontend and backend over HTTPS. |

## 4. Business Rules (BR)

| ID | Rule |
|---|---|
| BR01 | A punch is valid only if recognition similarity ≥ **0.65**. See [ADR 0008](docs/adr/0008-recognition-threshold-single-source.md). |
| BR02 | Block a new punch if < **5 minutes** since the previous one. |
| BR03 | Only **Managers** may export multi-user reports and edit/delete collaborator or company data. |
| BR04 | Daily overtime counts only worked time exceeding the Punch Profile's hour limit. |
| BR05 | Reports flag collaborators exceeding the overtime limit. |
| BR06 | A collaborator may only register attendance and view history for their actively-linked company. |

---

## 5. Technical Direction

**Stack (fixed):** Python · FastAPI · SQLAlchemy · SQLite · DeepFace · JWT. Frontend: React + Vite
+ MUI SPA in `frontend/`, consuming the REST API. The frontend does not run face recognition — it
captures camera frames and uploads bytes; embeddings are computed server-side (NFR05).

**Architecture:** clean architecture, dependencies inward. See [ADR 0002](docs/adr/0002-clean-architecture-layering.md)
and [`CLAUDE.md`](CLAUDE.md).

| Layer | Directory | Responsibility |
|---|---|---|
| presentation | `presentation/` | HTTP handlers, request/response DTOs, DI |
| application | `application/` | business rules, orchestration (use cases, services) |
| domain | `domains/` | entities, contracts, domain exceptions |
| infra | `infra/` | SQLAlchemy, DeepFace, JWT, external tech |

FastAPI conventions follow the [official full-stack template](https://github.com/fastapi/full-stack-fastapi-template),
adapted to our layering — [ADR 0001](docs/adr/0001-align-with-fastapi-template-conventions.md).

---

## 6. Domain Model

- **Colaborador** — `cpf` (PK), `nome`, `login` (unique), `senha` (bcrypt), `status` (bool),
  `facial` (JSON embedding, nullable), `empresa_id` (FK → `empresas.cnpj`), `gerente` (bool).
  Manager vs collaborator is the `gerente` flag, not a separate entity ([ADR 0007](docs/adr/0007-manager-as-boolean-flag.md)).
- **Empresa** — `cnpj` (PK), `razao_social`, `endereco`, `limite_hora` (daily hour limit),
  `status` (bool). No dedicated PunchProfile entity — `limite_hora` is the only hour limit modeled.
- **BatidaPonto** — `id` (UUID PK), `colaborador_id` (FK → `colaboradores.cpf`), `geo` (nullable),
  `batida` (datetime). Entry/exit type is derived by sequence position, not stored ([ADR 0006](docs/adr/0006-punch-type-by-sequence.md)).

Relationships: `Empresa` 1—* `Colaborador` 1—* `BatidaPonto`.

---

## 7. Key flows

- **Registration** — CPF/login uniqueness, bcrypt password, JWT issued on registration.
- **Enrollment** — dedicated server-side endpoint extracts the embedding and binds it to the
  authenticated token holder; punch assumes prior enrollment ([ADR 0003](docs/adr/0003-defer-rf13-dedicated-enrollment.md)).
- **Punch** — authenticated (`POST /ponto/`, identity from token) and kiosk/blind
  (`POST /ponto/embarcado`, identity by 1:N match). Both enforce BR01 (0.65) and BR02 (5 min).
- **Login / auth** — password login issues a JWT (`sub`/`cpf`/`empresa_id`/`gerente`). Role and
  company scope are read from the token, not re-queried ([ADR 0004](docs/adr/0004-role-authz-from-jwt-claim.md)).
- **First-manager bootstrap** — creating a company atomically creates its first manager
  ([ADR 0005](docs/adr/0005-first-manager-bootstrap.md); hardening tracked in issue AUTHZ-4).
- **Reports** — self history + daily summary; manager company report (JSON/CSV), company-scoped
  (BR06). Worked-hours/overtime via a pure calculator (RF11/BR04/BR05).

---

## 8. Known open work

Tracked as [GitHub Issues](https://github.com/luucasorion/FaceClock/issues):

- **Product/security:** API-1 (response DTOs) · AUTHZ-4 (rotate predictable bootstrap credential) ·
  BIO-1 (single enrollment path) · RECOG-2 (validate company at registration).
- **Architecture:** ARCH-1 (`FacialService` → infra) · ARCH-2 (domain exceptions) ·
  ARCH-3 (repository contracts) · ARCH-4 (centralized DI) · REVIEW-1/2/4 (deepen the punch and
  report modules).
