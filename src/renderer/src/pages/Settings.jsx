import { useEffect, useMemo, useState } from "react";
import { Clock3, Database, Globe2, HardDrive, ShieldCheck, Target } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Settings({ settings, onSaved, onError }) {
  const [timezone, setTimezone] = useState(settings?.timezone || "UTC");
  const [dailyGoal, setDailyGoal] = useState(settings?.dailyGoalMinutes ?? "none");
  const [saving, setSaving] = useState(false);
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return ["UTC", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Tehran", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];
    }
  }, []);

  useEffect(() => {
    setTimezone(settings?.timezone || "UTC");
    setDailyGoal(settings?.dailyGoalMinutes ?? "none");
  }, [settings]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        window.rankup.setTimezone(timezone),
        window.rankup.setDailyGoal(dailyGoal === "none" ? null : Number(dailyGoal))
      ]);
      await onSaved();
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="page settings-page">
      <PageHeader eyebrow="PREFERENCES" title="Settings" description="Tune RankUp to match your working day." />
      <form className="settings-form" onSubmit={save}>
        <section className="settings-layout">
          <div className="card settings-card">
            <div className="settings-icon"><Globe2 size={22} /></div>
            <div className="settings-content">
              <h2>Timezone & date</h2>
              <p>Your selected timezone defines when a day starts and where focus sessions are counted.</p>
              <label className="field-label">Timezone
                <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                  {!timezones.includes("UTC") && <option value="UTC">UTC</option>}
                  {timezones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <button type="button" className="detected-timezone" onClick={() => setTimezone(detected)}><Clock3 size={15} />Use detected timezone: {detected}</button>
            </div>
          </div>

          <div className="card settings-card">
            <div className="settings-icon"><Target size={22} /></div>
            <div className="settings-content">
              <h2>Daily focus milestone</h2>
              <p>Choose a flexible target for each day. It is a progress marker only—sessions always continue beyond 100%.</p>
              <label className="field-label">Daily goal
                <select value={dailyGoal} onChange={(event) => setDailyGoal(event.target.value)}>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                  <option value="480">8 hours</option>
                  <option value="600">10 hours</option>
                  <option value="none">No limit</option>
                </select>
              </label>
              <div className="goal-explainer"><span>∞</span><p>RankUp never pauses or caps your timer when a milestone is reached.</p></div>
            </div>
          </div>

          <div className="card settings-card info-card">
            <div className="settings-icon"><Database size={22} /></div>
            <div className="settings-content">
              <h2>Local data</h2>
              <p>Your topics, sessions, tasks, and preferences are stored in a local SQLite database.</p>
              <div className="privacy-row"><ShieldCheck size={18} /><div><strong>Private by design</strong><span>No account or cloud connection required.</span></div></div>
              <div className="privacy-row"><HardDrive size={18} /><div><strong>Stored on this device</strong><span>Your data stays inside RankUp’s application data folder.</span></div></div>
            </div>
          </div>
        </section>
        <div className="settings-save-bar">
          <div>
            <strong>Save your preferences</strong>
            <span>Timezone and focus-goal changes are applied together.</span>
          </div>
          <button className="button primary" disabled={saving || (timezone === settings?.timezone && String(dailyGoal) === String(settings?.dailyGoalMinutes ?? "none"))}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
