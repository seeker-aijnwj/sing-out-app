import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export default function MonthCalendar({ sets, onSelectSet }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const byDate = useMemo(() => {
    const map = new Map();
    for (const set of sets) {
      if (!set.date) continue;
      if (!map.has(set.date)) map.set(set.date, []);
      map.get(set.date).push(set);
    }
    return map;
  }, [sets]);

  const todayIso = toIso(new Date());

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    // Lundi = 0 ... Dimanche = 6
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      list.push({ iso: toIso(date), day });
    }
    return list;
  }, [cursor]);

  const [selectedIso, setSelectedIso] = useState(null);
  const selectedSets = selectedIso ? byDate.get(selectedIso) || [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          className="p-1.5 rounded-full text-ink-soft hover:bg-surface"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display font-semibold text-ink capitalize">
          {cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          className="p-1.5 rounded-full text-ink-soft hover:bg-surface"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const daySets = byDate.get(cell.iso) || [];
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === selectedIso;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => (daySets.length ? setSelectedIso(isSelected ? null : cell.iso) : null)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-colors ${
                isSelected
                  ? "bg-brand-blue text-white font-semibold"
                  : isToday
                    ? "bg-brand-blue/10 text-brand-blue font-semibold"
                    : daySets.length
                      ? "bg-surface border border-border text-ink hover:border-brand-blue/40"
                      : "text-muted"
              }`}
            >
              {cell.day}
              {daySets.length > 0 && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-brand-teal"}`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedSets.length > 0 && (
        <div className="mt-3 space-y-1.5 animate-fade-up">
          {selectedSets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelectSet(set)}
              className="w-full text-left bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink hover:border-brand-blue/40 transition-colors"
            >
              {set.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
