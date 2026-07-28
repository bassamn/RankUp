import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarRange, Clock3, Layers3, Target } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import DateInput from "../components/DateInput";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { chartOptions, palette } from "../lib/charts";
import { dateRange, datesBetween, displayDate, formatHours } from "../lib/format";

export default function Analytics({ topics, dateContext, refreshKey, onError }) {
  const [preset, setPreset] = useState("30d");
  const [topicId, setTopicId] = useState("");
  const [range, setRange] = useState(dateContext ? dateRange(dateContext.today, "30d") : { startDate: "", endDate: "" });
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (dateContext && !range.startDate) setRange(dateRange(dateContext.today, preset));
  }, [dateContext]);

  useEffect(() => {
    if (!range.startDate || !range.endDate) return;
    window.rankup
      .getAnalytics({ ...range, topicId: topicId || undefined })
      .then(setReport)
      .catch(onError);
  }, [range.startDate, range.endDate, topicId, refreshKey]);

  function choosePreset(value) {
    setPreset(value);
    setRange(dateRange(dateContext.today, value));
  }

  const dailyChart = useMemo(() => {
    if (!report || !range.startDate) return { labels: [], datasets: [] };
    const dates = datesBetween(range.startDate, range.endDate);
    const topicNames = [...new Set(report.daily.map((row) => row.topic_name))];
    const values = new Map(
      report.daily.map((row) => [`${row.topic_name}|${row.date}`, row.duration_seconds])
    );
    const stride = dates.length > 45 ? 10 : dates.length > 20 ? 5 : 1;
    return {
      labels: dates.map((date, index) => index % stride === 0 ? displayDate(date, "MMM d") : ""),
      datasets: topicNames.map((name, index) => ({
        label: name,
        data: dates.map((date) => (values.get(`${name}|${date}`) || 0) / 3600),
        borderColor: palette[index % palette.length],
        backgroundColor: index === 0 ? "rgba(199,245,64,.08)" : "transparent",
        fill: index === 0,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2.2
      }))
    };
  }, [report, range]);

  const topicChart = {
    labels: report?.byTopic.map((row) => row.topic_name) || [],
    datasets: [{
      data: report?.byTopic.map((row) => row.duration_seconds / 3600) || [],
      backgroundColor: palette,
      borderWidth: 0,
      spacing: 3
    }]
  };

  const monthlyChart = {
    labels: report?.monthly.map((row) => row.month) || [],
    datasets: [{
      label: "Monthly focus",
      data: report?.monthly.map((row) => row.duration_seconds / 3600) || [],
      backgroundColor: "#c7f540",
      borderRadius: 7,
      maxBarThickness: 46
    }]
  };

  const daysInRange = range.startDate ? datesBetween(range.startDate, range.endDate).length : 0;
  const average = daysInRange ? (report?.totalSeconds || 0) / daysInRange : 0;
  const activeAverage = report?.activeDays ? report.totalSeconds / report.activeDays : 0;

  return (
    <div className="page analytics-page">
      <PageHeader eyebrow="INSIGHTS" title="Analytics" description="See where your time goes and how your focus changes over time." />
      <div className="analytics-toolbar card">
        <div className="preset-tabs">
          {[["7d", "7 days"], ["30d", "30 days"], ["month", "This month"], ["90d", "3 months"]].map(([value, label]) => (
            <button key={value} className={preset === value ? "active" : ""} onClick={() => choosePreset(value)}>{label}</button>
          ))}
        </div>
        <div className="filter-group">
          <DateInput aria-label="Analytics start date" value={range.startDate} onChange={(event) => { setPreset(""); setRange({ ...range, startDate: event.target.value }); }} />
          <span>to</span>
          <DateInput aria-label="Analytics end date" value={range.endDate} onChange={(event) => { setPreset(""); setRange({ ...range, endDate: event.target.value }); }} />
          <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
            <option value="">All topics</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </select>
        </div>
      </div>

      <section className="metric-grid analytics-metrics">
        <AnalyticMetric icon={Clock3} label="Total focus" value={formatHours(report?.totalSeconds)} />
        <AnalyticMetric icon={Target} label="Daily average" value={formatHours(average)} />
        <AnalyticMetric icon={CalendarRange} label="Active-day average" value={formatHours(activeAverage)} />
        <AnalyticMetric icon={Layers3} label="Sessions" value={String(report?.sessions || 0)} />
      </section>

      {!report?.totalSeconds ? (
        <div className="card"><EmptyState icon={BarChart3} title="No data in this range" text="Complete a focus session or choose a date range with logged time." /></div>
      ) : (
        <section className="analytics-grid">
          <div className="card chart-card analytics-line">
            <div className="card-heading"><div><span className="section-kicker">DAILY</span><h2>Focus over time</h2></div></div>
            <div className="chart-wrap tall"><Line data={dailyChart} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: dailyChart.datasets.length > 1, labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 7, color: "#9ba0aa", font: { size: 9 } } } } }} /></div>
          </div>
          <div className="card chart-card distribution">
            <div className="card-heading"><div><span className="section-kicker">BREAKDOWN</span><h2>Time by topic</h2></div></div>
            <div className="doughnut-wrap">
              <Doughnut data={topicChart} options={{ responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}h` } } } }} />
              <div className="doughnut-center"><strong>{formatHours(report.totalSeconds)}</strong><span>total</span></div>
            </div>
            <div className="chart-legend">
              {report.byTopic.slice(0, 5).map((row, index) => <div key={row.topic_id}><i style={{ background: palette[index % palette.length] }} /><span>{row.topic_name}</span><strong>{formatHours(row.duration_seconds)}</strong></div>)}
            </div>
          </div>
          <div className="card chart-card analytics-line">
            <div className="card-heading"><div><span className="section-kicker">MONTHLY</span><h2>Aggregated hours</h2></div></div>
            <div className="chart-wrap"><Bar data={monthlyChart} options={chartOptions} /></div>
          </div>
          <div className="card report-summary">
            <span className="section-kicker">PERIOD SUMMARY</span>
            <h2>{displayDate(range.startDate, "MMM d")} — {displayDate(range.endDate, "MMM d, yyyy")}</h2>
            <div><span>Days in range</span><strong>{daysInRange}</strong></div>
            <div><span>Active days</span><strong>{report.activeDays}</strong></div>
            <div><span>Most focused topic</span><strong>{report.byTopic[0]?.topic_name || "—"}</strong></div>
          </div>
        </section>
      )}
    </div>
  );
}

function AnalyticMetric({ icon: Icon, label, value }) {
  return <div className="metric-card"><span className="metric-icon"><Icon size={19} /></span><div><span>{label}</span><strong>{value}</strong></div></div>;
}
