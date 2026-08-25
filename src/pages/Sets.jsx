import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, ListMusic, ChevronRight, CalendarDays, List, Calendar } from "lucide-react";
import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MonthCalendar from "../components/MonthCalendar.jsx";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";
import { getSets } from "../lib/storage.js";
import { formatDateLong } from "../lib/share.js";

export default function Sets() {
  const navigate = useNavigate();
  const sets = getSets();
  const [view, setView] = useState("liste");
  const { allowed: canUseCalendar } = useAccess("member");

  return (
    <div className="pb-24">
      <Header
        title="Listes de chants"
        subtitle={`${sets.length} liste${sets.length > 1 ? "s" : ""} enregistrée${sets.length > 1 ? "s" : ""}`}
        action={
          <Link
            to="/listes/nouvelle"
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue text-white shadow-fab active:scale-95 transition-transform"
            aria-label="Créer une liste"
          >
            <Plus size={20} />
          </Link>
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
              return (
                <Link
                  key={set.id}
                  to={`/listes/${set.id}`}
                  className="group flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors animate-fade-up"
                >
                  <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal">
                    <ListMusic size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-ink truncate">{set.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted truncate">
                      {set.date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} /> {formatDateLong(set.date)}
                        </span>
                      )}
                      <span>· {count} chant{count > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-border group-hover:text-brand-blue shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
