import { useEffect, useRef, useState } from "react";
import { Check, CirclePause, Play, RotateCcw, TimerReset } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { formatDuration } from "../lib/format";

export default function Timer({ topics, settings, onLogged, onError, initialTopicId }) {
  const [topicId, setTopicId] = useState(initialTopicId || topics[0]?.id || "");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef(null);
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    if (!topicId && topics[0]) setTopicId(topics[0].id);
  }, [topics, topicId]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => setElapsed(baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  function startOrResume() {
    if (!topicId) return;
    startedAtRef.current = Date.now();
    baseElapsedRef.current = elapsed;
    setRunning(true);
  }

  function pause() {
    const updated = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
    baseElapsedRef.current = updated;
    setElapsed(updated);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    baseElapsedRef.current = 0;
    startedAtRef.current = null;
  }

  async function submit() {
    let finalElapsed = elapsed;
    if (running) {
      finalElapsed = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
      setRunning(false);
    }
    if (finalElapsed < 1 || !topicId) return;
    setSubmitting(true);
    try {
      await window.rankup.addTimeLog({ topicId: Number(topicId), durationSeconds: finalElapsed });
      reset();
      await onLogged();
    } catch (error) {
      onError(error);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTopic = topics.find((topic) => topic.id === Number(topicId));
  const dailyGoalMinutes = settings?.dailyGoalMinutes;
  const dailyGoalSeconds = dailyGoalMinutes ? dailyGoalMinutes * 60 : null;
  const projectedTodaySeconds = (selectedTopic?.today_seconds || 0) + elapsed;
  const goalPercent = dailyGoalSeconds ? Math.round((projectedTodaySeconds / dailyGoalSeconds) * 100) : null;
  const circumference = 2 * Math.PI * 144;
  const progress = Math.min(1, (elapsed % 3600) / 3600);

  return (
    <div className="page timer-page">
      <PageHeader eyebrow="FOCUS MODE" title="Focus timer" description="One task. One topic. Make this time count." />
      <section className="timer-layout">
        <div className="timer-panel">
          <div className="topic-select-wrap">
            <label>Currently focusing on</label>
            <select value={topicId} onChange={(event) => !running && setTopicId(event.target.value)} disabled={running}>
              {!topics.length && <option value="">Create a topic first</option>}
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
          </div>
          <div className={`timer-orbit ${running ? "running" : ""}`}>
            <svg viewBox="0 0 320 320" aria-hidden="true">
              <circle className="orbit-track" cx="160" cy="160" r="144" />
              <circle className="orbit-progress" cx="160" cy="160" r="144" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
            </svg>
            <div className="timer-value">
              <span>{running ? "SESSION IN PROGRESS" : elapsed ? "SESSION PAUSED" : "READY TO FOCUS"}</span>
              <strong>{formatDuration(elapsed)}</strong>
              <small>{selectedTopic?.name || "Choose a topic"}</small>
            </div>
          </div>
          <div className="timer-controls">
            <button className="round-button secondary" onClick={reset} disabled={!elapsed} aria-label="Reset timer"><RotateCcw size={21} /></button>
            {running ? (
              <button className="round-button primary big" onClick={pause}><CirclePause size={27} fill="currentColor" />Pause</button>
            ) : (
              <button className="round-button primary big" onClick={startOrResume} disabled={!topicId}><Play size={27} fill="currentColor" />{elapsed ? "Resume" : "Start"}</button>
            )}
            <button className="round-button secondary" onClick={submit} disabled={!elapsed || submitting} aria-label="Save session"><Check size={22} /></button>
          </div>
          <p className="timer-hint"><TimerReset size={15} />Pause whenever you need. Done saves this session to today’s total.</p>
        </div>
        <aside className="timer-side">
          <div className="card session-card">
            <span className="section-kicker">TODAY'S PROGRESS</span>
            <h2>{selectedTopic?.name || "No topic selected"}</h2>
            <strong className="large-number">{formatDuration(projectedTodaySeconds, true)}</strong>
            <p>including this session</p>
            {dailyGoalSeconds ? (
              <>
                <div className={`mini-progress large ${goalPercent > 100 ? "goal-surpassed" : ""}`}>
                  <span style={{ width: `${Math.min(100, goalPercent)}%` }} />
                </div>
                <small>{goalPercent}% of your {formatDuration(dailyGoalSeconds, true)} daily milestone{goalPercent > 100 ? " — keep going" : ""}</small>
              </>
            ) : (
              <div className="no-limit-note"><span>∞</span><small>No daily limit — track as long as you like</small></div>
            )}
          </div>
          <div className="card focus-note">
            <span>TIP</span>
            <p>Close unrelated tabs and silence notifications. Your future self will thank you.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
