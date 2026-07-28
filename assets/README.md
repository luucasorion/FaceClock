# Repository brand assets

Canonical brand imagery for FaceClock's GitHub presence (Valtech Design System).

| File | Use |
|---|---|
| `logo/faceclock-logo-black.png` / `-white.png` | README header lockup (ring mark + wordmark), light/dark. |
| `github-banner.png` | **Repository social preview** — 1280×640, black with prismatic photo, ring lockup + headline "Ponto de trabalho vinculado à identidade." + tech chips + 6px spectrum band. |

## Setting the social preview

`github-banner.png` must be uploaded manually (GitHub has no API for it):
**Settings → General → Social preview → Edit → Upload an image** →
`assets/github-banner.png`.

The in-app brand mark source of truth (SVG + React component) lives under
`frontend/public/` and `frontend/src/components/BrandMark.jsx`; design tokens and
per-screen specs are in `docs/design/frontend-redesign/`.
