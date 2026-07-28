export default function DateInput({ className = "", onClick, ...props }) {
  function openPicker(event) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Browsers without programmatic picker support keep their native behavior.
    }
  }

  return (
    <input
      {...props}
      className={`date-input ${className}`.trim()}
      type="date"
      onClick={openPicker}
    />
  );
}
