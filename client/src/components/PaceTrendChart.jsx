import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { mpsToSecPerKm, paceMinutesDecimal, rollingAverage, formatPace, formatDateShort } from '../lib/format.js';

const ACCENT = '#213FEA';
const ROLLING = '#ff6b35';

export default function PaceTrendChart({ runs }) {
  const data = useMemo(() => {
    // Oldest → newest for a left-to-right timeline
    const sorted = [...runs].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const paces = sorted.map((r) => mpsToSecPerKm(r.average_speed_mps));
    const rolling = rollingAverage(paces, 7);
    return sorted.map((r, i) => ({
      date: r.start_date,
      label: formatDateShort(r.start_date),
      pace: paceMinutesDecimal(paces[i]),     // decimal minutes for axis math
      paceSec: paces[i],                      // sec/km for tooltip
      rolling: paceMinutesDecimal(rolling[i]),
      rollingSec: rolling[i],
    }));
  }, [runs]);

  if (data.length === 0) {
    return <div className="empty-state">No runs in this range.</div>;
  }

  // Invert domain so faster paces sit higher on the chart
  const paceValues = data.map((d) => d.pace).filter((p) => p != null);
  const min = Math.floor(Math.min(...paceValues) - 0.2);
  const max = Math.ceil(Math.max(...paceValues) + 0.2);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#262626" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#8a8a8a', fontSize: 11, fontFamily: 'JetBrains Mono' }} stroke="#262626" />
        <YAxis
          reversed
          domain={[min, max]}
          tickFormatter={(v) => {
            const m = Math.floor(v);
            const s = Math.round((v - m) * 60);
            return `${m}:${String(s).padStart(2, '0')}`;
          }}
          tick={{ fill: '#8a8a8a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          stroke="#262626"
          label={{ value: 'min/km (lower = faster)', angle: -90, position: 'insideLeft', fill: '#8a8a8a', style: { fontSize: 11 } }}
        />
        <Tooltip
          contentStyle={{ background: '#181818', border: '1px solid #262626', fontFamily: 'JetBrains Mono', fontSize: 12 }}
          labelStyle={{ color: '#8a8a8a' }}
          formatter={(_v, name, ctx) => {
            if (name === 'Pace') return [formatPace(ctx.payload.paceSec), 'Pace'];
            if (name === '7-run avg') return [formatPace(ctx.payload.rollingSec), '7-run avg'];
            return _v;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <Line type="monotone" dataKey="pace" name="Pace" stroke={ACCENT} strokeWidth={1.5} dot={{ r: 2, fill: ACCENT }} activeDot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="rolling" name="7-run avg" stroke={ROLLING} strokeWidth={2} dot={false} strokeDasharray="4 4" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
