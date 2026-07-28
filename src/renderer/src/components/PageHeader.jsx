import { CalendarDays } from "lucide-react";

export default function PageHeader({ eyebrow, title, description, action, dateLabel }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="header-actions">
        {dateLabel && (
          <span className="date-chip"><CalendarDays size={16} />{dateLabel}</span>
        )}
        {action}
      </div>
    </header>
  );
}
