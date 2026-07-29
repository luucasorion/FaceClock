# ADR 0010 — Rebrand the frontend to the Valtech Design System

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** lucas.orion

## Context

The FaceClock frontend (`frontend/`, React + Vite + MUI SPA) currently ships the
default-ish MUI look: a blue primary (`#2563eb`), 12px rounded corners, elevation
shadows, and system fonts, with tokens duplicated across `src/theme.js` and
`src/styles/base.css`. The flows, routes, guards, `CameraCapture` (NFR05), and API
layer are complete and stable.

A design handoff (`docs/design/frontend-redesign/`) specifies a full visual restyle to
the **Valtech Design System**: 95% monochrome (black / white / bone `#F3F2EF` / stone
`#D1D3CA` / graphite `#4C4C49`, **no blue**), sharp corners (radius 0; 2px inputs; 999px
kiosk/chip pills), flat surfaces on 1px hairline borders (no elevation), Valtech Neue
(weight 300) headings + Sons body, and a prismatic "spectrum" gradient reserved for two
hero moments (the 3px app-bar band and the punch/kiosk success ring). Interface language
stays Portuguese (pt-BR).

## Decision

Adopt the Valtech Design System as the frontend's visual language, as a **pure restyle**.

- **Restyle only** — no changes to routes (`App.jsx`), auth guards, navigation, the
  `CameraCapture` capture flow / NFR05 teardown, the punch/kiosk phase machines, or the
  API layer. Same screens, new skin.
- **Tokens are the single source of truth** — the Valtech palette/shape/typography live in
  `src/theme.js` mirrored by `src/styles/base.css`; MUI component *defaults* (button, card,
  input, chip) are overridden centrally in the theme so pages inherit the brand rather than
  carrying per-`sx` overrides.
- **Fonts ship as OTF via `@font-face`** (Valtech Neue, Sons). **No Google-font substitution.**
- **Spectrum is rationed** — the gradient appears only as the app-bar band and the success
  rings; everything else stays monochrome. Status colors (entrada teal, saída signal-red,
  active lime, overtime orange) are presentational only.

## Consequences

- **Positive:** one canonical token set drives the whole UI; the brand aligns with Valtech;
  the blue/rounded/elevated MUI default is retired in one place. No behavioral risk — flows
  are untouched.
- **Negative / cost:** real restyle work across every screen, tracked as issues
  FE-REBRAND-1..11 under epic #28. The token change (#17) is a hard prerequisite for the rest.
- **Dependency:** the Valtech Neue / Sons OTF files are **not** in the handoff bundle and must
  be sourced from the Valtech DS before #17 can complete.
- **Compatibility:** this governs the *frontend* visual layer only; it does not touch the
  backend clean-architecture layering (ADR 0002) or any other decision.

## Related

- Design handoff: `docs/design/frontend-redesign/` (README + `FaceClock Redesign.dc.html` + assets)
- Epic: [#28 FE-REBRAND-0](https://github.com/luucasorion/FaceClock/issues/28); children [#17](https://github.com/luucasorion/FaceClock/issues/17)–[#27](https://github.com/luucasorion/FaceClock/issues/27)
- Precedent for adopting an external convention set: ADR 0001
