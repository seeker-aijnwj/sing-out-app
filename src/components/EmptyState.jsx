export default function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-16 animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-card">
        {icon}
      </div>
      <p className="font-display font-semibold text-ink mb-1">{title}</p>
      {hint && <p className="text-sm text-muted max-w-xs">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
