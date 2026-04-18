import { useMemo } from 'react';
import { mpsToSecPerKm } from '../lib/format.js';

function buildVerdict(flags) {
  const has = (t) => flags.some((f) => f.key === t);
  const tooFast = has('too_fast');
  const fade    = has('fade');
  const strong  = has('strong');

  if (tooFast && fade && strong)
    return 'You started fast and faded through the middle, but came back well at the end — classic V-shape. Focus on holding back in km 1.';
  if (tooFast && fade)
    return 'You went out too fast and faded mid-run. Try a more even effort from the gun — your average pace will improve.';
  if (tooFast && strong)
    return 'You went out hard but rallied well to finish faster than average. Watch that first km — consistency will come from there.';
  if (fade && strong)
    return 'You faded mid-run but came back well in the final km. Check your fuelling or pacing strategy around that slow section.';
  if (tooFast)
    return 'You started more than 10% faster than your average pace. Holding back in km 1 usually leads to a stronger overall run.';
  if (fade)
    return 'Your pace dropped significantly mid-run. Consider whether it was heat, effort level, or fuelling — something to track.';
  if (strong)
    return 'Strong negative split — you finished faster than your average. That\'s a sign of good pacing discipline.';
  return 'Even pacing throughout. Nice controlled effort.';
}

export default function PacingVerdict({ splits, averageSpeedMps }) {
  const { flags, verdict } = useMemo(() => {
    if (!splits || splits.length < 2) return { flags: [], verdict: null };

    const avgSec = mpsToSecPerKm(averageSpeedMps);
    if (!avgSec) return { flags: [], verdict: null };

    const paces = splits.map((s) => mpsToSecPerKm(s.average_speed)).filter(Boolean);
    if (paces.length === 0) return { flags: [], verdict: null };

    const km1Pace   = paces[0];
    const lastPace  = paces[paces.length - 1];
    const slowest   = Math.max(...paces);

    const flags = [];

    // km 1 more than 10% faster than avg (lower sec/km = faster)
    if (km1Pace < avgSec * 0.9)
      flags.push({ key: 'too_fast', label: 'Started too fast', tone: 'warn' });

    // slowest km more than 15% slower than avg
    if (slowest > avgSec * 1.15)
      flags.push({ key: 'fade', label: 'Mid-run fade', tone: 'bad' });

    // last km faster than avg
    if (lastPace < avgSec)
      flags.push({ key: 'strong', label: 'Strong finish', tone: 'good' });

    return { flags, verdict: buildVerdict(flags) };
  }, [splits, averageSpeedMps]);

  if (!verdict) return null;

  return (
    <div className="pacing-verdict">
      <div className="verdict-tags">
        {flags.length === 0
          ? <span className="verdict-tag verdict-good">Even pacing</span>
          : flags.map((f) => (
              <span key={f.key} className={`verdict-tag verdict-${f.tone}`}>{f.label}</span>
            ))
        }
      </div>
      <p className="verdict-text">{verdict}</p>
    </div>
  );
}
