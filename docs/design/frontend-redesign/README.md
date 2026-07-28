# Handoff: FaceClock Frontend Redesign (Valtech Design System)

## Overview
A full visual restyle of the **FaceClock** facial-recognition time-clock frontend
(React + Vite + MUI SPA in `frontend/`), plus a new product logo and a GitHub
repository banner. Flows, routes, and layout are unchanged — this is a **pure
restyle**: same screens, new skin, applying the **Valtech Design System**.

Interface language stays **Portuguese (pt-BR)**. Primary framing is **mobile
phone** for collaborator flows; the kiosk is a full-bleed tablet/totem.

## About the Design Files
The files in this bundle are **design references created in HTML** — a single
pannable canvas prototype showing the intended look, not production code to copy
verbatim. The task is to **recreate these designs in the existing FaceClock
frontend** (React + MUI, `frontend/src/`) using its established patterns: keep
the routes in `App.jsx`, the `AppLayout` shell, the page components, the
`CameraCapture` component, and the API layer exactly as they are — only restyle.

Recommended approach: replace the MUI theme tokens (`frontend/src/theme.js`) and
base CSS (`frontend/src/styles/base.css`) with the Valtech tokens below, then
adjust each page's presentation to match. The Valtech look is **not** the MUI
default (no rounded cards, no elevation, no blue) — you will need to override
MUI component defaults (see "MUI mapping" per screen).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and component
structure. Recreate pixel-close using MUI + custom `sx`/CSS. Exact hex, font,
and spacing values are listed under Design Tokens.

## Design Language (the 6 rules that define the look)
1. **95% monochrome** — black `#000`, white `#fff`, warm bone `#F3F2EF`,
   stone `#D1D3CA`, graphite `#4C4C49`. No blue anywhere.
2. **Sharp corners** — border-radius `0` on cards/buttons/surfaces; `2px` only
   on text inputs; `999px` pills only for the kiosk CTA and filter chips.
3. **Flat** — surfaces rest on **1px hairline borders** (`#D1D3CA`), not
   shadows. Remove MUI `elevation`/`boxShadow` on cards. (Device mockups in the
   prototype have shadows — those are the phone bezels, not the UI.)
4. **Type** — headings in **Valtech Neue**, weight **300** (never bold),
   `letter-spacing:-0.015em`, `line-height:0.95–1.1`. Body in **Sons**,
   14–16px, `line-height:1.5`.
5. **Spectrum = hero moments only** — the prismatic gradient (`--val-spectrum`)
   appears ONLY as: the 3px band under the top app bar, and the success ring on
   punch/kiosk confirmation. Everything else stays monochrome.
6. **Buttons** — primary = solid black fill, white text, **no radius**; hover
   inverts to signal-red `#FF5959` fill. Secondary = white fill, 1px black
   border; hover inverts to black fill/white text. Tertiary = underlined text
   link, hover → signal-red.

## Design Tokens

### Colors
```
--val-black:      #000000   /* ink, primary buttons, app bar, kiosk bg */
--val-white:      #FFFFFF   /* surfaces, cards */
--val-bone:       #F3F2EF   /* page background */
--val-stone:      #D1D3CA   /* hairline borders, dividers */
--val-graphite:   #4C4C49   /* secondary/muted text */
--val-signal-red: #FF5959   /* signal: hover, "saída" accent, urgent */
--val-teal:       #36A7A0   /* "entrada" accent (spectrum member) */
--val-lime:       #B3FF60   /* active status chip fill */
--val-orange:     #FF9E46   /* overtime chip fill */
--val-spectrum:   linear-gradient(90deg,#002FA7 0%,#0554A8 15%,#36A7A0 32%,#B2FF60 50%,#DEF25F 62%,#FF9E46 78%,#FF5959 90%,#D84265 100%)
text on dark muted: #cfd1c8
subtle text:        #7a7a78
inner divider:      #EAE9E5
```

### Typography
```
Display/headings: "Valtech Neue", weight 300, letter-spacing -0.015em, line-height 0.95–1.1
Body/UI:          "Sons", weights 300/400/600, line-height 1.5
Eyebrow/label:    "Sons", 11px, UPPERCASE, letter-spacing 0.08em, weight 500, color #4C4C49
Numbers (times/hours): font-variant-numeric: tabular-nums
```
Fonts ship as OTF and are declared via `@font-face` in the design system's
`colors_and_type.css` (families: `ValtechNeue-Light/Book/Bold`, `Sons-Light/
Regular/Semibold`). Copy the OTF files + the `@font-face` block into the app and
set `--font-display` / `--font-body` accordingly. **Do not** substitute Google
fonts.

### Type scale used in mockups (mobile)
```
Screen title (h1):     24–34px Valtech Neue 300
Section header (h2):   18–19px Valtech Neue 300
Body:                  14–15px Sons
Small/meta:            11–13px Sons, color #4C4C49
Kiosk clock:           clamp(56px,9vw,104px) Valtech Neue 300, tabular-nums
Kiosk headline:        clamp(36px,6vw,60px) Valtech Neue 300
```

### Spacing (4pt grid)
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Card padding 18–22px. Screen gutters
20–26px. Button padding 14–16px vertical.

### Radius / border / shadow
```
radius: 0 (default), 2px (inputs), 999px (kiosk CTA + chips)
border: 1px solid #D1D3CA (hairline); 1px solid #000 on focused input / secondary button
shadow: none on UI surfaces
```

## Screens / Views
All authenticated screens share a **top app bar**: black background, brand
lockup left (ring mark + "FaceClock" in Valtech Neue), hamburger/actions right,
and a **3px spectrum band** as the bottom edge of the bar.

Status accents on punch records: **Entrada → 3px left border `#36A7A0` (teal)**,
**Saída → 3px left border `#FF5959` (signal-red)**.

### 1. Menu (`/`, MenuPage.jsx) — public entry
- **Layout**: centered column. Top-spaced brand block (ring mark 60px + wordmark
  34px + subtitle), bottom stack of 4 full-width buttons (thumb zone).
- **Copy**: title "FaceClock", subtitle "Controle de ponto por reconhecimento
  facial". Buttons: "Bater ponto (totem)" (primary/black), "Entrar" (secondary/
  outline black), "Cadastrar colaborador" and "Cadastrar empresa" (outline
  stone `#D1D3CA` border).
- **MUI mapping**: `Button variant="contained"` → override to black fill, radius
  0, no shadow; the outline ones → `variant="outlined"`.

### 2. Login (`/login`, LoginPage.jsx)
- **Layout**: centered header ("Entrar" / "Acesse sua conta FaceClock"), then a
  flat white card (1px `#D1D3CA`) containing: Login field (focused state = 1px
  black border), Senha field (masked), primary black "Entrar" button, tertiary
  underlined "Criar conta de colaborador".
- **MUI**: `Card` with `variant="outlined"`, no elevation. `TextField` → square
  (2px radius), label as small eyebrow above field.

### 3. Punch Home — idle (`/home`, PunchHomePage.jsx)
- **Layout**: app bar; header row "Olá, {nome}" (h1) + "Bater ponto" subtitle,
  with a 42px square outlined profile icon button top-right; full-width black
  "Bater ponto" button; "Hoje" section header (h2) + right-aligned "{n}
  registros"; list of punch cards.
- **Punch card**: white, 1px `#D1D3CA`, 3px left accent (teal entrada / red
  saída), row = tipo label (Sons 600) + time (tabular-nums, graphite).

### 4. Punch Home — capturing (CameraCapture.jsx state)
- Full-width camera stage (`aspect-ratio:3/4`, black bg), centered **dashed oval
  face-guide** (`border:3px dashed rgba(255,255,255,.9)`, `border-radius:50%`,
  `box-shadow:0 0 0 999px rgba(0,0,0,.35)` scrim), bottom hint "Olhe para a
  câmera…" (white, 600, text-shadow). Full-width black "Capturar e bater ponto".
- Keep existing `CameraCapture` logic; only restyle the guide/hint/button.

### 5. Punch Home — success (PunchResult.jsx)
- Centered: **success ring** = 112px circle filled with `--val-spectrum`,
  inset 92px bone/black circle holding a black/white line check
  (stroke 2, `M4 12.5l5 5L20 6.5`). Headline "Ponto registrado!" (Valtech Neue
  30px), meta "Entrada às 13:00 · {nome}" (graphite). Secondary "Fechar" button.
- This spectrum ring is the ONE hero moment on the collaborator flow.

### 6. Profile + history (`/perfil`, ProfilePage.jsx)
- App bar; header "Meu perfil" + "Voltar" (outline button). Read-only profile
  card (Nome, Login — label = eyebrow, value = Sons 15px, divider `#EAE9E5`
  between). "Histórico de pontos" (h2) + date-range row (Início / Fim square
  fields + black "Buscar" button). Results = flat outlined table (Tipo / Data-
  hora), pagination row below.

### 7. Manager — Employees (`/gerente/colaboradores`, ManagerEmployeesPage.jsx)
- App bar (manager nav); "Meus colaboradores" (h1) + "Toque para abrir a ficha."
- **Table**: 1px `#D1D3CA` outer border; **black header row** with white eyebrow
  labels (Nome / Status); body rows separated by `#EAE9E5`. Each row: nome (Sons
  600) + login (11px graphite), status chip. **Status chip**: Ativo = `#B3FF60`
  fill / black text; Inativo = white fill / 1px stone border / graphite text.
  All chips square (radius 0), 3px 9px padding.
- The real page uses MUI `DataGrid`; restyle its header (black bg) and cells, or
  keep DataGrid and theme it. Row click → employee file (unchanged).

### 8. Manager — Report (`/gerente/relatorio`, ManagerReportPage.jsx)
- App bar; "Relatório da empresa" (h1) + subtitle. Filter card (outlined): Início
  / Fim date fields + black "Gerar" button (mockup also implies "Exportar CSV").
- **Results table**: black header row (Colaborador / Horas / Extra), body rows
  with tabular-nums figures. Overtime figure rendered as an **orange chip**
  (`#FF9E46` fill, black text, square) when a day exceeded the limit; otherwise
  plain "0h 00m". Minutes format `Hh MMm`.

### 9. Enroll (`/enroll`, EnrollPage.jsx)
- Same camera stage + oval guide as screen 4, with enroll copy. Reuse
  `CameraCapture`.

### 10. Register colaborador / empresa (Registro*.jsx)
- Same card + field pattern as Login: outlined white card, square fields, black
  primary "Cadastrar" button.

### 11. Kiosk / Totem — idle (`/kiosk`, KioskPage.jsx) — full-bleed, public
- **Layout**: full-screen black stage, centered column. Brand lockup (ring mark
  34px + wordmark 26px). Large **live clock** `HH:MM` (clamp(56–104px), Valtech
  Neue 300, tabular-nums). Date line below (Sons, `#cfd1c8`, sentence case —
  "terça-feira, 28 de julho de 2026", NOT capitalized). Large **pill CTA**
  ("Bater ponto", white fill / black text, radius 999px, with a line clock
  icon). Top edge = 5px spectrum band. Faint prismatic photo bg at ~0.16 opacity.
  Valtech asterisk bottom-right at ~0.85 opacity, ~26px.
- Keep existing kiosk phase machine (idle→capturing→recognizing→result) and the
  3-2-1 auto-capture countdown; only restyle.

### 12. Kiosk — success
- Black stage; large **spectrum success ring** (132px, inset 108px black circle
  + white line check 58px). Headline "Ponto registrado!" (clamp 36–60px).
  "Bem-vindo(a), {nome} · {HH:MM}" in `#cfd1c8`. Auto-reset line "Voltando em
  {n}…" (`#7a7a78`). White pill "Próxima pessoa".

## Responsive behavior (desktop sizes)
The prototype includes desktop mockups (canvas turn 2: `#2a`–`#2d`) that mirror
the existing `AppLayout` responsive rules — no new breakpoints:
- **Top app bar becomes horizontal** on desktop: brand lockup left; inline nav
  right (Funcionários / Relatório / Perfil / Sair — current item in white,
  others `#cfd1c8`); 3px spectrum band still the bar's bottom edge. On mobile
  this same nav collapses to the hamburger `Menu` (unchanged).
- **Manager screens use the wide (`lg`) Container** — Employees (`#2a`) and
  Report (`#2b`) render full-width tables with a black header row and hairline-
  separated body rows. Page bg `#F3F2EF`, content padding ~32px 40px. Employees
  columns: Nome / Login / CPF / Status / Gerente (gerente boolean = black line
  check or "—"). Report columns: Colaborador / Horas trabalhadas / Hora extra /
  Excedeu limite (overtime = orange `#FF9E46` "Sim" chip, else plain "Não").
  Keep MUI `DataGrid` (Employees) / `Table` (Report) — just theme header/cells.
- **Collaborator & auth screens keep the narrow (`sm`) centered column** on
  desktop — Punch Home (`#2c`) and Login (`#2d`) sit in a ~600px / ~360px
  centered column on the bone page, not stretched full-width.
- Everything else (spacing, tokens, type, status accents) is identical to the
  mobile spec — desktop only changes container width and the nav orientation.

## Interactions & Behavior
- **No flow/logic changes.** All endpoints, guards (`RequireAuth`/
  `RequireManager`), navigation, and the `CameraCapture` NFR05 teardown stay as
  in the current codebase.
- **Hover**: primary button → fill `#FF5959`; secondary → invert to black; links
  → `#FF5959`, underline thickens. Press: `scale(0.98)`.
- **Motion**: `cubic-bezier(0.2,0,0,1)`, 150–240ms. Enter = fade + 8–16px
  translate. No bounce/spring/parallax.
- **Status colors** are presentational only (entrada teal / saída red / active
  lime / overtime orange).

## State Management
No new state. Preserve existing per-page state: punch phase machine
(idle/capturing/submitting/result), kiosk phase + auto-reset countdown + live
clock, report/history date filters + fetch results + pagination, profile
load/save. Nothing to add.

## Assets
- **Logo (new, in this handoff)** — three directions delivered as inline SVG in
  the prototype (`FaceClock Redesign.dc.html`):
  - **1a Ring lockup (recommended primary)** — 8-spoke asterisk inside a clock
    ring with center dot; ring viewBox `0 0 48 48`, `circle r=21` +
    8 spokes + `circle r=3` fill, `stroke-width` 2 (scale up at small sizes).
    Pair horizontally with "FaceClock" wordmark. Reproduce as an SVG asset/React
    component; ships in black and white (currentColor).
  - **1b Face-oval stacked** — upright ellipse (face guide) with clock hands +
    ticks; stacked over wordmark. Alternative.
  - **1c App icon / favicon** — ring mark in a black square (sharp) and iOS
    rounded tile with a spectrum aro; plus "F✳" monogram.
  - Exact SVG path data is in `FaceClock Redesign.dc.html` — copy from there.
- **GitHub banner** — 1280×640, black, prismatic photo on the right with a
  left-to-black protection gradient, ring lockup + headline "Ponto de trabalho
  vinculado à identidade." + tech chips, 6px spectrum top band, asterisk bottom-
  right. Source markup in the prototype (section `#1d`). Export via screenshot
  of that node at 1280×640.
- **Prismatic photography** — from the Valtech DS (`assets/photos/`). Used only
  as faint background on kiosk/banner. Files in bundle: `prism1/3/5.jpg`.
- **Valtech asterisk** — `asterisk-black.png` / `asterisk-white.png` (brand
  glyph; use only in black/white/signal-red, never rotated/stretched).
- **Icons** — line icons, single weight ~1.5–2px, `currentColor`, no fills.
  Substitute **Lucide** (stroke-width 1.5) where the app needs more icons
  (profile, menu, clock, check).

## Files
- `FaceClock Redesign.dc.html` — the design reference (pannable canvas):
  desktop screens `#2a`–`#2d`, intro, logos `#1a`/`#1b`/`#1c`, banner `#1d`,
  mobile screens `#1e`.
  Contains all exact SVG path data, colors, and markup to copy from.
- `assets/` — `prism1.jpg`, `prism3.jpg`, `prism5.jpg`, `asterisk-black.png`,
  `asterisk-white.png`.
- Design tokens + fonts: the Valtech design system's `colors_and_type.css` and
  `fonts/*.otf` (copy the `@font-face` block and OTF files into the app).

## Target codebase touch-points (for the implementer)
```
frontend/src/theme.js            → replace MUI palette/shape/typography with Valtech tokens
frontend/src/styles/base.css     → replace CSS variables; add @font-face
frontend/src/components/AppLayout.jsx     → black app bar + spectrum band + brand mark
frontend/src/components/ui.css            → restyle Spinner/EmptyState/ErrorBanner/Toast
frontend/src/components/CameraCapture.css → oval guide/hint already close; keep
frontend/src/components/PunchResult.*     → spectrum success ring
frontend/src/pages/*                      → per-screen restyle above (no logic change)
```
```
```
