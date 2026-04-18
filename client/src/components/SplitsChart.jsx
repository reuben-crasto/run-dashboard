import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, Cell,
} from 'recharts';
import { mpsToSecPerKm, paceMinutesDecimal, formatPace } from '../lib/format.js';

const COLOR_GOOD = '#00ff87';
const COLOR_WARN = '#ffb800';
const COLOR_BAD  = '#ff4d4d';

function colorForSplit(paceSec, avgSec) {
  if (paceSec == null || avgSec == null) return COLOR_GOOD;
  const ratio = paceSec / avgSec;
  // Pace is time/distance — higher = slower
  if (ratio <= 1.0) return COLOR_GOOD;           // at or faster than avg
  if (ratio <= 1.05) return COLOR_GOOD;          // up to 5% slower stays green
  if (ratio <= 1.10) return COLOR_WARN;          // 5–10% slower
  return COLOR_BAD;                              // 10%+ slower
}

export default function SplitsChart({ splits, averageSpeedMps }) {
  const { data, avgMin } = useMemo(() => {
    const avgSec = mpsToSecPerKm(averageSpeedMps);
    const rows = splits.map((s, i) => {
      const paceSec = mpsToSecPerKm(s.average_speed);
      return {
        km: i + 1,
        paceMin: paceMinutesDecimal(paceSec),
        paceSec,
        color: colorForSplit(paceSec, avgSec),
      };
    });
    return { data: rows, avgMin: paceMinutesDecimal(avgSec) };
  }, [splits, averageSpeedMps]);

  if (data.length === 0) {
    return <div className="empty-state">No split data for this run.</div>;
  }

  const maxPace = Math.max(...data.map((d) => d.paceMin).filter(Boolean));
  const minPace = Math.min(...data.map((d) => d.paceMin).filter(Boolean));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid stroke="#262626" vertical={false} />
        <XAxis
          dataKey="km"
          tick={{ fill: '#8a8a8a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          stroke="#262626"
          label={{ value: 'km split', position: 'insideBottom', dy: 10, fill: '#8a8a8a', style: { fontSize: 11 } }}
        />
        <YAxis
          domain={[Math.floor(minPace - 0.2), Math.ceil(maxPace + 0.2)]}
          reversed
          tickFormatter={(v) => {
            const m = Math.floor(v);
            const s = Math.round((v - m) * 60);
            return `${m}:${String(s).padStart(2, '0')}`;
          }}
          tick={{ fill: '#8a8a8a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          stroke="#262626"
        />
        <Tooltip
          contentStyle={{ background: '#181818', border: '1px solid #262626', fontFamily: 'JetBrains Mono', fontSize: 12 }}
          labelStyle={{ color: '#8a8a8a' }}
          formatter={(_v, _name, ctx) => [formatPace(ctx.payload.paceSec), `km ${ctx.payload.km}`]}
          labelFormatter={() => ''}
        />
        <ReferenceLine
          y={avgMin}
          stroke="#f5f5f5"
          strokeDasharray="4 4"
          label={{ value: `avg ${formatPace(avgMin * 60)}`, position: 'insideTopRight', fill: '#8a8a8a', style: { fontSize: 11, fontFamily: 'JetBrains Mono' } }}
        />
        <Bar dataKey="paceMin" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.km} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
