import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, ListMusic, ChevronRight, CalendarDays, List, Calendar, CheckSquare, Check, FileText } from "lucide-react";
import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";
import SelectionBar from "../components/SelectionBar.jsx";
import { getSets, onDataChange, deleteSets, duplicateSets, setSetsDraft } from "../lib/storage.js";
import { formatDateLong } from "../lib/share.js";

export default function Sets() {
  const navigate = useNavigate();
  const [sets, setSets] = useState(() => getSets());
  const [view, setView] = useState("liste");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const { allowed: canUseCalendar } = useAccess("member");
  const { allowed: canUsePlusFeatures } = useAccess("plus");

  useEffect(() => onDataChange(() => setSets(getSets())), []);

  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v);
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allSelectedAreDrafts = selectedIds.length > 0 && selectedIds.every((id) => sets.find((s) => s.id === id)?.draft);

  const handleBulkDelete = () => {
    if (!window.confirm(`Supprimer ${selectedIds.length} liste${selectedIds.length > 1 ? "s" : ""} ? Cette action est irréversible.`)) return;
    deleteSets(selectedIds);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const handleBulkDuplicate = () => {
    duplicateSets(selectedIds);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const handleBulkDraft = () => {
    setSetsDraft(selectedIds, !allSelectedAreDrafts);
    setSelected(new Set());
    setSelectionMode(false);
  };

  return (
    <div className="pb-24">
      <Header
        title="Listes de chants"
        subtitle={`${sets.length} liste${sets.length > 1 ? "s" : ""} enregistrée${sets.length > 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2 shrink-0">
            {canUsePlusFeatures && sets.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                aria-pressed={selectionMode}
                aria-label="Sélectionner plusieurs listes"
                title="Sélectionner plusieurs listes"
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  selectionMode ? "bg-ink text-white" : "bg-surface border border-border text-ink-soft"
                }`}
              >
                <CheckSquare size={18} />
              </button>
            )}
            <Link
              to="/listes/nouvelle"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue text-white shadow-fab active:scale-95 transition-transform"
              aria-label="Créer une liste"
            >
              <Plus size={20} />
            </Link>
          </div>
        }
      />

      <main className="max-w-xl mx-auto px-4 pt-4">
        {sets.length > 0 && canUseCalendar && (
          <div className="flex items-center gap-1.5 mb-4 bg-surface border border-border rounded-2xl p-1">
            <button
              onClick={() => setView("liste")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl py-2 transition-colors ${
                view === "liste" ? "bg-brand-blue text-white" : "text-ink-soft"
              }`}
            >
              <List size={14} /> Liste
            </button>
            <button
              onClick={() => setView("calendrier")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl py-2 transition-colors ${
                view === "calendrier" ? "bg-brand-blue text-white" : "text-ink-soft"
              }`}
            >
              <Calendar size={14} /> Calendrier
            </button>
          </div>
        )}

        {sets.length > 0 && !canUseCalendar && (
          <div className="mb-4">
            <AccessGate level="member" compact hint="Connectez-vous pour accéder à la vue calendrier." />
          </div>
        )}

        {sets.length === 0 ? (
          <EmptyState
            icon={<ListMusic size={26} />}
            title="Aucune liste pour l'instant"
            hint="Créez une liste de chants pour un culte ou un rassemblement, organisée par moments (Début de culte, Recueillement, Animation…)."
            action={
              <Link
                to="/listes/nouvelle"
                className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-fab"
              >
                <Plus size={16} /> Créer une liste
              </Link>
            }
          />
        ) : view === "calendrier" && canUseCalendar ? (
          <MonthCalendar sets={sets} onSelectSet={(set) => navigate(`/listes/${set.id}`)} />
        ) : (
          <div className="space-y-2">
            {sets.map((set) => {
              const count = set.moments?.reduce((n, m) => n + m.items.length, 0) || 0;
              const isSelected = selected.has(set.id);
              const itemContent = (
                <>
                  {selectionMode ? (
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "bg-brand-blue border-brand-blue text-white" : "border-border text-transparent"
                      }`}
                      aria-hidden
                    >
                      <Check size={12} />
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal">
                      <ListMusic size={18} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-ink truncate flex items-center gap-1.5">
                      {set.title}
                      {set.draft && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted bg-paper border border-border rounded-full px-1.5 py-0.5">
                          <FileText size={9} /> Brouillon
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted truncate">
                      {set.date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} /> {formatDateLong(set.date)}
                        </span>
                      )}
                      <span>· {count} chant{count > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {!selectionMode && (
                    <ChevronRight size={18} className="text-border group-hover:text-brand-blue shrink-0 transition-colors" />
                  )}
                </>
              );

              const className =
                "group flex items-center gap-3 bg-surface rounded-2xl border px-4 py-3.5 shadow-card transition-colors animate-fade-up w-full text-left " +
                (isSelected ? "border-brand-blue/60 ring-1 ring-brand-blue/30" : "border-border hover:border-brand-blue/40");

              return selectionMode ? (
                <button key={set.id} type="button" onClick={() => toggleSelect(set.id)} className={className}>
                  {itemContent}
                </button>
              ) : (
                <Link key={set.id} to={`/listes/${set.id}`} className={className}>
                  {itemContent}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <SelectionBar
        count={selected.size}
        allDrafts={allSelectedAreDrafts}
        onDuplicate={handleBulkDuplicate}
        onToggleDraft={handleBulkDraft}
        onDelete={handleBulkDelete}
        onCancel={toggleSelectionMode}
      />

      <BottomNav />
    </div>
  );
}
