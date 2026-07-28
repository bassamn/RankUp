import {
  BarChart3,
  CheckSquare,
  Clock3,
  LayoutDashboard,
  Settings,
  Sparkles,
  Tags
} from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "topics", label: "Topics", icon: Tags },
  { id: "timer", label: "Timer", icon: Clock3 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "todos", label: "To-Do", icon: CheckSquare },
  { id: "settings", label: "Settings", icon: Settings }
];

export default function Sidebar({ page, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo"><img src="./rankup-logo.png" alt="" /></span>
        <span>RankUp</span>
      </div>
      <nav className="nav-list" aria-label="Primary navigation">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            className={`nav-item ${page === id ? "active" : ""}`}
            key={id}
            onClick={() => onNavigate(id)}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <div className="sidebar-card-icon"><Sparkles size={17} /></div>
        <strong>Stay consistent</strong>
        <p>Small focused sessions add up to remarkable progress.</p>
      </div>
      <div className="sidebar-footer">
        <div className="avatar">RU</div>
        <div>
          <strong>Local workspace</strong>
          <span>Private on this device</span>
        </div>
      </div>
    </aside>
  );
}
