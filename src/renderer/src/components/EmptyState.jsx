export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-icon"><Icon size={24} /></span>}
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}
