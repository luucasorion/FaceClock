# Brand assets (Valtech Design System)

Static brand imagery used by the FaceClock frontend.

| File | Use |
|---|---|
| `asterisk-black.png` / `asterisk-white.png` | Valtech asterisk glyph — kiosk & banner corner. Use only in black/white/signal-red; never rotate or stretch. |
| `prism1.jpg` / `prism3.jpg` / `prism5.jpg` | Prismatic photography — faint background on kiosk/banner only (~0.16 opacity). |

## Brand mark (source of truth)

The FaceClock ring mark lives as vector source in two places:

- **`../brand-mark.svg`** — black ring mark, used as the browser favicon.
- **`../app-icon.svg`** — ring mark reversed on a black square, the app/PWA icon.
- **`../../src/components/BrandMark.jsx`** — the React component (`RingMark` +
  horizontal lockup) used in-app; recolours via `currentColor`.

### Regenerating the raster PWA icons

`favicon.png`, `apple-touch-icon.png`, and `pwa-*.png` in `public/` are the
pre-rebrand rasters kept as fallbacks. Regenerate them from `app-icon.svg`
when a rasteriser is available, e.g.:

```bash
# ImageMagick
magick -background none app-icon.svg -resize 192x192 pwa-192x192.png
magick -background none app-icon.svg -resize 512x512 pwa-512x512.png
magick -background none app-icon.svg -resize 180x180 apple-touch-icon.png
magick -background none brand-mark.svg -resize 48x48 favicon.png
```
