import { useEffect, useState } from "react";
import { Check, CheckCircle2, History, ListTodo, Plus, Trash2 } from "lucide-react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { displayDate } from "../lib/format";

export default function Todos({ topics, dateContext, refreshKey, onChanged, onError }) {
  const [tab, setTab] = useState("active");
  const [selectedDate, setSelectedDate] = useState(dateContext?.today || "");
  const [topicFilter, setTopicFilter] = useState("");
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [newTopicId, setNewTopicId] = useState(topics[0]?.id || "");

  useEffect(() => {
    if (!selectedDate && dateContext?.today) setSelectedDate(dateContext.today);
  }, [dateContext, selectedDate]);

  useEffect(() => {
    if (!newTopicId && topics[0]) setNewTopicId(topics[0].id);
  }, [topics, newTopicId]);

  async function load() {
    const [activeRows, completedRows] = await Promise.all([
      window.rankup.listTodos({ dueDate: selectedDate, topicId: topicFilter || undefined, completed: false }),
      window.rankup.listTodos({ topicId: topicFilter || undefined, completed: true })
    ]);
    setTasks(activeRows);
    setHistory(completedRows);
  }

  useEffect(() => {
    if (selectedDate) load().catch(onError);
  }, [selectedDate, topicFilter, refreshKey]);

  async function addTask(event) {
    event.preventDefault();
    if (!taskText.trim() || !newTopicId) return;
    try {
      await window.rankup.createTodo({ topicId: Number(newTopicId), taskText, dueDate: selectedDate });
      setTaskText("");
      await load();
      onChanged();
    } catch (error) {
      onError(error);
    }
  }

  async function complete(id) {
    try {
      await window.rankup.completeTodo(id);
      await load();
      onChanged();
    } catch (error) {
      onError(error);
    }
  }

  async function remove(id) {
    try {
      await window.rankup.deleteTodo(id);
      await load();
      onChanged();
    } catch (error) {
      onError(error);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="GET IT DONE" title="To-do list" description="Plan work by topic and date, then build a record of completed tasks." />
      <div className="toolbar card">
        <div className="tabs">
          <button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}><ListTodo size={16} />Active</button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><History size={16} />Task history</button>
        </div>
        <div className="filter-group">
          {tab === "active" && <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />}
          <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
            <option value="">All topics</option>
            {topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.name}</option>)}
          </select>
        </div>
      </div>

      {tab === "active" ? (
        <section className="todo-layout">
          <div className="card todo-main">
            <div className="card-heading">
              <div><span className="section-kicker">{displayDate(selectedDate, "EEEE")}</span><h2>{displayDate(selectedDate, "MMMM d, yyyy")}</h2></div>
              <span className="count-badge">{tasks.length} open</span>
            </div>
            <form className="todo-form" onSubmit={addTask}>
              <div className="todo-input"><Plus size={18} /><input value={taskText} onChange={(event) => setTaskText(event.target.value)} placeholder="What needs to get done?" maxLength={300} /></div>
              <select value={newTopicId} onChange={(event) => setNewTopicId(event.target.value)}>
                {!topics.length && <option value="">No topics</option>}
                {topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.name}</option>)}
              </select>
              <button className="button primary" disabled={!taskText.trim() || !newTopicId}>Add task</button>
            </form>
            {tasks.length ? (
              <div className="todo-list">
                {tasks.map((task) => (
                  <div className="todo-item" key={task.id}>
                    <button className="complete-button" onClick={() => complete(task.id)} aria-label="Complete task"><Check size={15} /></button>
                    <div><strong>{task.task_text}</strong><span><i />{task.topic_name}</span></div>
                    <button className="icon-button danger" onClick={() => remove(task.id)} aria-label="Delete task"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title="Nothing scheduled" text="Add a task above or enjoy the open space in your day." />
            )}
          </div>
          <aside className="card todo-summary">
            <span className="section-kicker">DAILY PLAN</span>
            <div className="summary-number">{tasks.length}</div>
            <strong>tasks remaining</strong>
            <p>Keep the list intentional. A clear day is easier to finish.</p>
          </aside>
        </section>
      ) : (
        <section className="card history-card">
          <div className="card-heading"><div><span className="section-kicker">ARCHIVE</span><h2>Completed tasks</h2></div><span className="count-badge">{history.length} completed</span></div>
          {history.length ? (
            <div className="history-list">
              {history.map((task) => (
                <div className="history-item" key={task.id}>
                  <span className="history-check"><Check size={15} /></span>
                  <div><strong>{task.task_text}</strong><span>{task.topic_name} · Planned for {displayDate(task.due_date, "MMM d, yyyy")}</span></div>
                  <time>{task.completed_at ? new Date(task.completed_at).toLocaleString() : ""}</time>
                  <button className="icon-button danger" onClick={() => remove(task.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={History} title="No completed tasks yet" text="Checked tasks will be archived here with their completion time." />
          )}
        </section>
      )}
    </div>
  );
}
