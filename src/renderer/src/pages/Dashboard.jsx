import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Flame, Play, Target, TrendingUp } from "lucide-react";
import { Line } from "react-chartjs-2";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { chartOptions } from "../lib/charts";
import { datesBetween, displayDate, formatDuration, formatHours } from "../lib/format";

export default function Dashboard({ topics, dateContext, onNavigate, refreshKey }) {
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!dateContext?.today) return;
    Promise.all([
      window.rankup.getAnalytics({ startDate: dateContext.weekStart, endDate: dateContext.today }),
      window.rankup.listTodos({ dueDate: dateContext.today, completed: false })
    ]).then(([report, todoRows]) => {
      setAnalytics(report);
      setTasks(todoRows);
    });
  }, [dateContext, refreshKey]);

  const chartData = useMemo(() => {
    if (!analytics || !dateContext) return { labels: [], datasets: [] };
    const dates = datesBetween(dateContext.weekStart, dateContext.today);
    const totals = new Map();
    analytics.daily.forEach((row) => totals.set(row.date, (totals.get(row.date) || 0) + row.duration_seconds));
    return {
      labels: dates.map((date) => displayDate(date, "EEE")),
      datasets: [{
        label: "Focus",
        data: dates.map((date) => (totals.get(date) || 0) / 3600),
        borderColor: "#c7f540",
        backgroundColor: "rgba(199,245,64,.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2.5
      }]
    };
  }, [analytics, dateContext]);

  const todaySeconds = topics.reduce((sum, topic) => sum + topic.today_seconds, 0);
  const weekSeconds = topics.reduce((sum, topic) => sum + topic.week_seconds, 0);
  const topTopic = [...topics].sort((a, b) => b.week_seconds - a.week_seconds)[0];
  const average = analytics?.activeDays ? analytics.totalSeconds / analytics.activeDays : 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="OVERVIEW"
        title="Make today count."
        description="Track your focus, finish what matters, and keep your momentum."
        dateLabel={dateContext ? displayDate(dateContext.today, "EEEE, MMM d") : ""}
        action={<button className="button primary" onClick={() => onNavigate("timer")}><Play size={17} fill="currentColor" />Start a session</button>}
      />

      <section className="metric-grid">
        <MetricCard icon={Clock3} label="Focused today" value={formatHours(todaySeconds)} meta="Across all topics" accent />
        <MetricCard icon={TrendingUp} label="This week" value={formatHours(weekSeconds)} meta={`${analytics?.sessions || 0} completed sessions`} />
        <MetricCard icon={Target} label="Daily average" value={formatHours(average)} meta="On active days" />
        <MetricCard icon={CheckCircle2} label="Tasks remaining" value={String(tasks.length)} meta="Scheduled for today" />
      </section>

      <section className="dashboard-grid">
        <div className="card chart-card wide">
          <div className="card-heading">
            <div>
              <span className="section-kicker">WEEKLY ACTIVITY</span>
              <h2>Your focus rhythm</h2>
            </div>
            <span className="trend-pill"><TrendingUp size={14} />{formatDuration(weekSeconds, true)}</span>
          </div>
          <div className="chart-wrap"><Line data={chartData} options={chartOptions} /></div>
        </div>

        <div className="card goal-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">TOP FOCUS</span>
              <h2>This week</h2>
            </div>
            <Flame size={20} className="lime" />
          </div>
          {topTopic && topTopic.week_seconds > 0 ? (
            <div className="top-focus">
              <div className="progress-ring" style={{ "--progress": `${Math.min(100, (topTopic.week_seconds / Math.max(weekSeconds, 1)) * 100)}%` }}>
                <div><strong>{Math.round((topTopic.week_seconds / Math.max(weekSeconds, 1)) * 100)}%</strong><span>of time</span></div>
              </div>
              <h3>{topTopic.name}</h3>
              <p>{formatDuration(topTopic.week_seconds, true)} logged this week</p>
              <button className="button ghost full" onClick={() => onNavigate("timer")}>Continue topic <ArrowRight size={16} /></button>
            </div>
          ) : (
            <EmptyState icon={Target} title="No focus logged yet" text="Complete a timer session to start your weekly rhythm." />
          )}
        </div>

        <div className="card wide">
          <div className="card-heading">
            <div>
              <span className="section-kicker">TOPICS</span>
              <h2>Recent progress</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("topics")}>View all <ArrowRight size={15} /></button>
          </div>
          {topics.length ? (
            <div className="topic-rows">
              {topics.slice(0, 4).map((topic, index) => (
                <div className="topic-row" key={topic.id}>
                  <span className={`topic-dot dot-${index % 4}`} />
                  <div className="topic-row-name"><strong>{topic.name}</strong><span>{formatDuration(topic.total_seconds, true)} overall</span></div>
                  <div className="topic-row-stat"><span>Today</span><strong>{formatDuration(topic.today_seconds, true)}</strong></div>
                  <div className="mini-progress"><span style={{ width: `${Math.min(100, (topic.week_seconds / Math.max(weekSeconds, 1)) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Target} title="Create your first topic" text="Topics keep sessions and tasks organized around what matters." action={<button className="button secondary" onClick={() => onNavigate("topics")}>Add topic</button>} />
          )}
        </div>

        <div className="card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">TODAY</span>
              <h2>Next tasks</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("todos")}>Open list</button>
          </div>
          {tasks.length ? (
            <div className="compact-tasks">
              {tasks.slice(0, 4).map((task) => (
                <div key={task.id}><span className="task-check" /><div><strong>{task.task_text}</strong><span>{task.topic_name}</span></div></div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="All clear" text="You have no active tasks scheduled for today." />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, meta, accent }) {
  return (
    <div className={`metric-card ${accent ? "accent" : ""}`}>
      <span className="metric-icon"><Icon size={19} /></span>
      <div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>
    </div>
  );
}
