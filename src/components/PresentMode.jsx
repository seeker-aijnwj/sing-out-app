import { useEffect, useState } from "react";
import { X, Minus, Plus, Music4 } from "lucide-react";

const SIZE_KEY = "singout:presentFontSize";
const MIN_SIZE = 18;
const MAX_SIZE = 44;
const DEFAULT_SIZE = 26;

function readSize() {
  const stored = Number(localStorage.getItem(SIZE_KEY));
  return stored >= MIN_SIZE && stored <= MAX_SIZE ? stored : DEFAULT_SIZE;
}

export default function PresentMode({ song, onClose }) {
  const [fontSize, setFontSize] = useState(readSize);

  useEffect(() => {
    localStorage.setItem(SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const verses = (song.lyrics || []).filter((v) => v.text?.trim());

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="no-print flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Fermer le mode présentation">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-ink truncate">{song.title}</p>
          {song.originalKey && (
            <p className="flex items-center gap-1 text-xs text-brand-teal font-medium">
              <Music4 size={11} /> {song.originalKey}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 bg-surface border border-border rounded-full">
          <button
            onClick={() => setFontSize((s) => Math.max(MIN_SIZE, s - 2))}
            className="p-2 text-ink-soft disabled:opacity-30"
            disabled={fontSize <= MIN_SIZE}
            aria-label="Réduire le texte"
          >
            <Minus size={16} />
          </button>
          <span className="text-xs text-muted w-6 text-center select-none">Aa</span>
          <button
            onClick={() => setFontSize((s) => Math.min(MAX_SIZE, s + 2))}
            className="p-2 text-ink-soft disabled:opacity-30"
            disabled={fontSize >= MAX_SIZE}
            aria-label="Agrandir le texte"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-10">
          {verses.length === 0 ? (
            <p className="text-center text-muted" style={{ fontSize }}>
              Aucune parole enregistrée pour ce chant.
            </p>
          ) : (
            verses.map((verse) => (
              <div key={verse.id}>
                {verse.label && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal mb-2 text-center">
                    {verse.label}
                  </p>
                )}
                <p
                  className="font-display font-medium text-ink text-center whitespace-pre-line"
                  style={{ fontSize, lineHeight: 1.5 }}
                >
                  {verse.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
