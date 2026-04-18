import { useState } from 'react';
import { saveRunLog } from '../lib/api.js';
import { formatDate, formatKm, mpsToSecPerKm, formatPace } from '../lib/format.js';

const OVERALL_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😐', label: 'OK' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😄', label: 'Great' },
];

function DotSelector({ label, sublabel, value, onChange, max = 5 }) {
  return (
    <div className="dot-field">
      <div className="dot-field-label">
        {label} <span className="dot-field-sub">{sublabel}</span>
      </div>
      <div className="dot-row">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`dot-btn ${value === n ? 'dot-btn--active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RunLogForm({ run, existingLog, onClose, onSaved }) {
  const [km1Rpe,   setKm1Rpe]   = useState(existingLog?.km1_rpe   ?? null);
  const [soreness, setSoreness] = useState(existingLog?.soreness   ?? null);
  const [overall,  setOverall]  = useState(existingLog?.overall    ?? null);
  const [notes,    setNotes]    = useState(existingLog?.notes      ?? '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await saveRunLog({
        activity_id: run.id,
        km1_rpe:  km1Rpe,
        soreness: soreness,
        overall:  overall,
        notes:    notes.trim() || null,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error === 'supabase_not_configured'
        ? 'Supabase is not configured yet — add SUPABASE_URL and SUPABASE_ANON_KEY to server/.env'
        : (err.message || 'Failed to save'));
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Log this run</div>
            <div className="modal-subtitle">
              {formatDate(run.start_date)} · {formatKm(run.distance_m)} · {formatPace(mpsToSecPerKm(run.average_speed_mps))}
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>✕</button>
        </div>

        <form className="log-form" onSubmit={handleSubmit}>
          <DotSelector
            label="How did km 1 feel?"
            sublabel="1 = easy · 5 = all-out"
            value={km1Rpe}
            onChange={setKm1Rpe}
          />
          <DotSelector
            label="Leg soreness before the run?"
            sublabel="1 = fresh · 5 = very sore"
            value={soreness}
            onChange={setSoreness}
          />

          <div className="dot-field">
            <div className="dot-field-label">Overall, how did it go?</div>
            <div className="emoji-row">
              {OVERALL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`emoji-btn ${overall === o.value ? 'emoji-btn--active' : ''}`}
                  onClick={() => setOverall(o.value)}
                >
                  <span className="emoji-icon">{o.emoji}</span>
                  <span className="emoji-label">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="dot-field">
            <div className="dot-field-label">Notes <span className="dot-field-sub">optional</span></div>
            <textarea
              className="log-notes"
              placeholder="Anything worth remembering about this run…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="log-error">{error}</div>}

          <button type="submit" className="log-submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save log'}
          </button>
        </form>
      </div>
    </div>
  );
}
