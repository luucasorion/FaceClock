# Fonts (Valtech Design System)

FaceClock's brand type is **Valtech Neue** (display/headings) and **Sons**
(body/UI). These are **licensed Valtech fonts and are intentionally not
committed** to this repository.

To render the intended type, drop the licensed OTF files into this folder with
exactly these names (referenced by the `@font-face` block in
`frontend/src/styles/base.css`):

```
ValtechNeue-Light.otf    (weight 300 — headings)
ValtechNeue-Book.otf     (weight 400)
ValtechNeue-Bold.otf     (weight 700)
Sons-Light.otf           (weight 300)
Sons-Regular.otf         (weight 400 — body)
Sons-Semibold.otf        (weight 600)
```

Until the files are present, the app falls back to
`"Helvetica Neue", Arial, sans-serif` (the same fallback the design prototype
uses). Do **not** substitute Google fonts — see the redesign handoff
(`docs/design/frontend-redesign/README.md`).

Source: the Valtech Design System bundle (`colors_and_type.css` + `fonts/*.otf`).
