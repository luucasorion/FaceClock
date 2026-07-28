// FE-REBRAND-3 (#19): FaceClock brand mark — the "ring lockup" (direction 1a).
// The 8-spoke Valtech asterisk reads as clock hands inside a ring that also
// reads as the camera's oval face-guide: one glyph uniting product + brand.
// Exact geometry copied from the design prototype
// (docs/design/frontend-redesign/FaceClock Redesign.dc.html, §1a).
//
// Monochrome via `currentColor` — set the colour on the parent (black on
// light surfaces, white on the black app bar / kiosk).

/**
 * The ring mark on its own (viewBox 0 0 48 48).
 * @param {{ size?: number, strokeWidth?: number, title?: string }} props
 */
export function RingMark({ size = 32, strokeWidth = 2, title, ...rest }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth={strokeWidth} />
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="24" y1="18" x2="24" y2="7" />
        <line x1="24" y1="30" x2="24" y2="41" />
        <line x1="30" y1="24" x2="41" y2="24" />
        <line x1="18" y1="24" x2="7" y2="24" />
        <line x1="28.2" y1="19.8" x2="36" y2="12" />
        <line x1="28.2" y1="28.2" x2="36" y2="36" />
        <line x1="19.8" y1="28.2" x2="12" y2="36" />
        <line x1="19.8" y1="19.8" x2="12" y2="12" />
      </g>
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * Horizontal lockup: ring mark + "FaceClock" wordmark (Valtech Neue).
 * Used in the app bar, menu, kiosk and auth headers.
 * @param {{ markSize?: number, wordSize?: number|string, gap?: number, strokeWidth?: number, showWord?: boolean }} props
 */
export default function BrandMark({
  markSize = 32,
  wordSize = 22,
  gap = 10,
  strokeWidth = 2.4,
  showWord = true,
  sx,
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        color: 'inherit',
        lineHeight: 1,
        ...sx,
      }}
    >
      <RingMark size={markSize} strokeWidth={strokeWidth} title="FaceClock" />
      {showWord ? (
        <span
          style={{
            fontFamily: "'Valtech Neue', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
            letterSpacing: '-0.015em',
            fontSize: wordSize,
          }}
        >
          FaceClock
        </span>
      ) : null}
    </span>
  );
}
