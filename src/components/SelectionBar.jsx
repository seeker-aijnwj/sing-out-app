import { Copy, FileText, Trash2, X } from "lucide-react";

export default function SelectionBar({ count, allDrafts, onDuplicate, onToggleDraft, onDelete, onCancel }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4">
      <div className="max-w-xl mx-auto bg-ink text-white rounded-2xl shadow-fab px-3 py-2.5 flex items-center gap-1.5">
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/10 shrink-0" aria-label="Annuler la sélection">
          <X size={16} />
        </button>
        <span className="text-sm font-medium flex-1 truncate">{count} sélectionné{count > 1 ? "s" : ""}</span>
        <button onClick={onDuplicate} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-xl hover:bg-white/10 shrink-0">
          <Copy size={14} /> Dupliquer
        </button>
        <button onClick={onToggleDraft} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-xl hover:bg-white/10 shrink-0">
          <FileText size={14} /> {allDrafts ? "Publier" : "Brouillon"}
        </button>
        <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-xl text-danger hover:bg-white/10 shrink-0">
          <Trash2 size={14} /> Suppr.
        </button>
      </div>
    </div>
  );
}
