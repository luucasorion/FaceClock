// Best-effort geolocation for the punch flows (FE-PUNCH-1 / FE-PUNCH-2).
//
// Tries navigator.geolocation.getCurrentPosition. If a position is obtained,
// returns a "<lat>,<lng>" string; on denial, timeout, or unsupported browser,
// resolves to "". The flow is NEVER blocked on geolocation — this always
// resolves (it never rejects) and is bounded by a short timeout.

const GEO_TIMEOUT_MS = 2500;

export function acquireGeo() {
  return new Promise((resolve) => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== 'function'
    ) {
      resolve('');
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          finish(`${latitude},${longitude}`);
        },
        () => finish(''),
        { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 60000 },
      );
    } catch {
      finish('');
    }

    // Safety net: never let the flow hang on geolocation.
    setTimeout(() => finish(''), GEO_TIMEOUT_MS + 250);
  });
}
