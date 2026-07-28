import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, Globe2, ShieldCheck } from "lucide-react";

export default function TimezoneOnboarding({ detectedTimezone, onComplete, onError }) {
  const [timezone, setTimezone] = useState(detectedTimezone || "UTC");
  const [saving, setSaving] = useState(false);
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return ["UTC", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Tehran", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];
    }
  }, []);

  async function continueToApp(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await window.rankup.setTimezone(timezone);
      await onComplete();
    } catch (error) {
      onError(error);
      setSaving(false);
    }
  }

  return (
    <main className="onboarding">
      <div className="onboarding-glow" />
      <section className="onboarding-card">
        <div className="onboarding-brand">
          <img src="./rankup-logo.png" alt="RankUp" />
          <span>RankUp</span>
        </div>
        <div className="onboarding-step">INITIAL SETUP <span>1 OF 1</span></div>
        <div className="onboarding-icon"><Globe2 size={28} /></div>
        <h1>Set your timezone</h1>
        <p>RankUp uses your timezone to place sessions and tasks on the correct day. You can change it later in Settings.</p>
        <form onSubmit={continueToApp}>
          <label>YOUR TIMEZONE
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)} autoFocus>
              {!timezones.includes("UTC") && <option value="UTC">UTC</option>}
              {timezones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <button type="button" className="detected-timezone onboarding-detected" onClick={() => setTimezone(detectedTimezone)}>
            <Clock3 size={15} />Detected automatically: {detectedTimezone}<Check size={14} />
          </button>
          <button className="button primary onboarding-continue" disabled={saving || !timezone}>
            {saving ? "Saving your preference…" : "Continue to RankUp"}{!saving && <ArrowRight size={17} />}
          </button>
        </form>
        <div className="onboarding-private"><ShieldCheck size={15} /><span>Stored privately on this device</span></div>
      </section>
    </main>
  );
}
