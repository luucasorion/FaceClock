# FaceClock — Project Context

## 1. Document Purpose
This document defines the **product context, requirement baseline, business rules, architectural direction, and implementation tracking structure** for **FaceClock**.

FaceClock is a **facial-recognition-based time clock system** designed to reduce operational inefficiencies in attendance control and increase trustworthiness in employee time registration.

This document serves five purposes:

1. **Product definition**  
   It describes what FaceClock is, which problem it solves, who its users are, and which requirements define the intended system behavior.

2. **Architecture guidance**  
   It provides implementation guidance for the project structure, system boundaries, and responsibility distribution across layers.

3. **Implementation source of truth**  
   It tracks what is actually implemented in the codebase versus what is only planned or required.

4. **Validation and QA support**  
   It supports test case design, conformance validation, and final project review by documenting requirements, rules, and current implementation status.

5. **Claude working context**  
   It gives Claude agents a stable project context so that architecture, backend, frontend, and QA work stay aligned with the same product and technical assumptions.

---

## 2. Product Objective
FaceClock is intended to provide a **reliable and fraud-resistant attendance registration system** based on **facial biometrics**.

The system should allow a company to:
- register collaborators
- define punch/working-hour profiles
- associate collaborators with facial biometrics
- authenticate collaborators through facial recognition
- register attendance punches
- track daily worked hours and overtime
- provide attendance visibility and reports for HR/management

The central value proposition is to replace fragile attendance mechanisms based on:
- manual spreadsheets
- physical badges
- passwords or PINs
- attendance correction by HR after the fact

with a flow centered on **identity-bound punch registration**.

---

## 3. Background and Problem Statement

### 3.1 Current Operational Problem
The FaceClock concept is based on empirical findings gathered during requirements elicitation with HR managers and analysis of manual attendance records.

The current manual and semi-manual attendance process was found to have the following issues:

- annotation failures in approximately **15% of monthly attendance records**
- around **35% of HR productive time** consumed by attendance checking and payroll-closing rework
- approximately **12% monthly badge/password forgetting or loss rate**
- discrepancies between real worked hours and manually validated hours in analyzed records
- risk of proxy punching and weak identity verification
- legal and administrative risk due to inaccurate attendance computation

### 3.2 Why FaceClock Exists
FaceClock exists to reduce these operational and trust issues by introducing **facial authentication** into the attendance process.

The system aims to:
- ensure that punches are tied to the actual collaborator performing them
- reduce manual reconciliation effort for HR
- reduce attendance inconsistencies such as missing or duplicate punches
- provide stronger auditability and reporting reliability
- improve legal defensibility of attendance records

---

## 4. References

## 4.1 Legal and Technical References
- **DOC01** — Brazilian regulation for electronic timekeeping  
  **Portaria nº 671**, 2021-11-08, Ministério do Trabalho e Previdência

- **DOC02** — OpenCV Official Documentation  
  Version 4.x, 2024

- **DOC03** — Requirements Specification for the Systems Analysis and Design course  
  2026, Department of Informatics and Statistics (INE), Federal University of Santa Catarina (UFSC)

## 4.2 Requirements Elicitation / Current Process Analysis
- **DOC04** — Analysis of manual attendance spreadsheets and attendance reports  
  2026, HR documentation used to map current business rules and operational issues.

- **ENT01** — Semi-structured interviews with HR managers  
  2026, internal project material used to identify pain points, operational inefficiencies, and usability expectations.

## 4.3 Benchmarking / Similar Systems
- **SYS01** — Ahgora system analysis  
  Used as a benchmark for facial-recognition attendance flow, anti-fraud behavior, and user experience expectations.

- **SYS02** — PontoMais system analysis  
  Used as a benchmark for management reporting, attendance visibility, and general HR workflow expectations.

---

## 5. User Profiles

## 5.1 Collaborator
Typical characteristics:
- age range: **18 to 70**
- variable digital literacy
- uses the system mainly for daily attendance registration

Main responsibilities:
- perform facial capture when registering attendance
- access personal attendance history if that feature is available
- access own profile data if allowed

Key usability expectation:
- the punch flow should be **fast and simple**, ideally not exceeding **3 seconds** under normal conditions, in order to avoid queues and friction.

## 5.2 HR Manager
Typical characteristics:
- age range: **25 to 65**
- generally comfortable with management tools and reporting workflows

Main responsibilities:
- manage collaborators and company-level data
- define or review punch profiles / work-hour settings
- audit attendance records
- export and analyze attendance reports
- review overtime and inconsistencies

Key expectation:
- **report reliability** and **low manual rework** during payroll closing.

---

## 6. Expected Benefits

### 6.1 Fraud Reduction
Reduce or eliminate attendance records made by third parties by binding punch registration to facial recognition.

### 6.2 Operational Efficiency
Reduce HR effort spent on attendance validation, reconciliation, and payroll-closing rework.

### 6.3 Error Mitigation
Reduce inconsistencies such as:
- duplicate punches
- missing punches
- incorrect collaborator identification through weak manual processes
- errors caused by forgotten credentials or physical badge issues

### 6.4 Legal / Audit Reliability
Increase reliability of attendance records and overtime tracking, improving auditability and reducing legal exposure caused by inaccurate timekeeping.

---

## 7. Scope Limitations and Constraints

## 7.1 Out of Scope
The current FaceClock scope does **not** include:
- payroll processing
- payslip generation
- social charges / payroll calculations
- complex time-bank management
- dynamic shift rotation planning
- physical access-control integrations such as turnstiles

## 7.2 Attendance Scope Focus
FaceClock is focused on:
- attendance registration
- attendance auditing
- worked-hours tracking
- daily overtime tracking
- attendance reports and visibility for HR/management

## 7.3 Technical Constraints
- facial recognition depends on image quality and acceptable environmental conditions
- the requirement baseline assumes a **minimum lighting condition of 300 lux** for reliable capture
- biometric and credential-related data should be handled securely
- the current scope does not include hardware access-device integration

---

# 8. Requirement Baseline
> This section defines **what the product is intended to do**.
> It must **not** be confused with implementation status.
> A requirement listed here is not automatically implemented.

---

## 9. Functional Requirements Baseline

- **RF01** — The system must allow **company registration**, including legal name, tax ID (CNPJ), and address.
- **RF02** — The system must allow **user registration**, defining the access profile (**Manager** or **Collaborator**).
- **RF03** — The system must allow registration of **Punch Profiles** per company, including overtime limits.
- **RF04** — The system must allow linking **facial biometrics** to a collaborator record.
- **RF05** — The system must allow editing and deactivating company and user records.
- **RF06** — The system must authenticate collaborators through **facial recognition** using the device camera.
- **RF07** — The system must register **attendance timestamps** (date and time), linking them to the collaborator authenticated through facial recognition.
- **RF08** — The system must allow **user login**.
- **RF09** — The system must allow collaborators to view their own profile data, linked Punch Profile, and monthly punch history.
- **RF10** — The system must allow managers to consult attendance records for all collaborators linked to their company.
- **RF11** — The system must calculate total daily worked hours and overtime based on the Punch Profile.
- **RF12** — The system must allow generation and export of attendance reports.
- **RF13** — The system must register the collaborator’s facial biometrics on the **first time punch**.

---

## 10. Non-Functional Requirements Baseline

- **NFR01** — The collaborator-facing interface should be ergonomically designed to be operable with one hand, with primary action areas positioned for practical daily use.
- **NFR02** — Facial recognition validation should complete and return a response within **30 seconds**.
- **NFR03** — The system must be developed in **Python**.
- **NFR04** — Passwords must be stored using **one-way hashing** (e.g. bcrypt). Plain-text password storage is prohibited.
- **NFR05** — Captured facial images must **not** be permanently stored in local device memory. Images should be processed only as needed for biometric extraction and then discarded.
- **NFR06** — Communication involving biometric data and credentials between frontend and backend must occur through **HTTPS**.

---

## 11. Business Rules Baseline

- **BR01 / RN01** — A time punch is only valid if facial recognition reaches a minimum threshold of **0.65**.
- **BR02 / RN02** — The system must block a new time punch if the interval since the immediately previous punch is less than **5 minutes**.
- **BR03 / RN03** — Only authenticated users with the **Manager** role may export multi-user reports and edit/delete collaborator or company data.
- **BR04 / RN04** — Daily overtime must count only the portion of worked time that exceeds the working-hour limit defined in the company’s Punch Profile.
- **BR05 / RN05** — Management reports must flag collaborators who exceed the overtime limit defined in the Punch Profile.
- **BR06 / RN06** — A collaborator may only register attendance and view history for the company to which their account is actively linked.

---

## 12. Product Direction Notes
FaceClock should be treated as a **facial-recognition attendance system** centered on four core goals:

1. **Identity assurance** for attendance registration
2. **Reliable attendance tracking** per collaborator and company
3. **Manager visibility and auditability**
4. **Reduction of manual HR effort**

Architecture and implementation decisions should prioritize:
- correctness of collaborator identification
- reliable punch registration
- secure authentication
- report consistency
- role-based access control
- low-friction collaborator punch flow

---

# 13. Current Technical Direction

## 13.1 Current Stack
The current intended stack for FaceClock is:

- **Python**
- **FastAPI**
- **SQLAlchemy**
- **SQLite**
- **DeepFace**
- **JWT**

Additional libraries may exist, but these are the main technologies expected in the project context.

**Frontend (planned):** a separate **React + Vite** single-page client in a top-level `frontend/` directory, consuming the existing REST API. It is **not yet implemented** — see `TASKS_FRONTEND.md` for the frontend work backlog.

## 13.2 Current Architectural Style
The project follows a **Clean Architecture-inspired structure**.

Main folders:
- `controllers/`
- `domain/`
- `infra/`
- `usecases/`
- `main.py`

## 13.3 Intended Layer Responsibilities

### controllers
Responsible for:
- HTTP request/response handling
- payload and file intake
- basic validation of incoming requests
- translating use case results into API responses

Should not contain:
- core business rules
- facial comparison logic
- persistence logic mixed directly into request handling unless explicitly unavoidable

### domain
Responsible for:
- entities
- DTOs
- domain exceptions
- repository contracts/interfaces
- core business concepts and invariants where appropriate

### usecases
Responsible for:
- business rules
- orchestration of flows
- coordination between repositories and services
- system behavior independent of HTTP concerns

### infra
Responsible for:
- database access / SQLAlchemy implementations
- DeepFace integration
- JWT/token implementation
- low-level adapters and technical details

---

# 14. Claude Usage Rules for This File
This file must separate **requirements/product intent** from **real implementation state**.

## 14.1 Requirements sections
Sections such as:
- Product Objective
- Requirement Baseline
- Functional Requirements
- Non-Functional Requirements
- Business Rules Baseline

describe what FaceClock **should** do.

They are **not proof that the feature already exists in code**.

## 14.2 Implementation sections
Sections such as:
- Main Business Flows
- Current Domain Model
- Repositories and Persistence
- Existing Use Cases
- Existing Controllers / Endpoints
- Facial Recognition Design
- Authentication / JWT Design
- Rules Already Implemented
- Implementation Status Summary

must describe **only what can be confirmed in the codebase**.

When updating implementation sections:
- do not assume missing behavior exists
- mark features as `implemented`, `partially implemented`, or `missing`
- cite the relevant files as evidence
- if something is unclear, describe it as uncertain rather than inventing details

---

# 15. Current Project Structure
> This section must reflect the **real codebase structure**.
> Update it whenever folders/files change.

## Current Structure

```
FaceClock/
├── main.py
├── application/
│   ├── services/
│   │   ├── facial_service.py
│   │   └── hash_service.py
│   └── use_cases/
│       ├── colaborador/
│       │   ├── registrar_colaborador_usecase.py
│       │   ├── login_colaborador_usecase.py
│       │   ├── get_colaborador_usecase.py        (empty)
│       │   └── edicao_colaborador_usecase.py     (empty)
│       ├── empresa/
│       │   ├── cadastro_empresa_usecase.py       (empty)
│       │   ├── edicao_empresa_usecase.py         (empty)
│       │   └── get_empresa_usecase.py            (empty)
│       └── ponto/
│           ├── batida_ponto_usecase.py
│           ├── batida_ponto_embarcado_usecase.py
│           ├── cadastrar_biometria_usecase.py
│           └── get_ponto_usecase.py              (empty)
├── domains/
│   └── models/
│       ├── colaborador.py
│       ├── empresa.py
│       └── batida_ponto.py
├── infra/
│   ├── db/
│   │   ├── base.py
│   │   └── database.py
│   └── repositories/
│       ├── colaborador_repository.py
│       └── batida_ponto_repository.py
└── presentation/
    ├── controller/
    │   ├── colaborador_controller.py
    │   ├── login_controller.py
    │   ├── batida_ponto_controller.py
    │   ├── empresa_controller.py    (empty)
    │   └── relatorio_controller.py  (empty)
    └── schema/
        └── requests/
            ├── registro_colaborador_request.py
            └── login_colaborador_request.py
```

### Status
- documented from real repository on 2026-06-22

### Evidence
- all files confirmed by reading the actual codebase

## Planned Frontend Structure
> **Status: planned — not yet present in the codebase.** This subsection documents the intended `frontend/` client so structure stays aligned. Mark pieces as `implemented` only once they actually exist in code. Detailed tasks live in `TASKS_FRONTEND.md`.

The frontend is a **separate React + Vite SPA** that consumes the existing FastAPI REST API. It does **not** run facial recognition: it captures images from the device camera and uploads the bytes as multipart; embeddings are computed server-side, and captured images are held only in memory and discarded after upload (NFR05).

The client is **mobile-first / responsive (NFR01)**: the collaborator-facing screens (kiosk punch, employee punch home, profile, login, registration) must be operable one-handed on a phone with primary actions within thumb reach and a low-friction punch flow; manager screens are desktop-oriented but degrade gracefully on small screens.

```
FaceClock/
└── frontend/                     (planned — React + Vite SPA)
    ├── index.html
    ├── package.json
    ├── vite.config.js            # dev proxy → backend
    └── src/
        ├── main.jsx
        ├── App.jsx               # router (all screens below)
        ├── styles/base.css       # mobile-first layout tokens
        ├── api/                  # token-aware REST client per resource
        │   ├── client.js         # fetch wrapper + bearer injection + multipart
        │   ├── auth.js           # /auth/login
        │   ├── colaborador.js    # registro, me, listar, editar, biometria
        │   ├── ponto.js          # /ponto/ + /ponto/embarcado
        │   ├── empresa.js        # /empresa CRUD
        │   └── relatorio.js      # /relatorio/{dia,historico,empresa}
        ├── auth/
        │   ├── AuthContext.jsx   # JWT store; exposes cpf/empresa_id
        │   └── guards.jsx        # RequireAuth / RequireManager (role gating)
        ├── components/
        │   ├── CameraCapture.jsx # getUserMedia + oval face guide → Blob upload
        │   ├── ProfileForm.jsx   # read-only/edit collaborador form (shared)
        │   └── ConfirmModal.jsx  # deactivate confirmation (manager flow)
        ├── lib/
        │   └── csv.js            # client-side CSV export (self-history)
        └── pages/                # MenuPage, LoginPage, RegistroColaboradorPage,
                                  # RegistroEmpresaPage, EnrollPage, KioskPage,
                                  # PunchHomePage, ProfilePage,
                                  # ManagerEmployeesPage, EmployeeFilePage,
                                  # ManagerReportPage
```

### Notes
- The frontend is a **separate React + Vite client** consuming the existing FastAPI REST API over the endpoints documented in §20 / `TASKS_FRONTEND.md` §5. It does **not** run face recognition: `CameraCapture` captures camera frames to a `Blob` and uploads the bytes as multipart (`imagem`); embeddings are computed server-side and captured images are held only in memory and discarded after upload (NFR05).
- It is **mobile-first / responsive (NFR01)**: collaborator-facing screens (kiosk punch, employee punch home, profile, login, registration, enrollment) must be operable one-handed with primary actions in thumb reach and no horizontal scroll at mobile widths, with a low-friction (~3s) punch flow; manager screens (My Employees, company report) are desktop-oriented but degrade gracefully on small screens.
- Reused building blocks: the **API client**, the **auth context/guards**, **`CameraCapture`** (shared across kiosk punch, authenticated punch, and biometric enrollment), **`ProfileForm`** (shared between the employee profile and the manager employee file), and the **CSV helper** (self-history export, since `/relatorio/historico` is JSON-only).
- Manager-only routing (My Employees, company report) depends on the `gerente` role being surfaced in the JWT claims / `ColaboradorResponse` — currently absent (AUTHZ-1 remainder). Employee self-edit depends on a new authenticated self-edit endpoint (COLAB-3). Both are tracked in `TASKS.md` and referenced as `blocked on` in `TASKS_FRONTEND.md`.
- CORS is already permissive in `main.py` (`allow_origins=["*"]`); this must be narrowed to the real frontend origin, with HTTPS end-to-end (NFR06), before any non-local deployment.

### Evidence
- direction only; **no `frontend/` directory exists in the repository yet** (planned as of 2026-06-23). Per §14, all frontend pieces are marked `planned` until they exist in code. Detailed, reviewable tasks live in `TASKS_FRONTEND.md`.

---

# 16. Main Business Flows
> These sections describe the **current implementation status** of the codebase.

## 16.1 Collaborator Registration

### Intended flow
1. receive collaborator data
2. validate data
3. persist collaborator
4. return the created collaborator

### Current status
- **Partially implemented**

### What is implemented
- `POST /colaborador/registro/` accepts JSON body: `cpf`, `nome`, `login`, `senha`, `empresa_id`, `facial` (list of floats)
- `RegistrarColaboradorUseCase` checks CPF and login uniqueness, hashes password with bcrypt, creates and persists `Colaborador`
- The embedding is accepted directly from the client as `facial: list[float]` — not extracted server-side at registration

### What is missing
- No server-side facial image processing at registration time (embedding must be pre-computed by the client)
- No manager flag on `Colaborador` (Manager vs Collaborator distinction not implemented; intended as a boolean field, not a separate entity)
- No company existence validation — foreign key references `empresas.cnpj` but no check is done in the use case

### Evidence
- `presentation/controller/colaborador_controller.py`
- `application/use_cases/colaborador/registrar_colaborador_usecase.py`
- `presentation/schema/requests/registro_colaborador_request.py`
- `domains/models/colaborador.py`

---

## 16.2 Facial Embedding Registration

### Intended flow
1. receive collaborator image
2. extract embedding using DeepFace
3. validate whether a usable face was found
4. persist the embedding associated with the collaborator
5. return success or failure

### Current status
- **Implemented** (as a dedicated endpoint, separate from collaborator registration)

### What is implemented
- `POST /colaborador/registro/cadastrar-biometria` accepts `login` (form field) and `imagem` (file upload)
- `CadastrarBiometriaUseCase` looks up the collaborator by login, extracts embedding via `FacialService.gerar_embedding()`, stores it in `colaborador.facial`, persists via `ColaboradorRepository.atualizar()`
- `FacialService.gerar_embedding()` uses DeepFace with the ArcFace model, `enforce_detection=False`

### Notes
- Registration via `POST /colaborador/registro/` also accepts `facial: list[float]` in-body — two separate enrollment paths exist
- RF13 (biometrics registered on first punch) is not implemented — biometrics must be registered before the first punch through this dedicated endpoint

### Evidence
- `presentation/controller/colaborador_controller.py`
- `application/use_cases/ponto/cadastrar_biometria_usecase.py`
- `application/services/facial_service.py`

---

## 16.3 Facial Recognition

### Intended flow
1. receive an image
2. extract the image embedding
3. load stored collaborator embeddings
4. compare embeddings
5. select the best match
6. apply acceptance threshold
7. return the recognized collaborator or failure

### Current status
- **Implemented** (in the embarcado punch flow only)

### What is implemented
- `BatidaPontoEmbarcadoUseCase` extracts embedding from the image, iterates all collaborators with stored embeddings, calculates cosine similarity against each, selects the best match, and applies a threshold of `0.4`
- `FacialService` provides `gerar_embedding()`, `calcular_similaridade()` (cosine-based), and `validar_rosto()` (threshold comparison, default `0.6`)

### Notes
- The threshold used in `BatidaPontoEmbarcadoUseCase` is `0.4`, which diverges from BR01's required minimum of `0.65`
- `BaterPontoUseCase` (login-based punch) compares only against the named collaborator's embedding using `validar_rosto()` at default `0.6`, also diverging from BR01

### Evidence
- `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`
- `application/use_cases/ponto/batida_ponto_usecase.py`
- `application/services/facial_service.py`

---

## 16.4 Time Punch Registration

### Intended flow
1. receive image or punch request
2. identify collaborator through facial recognition
3. validate whether the punch can be recorded
4. persist the time punch
5. return punch data and the recognized collaborator

### Current status
- **Partially implemented**

### What is implemented
- Two punch endpoints:
  - `POST /ponto/` — login-based: accepts `login`, `geo`, `imagem`; verifies face against collaborator's stored embedding; saves `BatidaPonto`
  - `POST /ponto/embarcado` — blind: accepts `imagem` and `geo`; recognizes collaborator from all stored embeddings; saves `BatidaPonto`
- `BatidaPonto` stores `colaborador_id`, `geo`, and `batida` (datetime, defaults to `datetime.utcnow`)

### What is missing
- BR02 (5-minute interval rule) is not enforced in either use case
- `BatidaPontoRepository` only has a `salvar` method — no query for last punch by collaborator, so interval validation cannot be done
- Punch type classification (entry/exit) is not implemented

### Evidence
- `presentation/controller/batida_ponto_controller.py`
- `application/use_cases/ponto/batida_ponto_usecase.py`
- `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`
- `infra/repositories/batida_ponto_repository.py`
- `domains/models/batida_ponto.py`

---

## 16.5 Authentication / Login

### Intended flow
1. validate identity
2. generate JWT
3. return token and basic user data

### Current status
- **Partially implemented** (password validation only — no JWT)

### What is implemented
- `POST /auth/login` accepts `login` and `senha`
- `LoginColaboradorUseCase` looks up the collaborator by login, verifies password with bcrypt, checks `colaborador.status`, and returns the raw `Colaborador` ORM object

### What is missing
- No JWT is generated — the endpoint returns the raw ORM object, which includes the hashed password (security concern)
- No token service exists anywhere in the codebase
- No protected endpoints — no authentication middleware or JWT validation dependency

### Evidence
- `presentation/controller/login_controller.py`
- `application/use_cases/colaborador/login_colaborador_usecase.py`

---

# 17. Current Domain Model
> Document **only what actually exists in code**.

## Entities / Models Currently Implemented

### Colaborador (`domains/models/colaborador.py`)
- `cpf` — String, primary key
- `nome` — String, not null
- `login` — String, unique, not null
- `senha` — String, not null (bcrypt hash)
- `status` — Boolean, default True
- `facial` — JSON, nullable (stores embedding as list of floats)
- `empresa_id` — String, FK to `empresas.cnpj`

### Empresa (`domains/models/empresa.py`)
- `cnpj` — String, primary key
- `razao_social` — String, not null
- `endereco` — String, not null
- `limite_hora` — Integer, not null (working hour limit per day)
- `status` — Boolean, default True

### BatidaPonto (`domains/models/batida_ponto.py`)
- `id` — String, primary key, UUID generated
- `colaborador_id` — String, FK to `colaboradores.cpf`, not null
- `geo` — String, nullable
- `batida` — DateTime, defaults to `datetime.utcnow`

## Relationships
- `Colaborador` has many `BatidaPonto` (back_populates `colaborador`)
- `Empresa` has many `Colaborador` (back_populates `empresa`)

## Status
- implemented

## Notes
- No manager flag on `Colaborador` — the Manager/Collaborator distinction (RF02, BR03) is intended to be a single boolean field (e.g. `gerente`) on `Colaborador`, **not** a separate entity. This field does not exist yet.
- No dedicated PunchProfile entity — `limite_hora` on `Empresa` is the only working-hour limit currently modeled

## Evidence
- `domains/models/colaborador.py`
- `domains/models/empresa.py`
- `domains/models/batida_ponto.py`

---

# 18. Repositories and Persistence

## Existing Repositories

### ColaboradorRepository (`infra/repositories/colaborador_repository.py`)
- `criar(colaborador)` — add, commit, refresh
- `buscar_por_cpf(cpf)` — query by primary key
- `buscar_por_login(login)` — query by login
- `listar()` — return all collaborators
- `atualizar(colaborador)` — commit and refresh
- `deletar(colaborador)` — sets `status = False`, commits (soft delete)

### BatidaPontoRepository (`infra/repositories/batida_ponto_repository.py`)
- `salvar(batida)` — add, commit, refresh
- No query methods exist

## Database Models / ORM Mappings
- SQLAlchemy ORM models live in `domains/models/` (not in `infra/`)
- SQLite database at `./database.db`
- Schema created at startup via `Base.metadata.create_all(bind=engine)` in `main.py`
- `Base` declared in `infra/db/base.py`; engine and session factory in `infra/db/database.py`

## Relevant Persistence Rules
- Collaborator deletion is soft (sets `status = False`)
- `BatidaPontoRepository` has no query methods — punch history retrieval is not yet possible

## Status
- partially implemented

## Evidence
- `infra/repositories/colaborador_repository.py`
- `infra/repositories/batida_ponto_repository.py`
- `infra/db/database.py`
- `infra/db/base.py`
- `main.py`

---

# 19. Existing Use Cases
> List only use cases that actually exist in the codebase.

## Use Cases

| Use case | File | Status |
|---|---|---|
| RegistrarColaboradorUseCase | `application/use_cases/colaborador/registrar_colaborador_usecase.py` | Implemented |
| LoginColaboradorUseCase | `application/use_cases/colaborador/login_colaborador_usecase.py` | Partially implemented (no JWT) |
| GetColaboradorUseCase | `application/use_cases/colaborador/get_colaborador_usecase.py` | Missing (file is empty) |
| EdicaoColaboradorUseCase | `application/use_cases/colaborador/edicao_colaborador_usecase.py` | Missing (file is empty) |
| CadastroEmpresaUseCase | `application/use_cases/empresa/cadastro_empresa_usecase.py` | Missing (file is empty) |
| EdicaoEmpresaUseCase | `application/use_cases/empresa/edicao_empresa_usecase.py` | Missing (file is empty) |
| GetEmpresaUseCase | `application/use_cases/empresa/get_empresa_usecase.py` | Missing (file is empty) |
| BaterPontoUseCase | `application/use_cases/ponto/batida_ponto_usecase.py` | Partially implemented |
| BatidaPontoEmbarcadoUseCase | `application/use_cases/ponto/batida_ponto_embarcado_usecase.py` | Partially implemented |
| CadastrarBiometriaUseCase | `application/use_cases/ponto/cadastrar_biometria_usecase.py` | Implemented |
| GetPontoUseCase | `application/use_cases/ponto/get_ponto_usecase.py` | Missing (file is empty) |

## Evidence
- confirmed by reading each file directly on 2026-06-22

---

# 20. Existing Controllers / Endpoints
> Document real controllers and endpoints already present.

## Controllers

### `colaborador_controller.py` — prefix `/colaborador/registro`, tag `Colaborador`
- `POST /colaborador/registro/` — register a new collaborator (JSON body)
- `POST /colaborador/registro/cadastrar-biometria` — register facial embedding for an existing collaborator (multipart: login + image)

### `login_controller.py` — prefix `/auth`, tag `Auth`
- `POST /auth/login` — authenticate by login/password; returns raw Colaborador object (no JWT)

### `batida_ponto_controller.py` — prefix `/ponto`, tag `Ponto`
- `POST /ponto/` — register a punch with known login (multipart: login + geo + image)
- `POST /ponto/embarcado` — register a punch by blind facial recognition (multipart: image + geo)

### `empresa_controller.py`
- Empty file — no routes defined

### `relatorio_controller.py`
- Empty file — no routes defined

## Status
- partially implemented

## Notes
- Only `colaboradorRouter`, `loginRouter`, `pontoRouter` are registered in `main.py`
- `empresa_controller.py` and `relatorio_controller.py` are not mounted

## Evidence
- `presentation/controller/colaborador_controller.py`
- `presentation/controller/login_controller.py`
- `presentation/controller/batida_ponto_controller.py`
- `presentation/controller/empresa_controller.py`
- `presentation/controller/relatorio_controller.py`
- `main.py`

---

# 21. Facial Recognition Design
> Keep this section aligned with the **current implementation**, not the ideal one.

## Current Implementation Notes

### Embedding extraction
- `FacialService.gerar_embedding(image_bytes)` decodes the image with OpenCV, passes it to `DeepFace.represent()` using the **ArcFace** model with `enforce_detection=False`
- Returns `result[0]["embedding"]` as a list of floats
- Raises `ValueError` if the image is invalid or no result is returned

### Embedding storage
- Stored as a JSON column (`facial`) on the `Colaborador` model
- Single embedding vector per collaborator — no history or multiple embeddings

### Comparison
- `FacialService.calcular_similaridade(e1, e2)` computes **cosine distance** via `scipy.spatial.distance.cosine`, returns `1 - distance`
- `FacialService.validar_rosto(e1, e2, limiar=0.6)` returns `True` if similarity >= limiar

### Thresholds in use
- A single canonical constant `LIMIAR_RECONHECIMENTO = 0.65` (BR01) is defined in `application/services/facial_service.py` (RECOG-1)
- `BaterPontoUseCase` calls `validar_rosto()` with no threshold, inheriting the `0.65` default
- `BatidaPontoEmbarcadoUseCase` imports the constant and rejects similarity `< 0.65`
- BR01 (`0.65`) is now met by both flows

### Service location
- `application/services/facial_service.py` — `FacialService` class
- DeepFace is an external dependency; the service should live in `infra/` per clean architecture intent

## Status
- partially implemented (core service works; thresholds aligned to BR01 = 0.65 via `LIMIAR_RECONHECIMENTO` — RECOG-1; service is still in the wrong layer — ARCH-1)

## Evidence
- `application/services/facial_service.py`
- `application/use_cases/ponto/batida_ponto_usecase.py`
- `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`

---

# 22. Authentication / JWT Design
> Reflect only what is already implemented.

## Current Implementation Notes
- `POST /auth/login` validates login and password using bcrypt via `LoginColaboradorUseCase`
- On success, returns the full `Colaborador` SQLAlchemy ORM object — including the hashed password field
- No JWT token is generated anywhere in the codebase
- No token service, no authentication middleware, no protected routes
- No role-based access control is enforced anywhere

## Status
- **missing** (only password validation exists; no token, no protected endpoints, no role enforcement)

## Evidence
- `presentation/controller/login_controller.py`
- `application/use_cases/colaborador/login_colaborador_usecase.py`
- no JWT-related file exists in the project

---

# 23. Rules Already Implemented
> Document business rules that are already present in code, even if they originated from the baseline requirements.

## Rules

### Collaborator CPF uniqueness
- Enforced in `RegistrarColaboradorUseCase`: raises HTTP 409 if CPF already exists
- Evidence: `application/use_cases/colaborador/registrar_colaborador_usecase.py`

### Collaborator login uniqueness
- Enforced in `RegistrarColaboradorUseCase`: raises HTTP 409 if login already exists
- Evidence: `application/use_cases/colaborador/registrar_colaborador_usecase.py`

### Password hashing (NFR04)
- Implemented via `HashService` using bcrypt (`passlib`)
- Applied at registration and verified at login
- Evidence: `application/services/hash_service.py`, `application/use_cases/colaborador/registrar_colaborador_usecase.py`

### Collaborator active status check at login
- `LoginColaboradorUseCase` raises HTTP 403 if `colaborador.status == False`
- Evidence: `application/use_cases/colaborador/login_colaborador_usecase.py`

### Collaborator active status check at punch (login-based)
- `BaterPontoUseCase` raises HTTP 403 if `colaborador.status == False`
- Evidence: `application/use_cases/ponto/batida_ponto_usecase.py`

### Collaborator must have stored embedding before punch (login-based)
- `BaterPontoUseCase` raises HTTP 400 if `len(colaborador.facial) < 128`
- Evidence: `application/use_cases/ponto/batida_ponto_usecase.py`

### Face validation before punch (login-based)
- `BaterPontoUseCase` raises HTTP 401 if `validar_rosto()` returns False (threshold 0.65, BR01 — RECOG-1)
- Evidence: `application/use_cases/ponto/batida_ponto_usecase.py`

### Blind recognition threshold (embarcado)
- `BatidaPontoEmbarcadoUseCase` raises HTTP 401 if best similarity < 0.65 (BR01 — RECOG-1)
- Evidence: `application/use_cases/ponto/batida_ponto_embarcado_usecase.py`

### Minimum recognition threshold (BR01)
- Both punch flows enforce a 0.65 minimum via the single `LIMIAR_RECONHECIMENTO` constant
- Evidence: `application/services/facial_service.py`

## Rules NOT yet implemented
- **BR02**: 5-minute interval between punches — not implemented anywhere
- **BR03**: manager-only access for reports and editing — no role field, no middleware
- **BR04 / BR05**: overtime calculation and flagging — not implemented
- **BR06**: company-scoped attendance visibility — not enforced

## Status
- partially implemented

---

# 24. Known Gaps / Missing Parts

## Missing
- JWT token generation and validation — no code exists
- Protected endpoints — no authentication middleware anywhere
- ~~Manager boolean flag (e.g. `gerente`) on `Colaborador`~~ — implemented: persisted column, surfaced in JWT claims (login + registration) and `ColaboradorResponse`; controlled promotion via the manager-gated `PUT /colaborador/{cpf}` (AUTHZ-1 done). Open follow-on: no API path mints the first manager (bootstrap) — resolve via seed/CLI.
- Role-based access control (BR03) — `require_manager` enforces it by reading the `gerente` JWT claim (fail-closed; no DB re-query) (AUTHZ-2 done). Accepted trade-off: role staleness bounded by token expiry (≤ `JWT_EXPIRY_MINUTES`).
- Empresa CRUD endpoints — `empresa_controller.py` is empty, all empresa use cases are empty
- Reporting endpoints — `relatorio_controller.py` is empty, `GetPontoUseCase` is empty
- Collaborator query and editing endpoints — `GetColaboradorUseCase` and `EdicaoColaboradorUseCase` are empty
- RF13: biometrics registered on first punch (must be registered separately before punching)
- Punch type classification (entry / exit)
- Worked hours and overtime calculation (RF11, BR04, BR05)
- 5-minute duplicate punch prevention (BR02)
- `empresa_controller.py` and `relatorio_controller.py` are not registered in `main.py`

## Partial / Fragile Areas
- Login endpoint returns the raw SQLAlchemy `Colaborador` object including the hashed password — no output DTO, no field filtering
- `BatidaPontoEmbarcadoUseCase` threshold (0.4) is well below the BR01 requirement of 0.65
- `BaterPontoUseCase` threshold (0.6) also does not meet BR01 (0.65)
- `FacialService` is in `application/services/` instead of `infra/` — DeepFace is an external dependency

## Technical Debt
- `HTTPException` is raised inside use cases (`registrar_colaborador_usecase.py`, `login_colaborador_usecase.py`, `batida_ponto_usecase.py`, `batida_ponto_embarcado_usecase.py`, `cadastrar_biometria_usecase.py`) — HTTP concerns inside business logic violate clean architecture
- No domain exceptions defined — `domains/` contains only ORM models
- No output schemas / DTOs — controllers return ORM objects directly or raw dicts
- No repository interfaces / contracts in the domain layer — use cases depend directly on concrete repository classes

---

# 25. Open Decisions
Document decisions that are not yet finalized.

## Open Decisions
- **[RESOLVED 2026-06-22]** Biometric enrollment flow: **dedicated enrollment endpoint is the official MVP path**. RF13 (enroll on first punch) is explicitly out of scope for the current delivery and tracked as a future enhancement. The punch flow must assume the collaborator is already enrolled; a missing biometric must fail with a validation error, not auto-enroll.
- Whether multiple embeddings per collaborator will be supported (currently only one stored)
- Whether the login-based punch (`POST /ponto/`) or the blind embarcado punch (`POST /ponto/embarcado`) is the intended primary flow — both exist with different thresholds
- Final recognition threshold strategy — BR01 says 0.65 but current code uses 0.4 and 0.6
- Whether login via password will coexist with facial login, or password login is only for managers
- Punch type (entry/exit) classification strategy — no model for it yet
- Where `FacialService` should live — currently in `application/services/`, architecture intends it in `infra/`

---

# 26. Implementation Status Summary

The up-to-date implementation status (implemented, partially implemented, missing) is maintained in **`TASKS.md` §3 — Current Project Completion Snapshot**.

Update `TASKS.md §3` whenever implementation state changes. Do not maintain a parallel summary here.

---

# 27. Progress Log

## Done
- [x] Initial consolidated `PROJECT_CONTEXT.md` created
- [x] Codebase reviewed and implementation sections updated (2026-06-22)

## In Progress
- [ ] Implement JWT token generation and protected endpoints
- [ ] Align recognition thresholds with BR01 (0.65)
- [ ] Implement BR02 (5-minute punch interval)
- [ ] Implement Empresa CRUD

## Next
- [ ] Add manager boolean flag (e.g. `gerente`) to `Colaborador` and implement BR03
- [ ] Implement punch type classification (entry/exit)
- [ ] Implement worked hours calculation (RF11)
- [ ] Implement reporting endpoints (RF10, RF12)
- [ ] Create output DTOs / response schemas
- [ ] Define domain exceptions and repository interfaces
- [ ] Move `FacialService` to infra layer
- [ ] ~~Implement RF13 (biometrics on first punch)~~ — deferred; out of MVP scope