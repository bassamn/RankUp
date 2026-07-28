import { useState } from "react";
import { Clock3, MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { formatDuration } from "../lib/format";

export default function Topics({ topics, onChanged, onError }) {
  const [modal, setModal] = useState(null);
  const [name, setName] = useState("");
  const [menuId, setMenuId] = useState(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setName("");
    setModal({ mode: "create" });
  }

  function openEdit(topic) {
    setName(topic.name);
    setModal({ mode: "edit", topic });
    setMenuId(null);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === "edit") await window.rankup.updateTopic(modal.topic.id, name);
      else await window.rankup.createTopic(name);
      setModal(null);
      await onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  async function remove(topic) {
    setMenuId(null);
    if (!window.confirm(`Delete “${topic.name}” and all of its time logs and tasks?`)) return;
    try {
      await window.rankup.deleteTopic(topic.id);
      await onChanged();
    } catch (error) {
      onError(error);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="ORGANIZE"
        title="Your topics"
        description="Create focused spaces for every subject, project, or skill."
        action={<button className="button primary" onClick={openCreate}><Plus size={18} />New topic</button>}
      />
      {topics.length ? (
        <section className="topic-grid">
          {topics.map((topic, index) => (
            <article className="topic-card" key={topic.id}>
              <div className="topic-card-top">
                <span className={`topic-symbol dot-${index % 4}`}>{topic.name.slice(0, 2).toUpperCase()}</span>
                <div className="menu-wrap">
                  <button className="icon-button" onClick={() => setMenuId(menuId === topic.id ? null : topic.id)}><MoreHorizontal size={20} /></button>
                  {menuId === topic.id && (
                    <div className="context-menu">
                      <button onClick={() => openEdit(topic)}><Pencil size={15} />Rename</button>
                      <button className="danger" onClick={() => remove(topic)}><Trash2 size={15} />Delete</button>
                    </div>
                  )}
                </div>
              </div>
              <h2>{topic.name}</h2>
              <p>Created {new Date(`${topic.created_at}Z`).toLocaleDateString()}</p>
              <div className="topic-total"><Clock3 size={17} /><strong>{formatDuration(topic.total_seconds, true)}</strong><span>total focus</span></div>
              <div className="topic-stats">
                <div><span>Today</span><strong>{formatDuration(topic.today_seconds, true)}</strong></div>
                <div><span>This week</span><strong>{formatDuration(topic.week_seconds, true)}</strong></div>
              </div>
            </article>
          ))}
          <button className="topic-card add-topic" onClick={openCreate}><span><Plus size={22} /></span><strong>Add another topic</strong><small>Keep your work organized</small></button>
        </section>
      ) : (
        <div className="card">
          <EmptyState icon={Tags} title="No topics yet" text="Create a topic to start tracking focused time and tasks." action={<button className="button primary" onClick={openCreate}><Plus size={17} />Create topic</button>} />
        </div>
      )}
      {modal && (
        <Modal title={modal.mode === "edit" ? "Rename topic" : "Create a topic"} onClose={() => setModal(null)}>
          <form onSubmit={save} className="modal-form">
            <label>Topic name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Algorithms" maxLength={80} /></label>
            <div className="modal-actions"><button type="button" className="button ghost" onClick={() => setModal(null)}>Cancel</button><button className="button primary" disabled={saving || !name.trim()}>{saving ? "Saving…" : "Save topic"}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
