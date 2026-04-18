// Shared formatters. Kilometres + min/km throughout — the 1-mile PR is the only imperial exception.

export function metersToKm(m) {
  return m / 1000;
}

export function formatKm(m, digits = 2) {
  return `${metersToKm(m).toFixed(digits)} km`;
}

/** seconds → H:MM:SS or M:SS */
export function formatDuration(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return '—';
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** meters-per-second → seconds-per-km */
export function mpsToSecPerKm(mps) {
  if (!mps || mps <= 0) return null;
  return 1000 / mps;
}

/** seconds-per-km → "M:SS /km" */
export function formatPace(secPerKm) {
  if (secPerKm == null || !Number.isFinite(secPerKm)) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${m}:${pad(s)} /km`;
}

/** Pace as decimal minutes for chart axes (e.g. 5:30 → 5.5). */
export function paceMinutesDecimal(secPerKm) {
  if (secPerKm == null) return null;
  return secPerKm / 60;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Given a sorted list of values, compute trailing rolling average (length=window). */
export function rollingAverage(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1).filter((v) => v != null);
    if (slice.length < window) {
      out.push(null);
    } else {
      const sum = slice.reduce((a, b) => a + b, 0);
      out.push(sum / slice.length);
    }
  }
  return out;
}
