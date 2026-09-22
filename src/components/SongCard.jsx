import { Link } from "react-router-dom";
import { ChevronRight, Video, Star, Feather, Check } from "lucide-react";
import { toggleFavorite } from "../lib/storage.js";

const PALETTE = ["bg-brand-blue", "bg-brand-teal", "bg-[#E8A23D]", "bg-[#B45CD6]", "bg-[#DC4C40]"];

function colorFor(category) {
  if (!category) return "bg-muted";
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

export default function SongCard({ song, selectionMode = false, selected = false, onToggleSelect }) {
  const content = (
    <>
      {selectionMode ? (
        <span
          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected ? "bg-brand-blue border-brand-blue text-white" : "border-border text-transparent"
          }`}
          aria-hidden
        >
          <Check size={12} />
        </span>
      ) : (
        <span className={`shrink-0 w-2 h-2 rounded-full ${colorFor(song.category)}`} aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-ink truncate flex items-center gap-1.5">
          {song.title}
          {song.draft && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted bg-paper border border-border rounded-full px-1.5 py-0.5">
              Brouillon
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {song.category && <p className="text-xs text-muted truncate">{song.category}</p>}
          {song.isComposition && (
            <span title="Composition originale" className="shrink-0 text-brand-blue">
              <Feather size={12} />
            </span>
          )}
          {song.language && song.language !== "Français" && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-teal bg-brand-teal/10 rounded-full px-1.5 py-0.5 shrink-0">
              {song.language}
            </span>
          )}
          {song.youtubeUrl && <Video size={13} className="text-muted shrink-0" />}
        </div>
      </div>
      {!selectionMode && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(song.id);
          }}
          className={`shrink-0 p-1 -m-1 ${song.favorite ? "text-[#E8A23D]" : "text-border hover:text-muted"}`}
          aria-label={song.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star size={17} fill={song.favorite ? "currentColor" : "none"} />
        </button>
      )}
      {!selectionMode && (
        <ChevronRight size={18} className="text-border group-hover:text-brand-blue shrink-0 transition-colors" />
      )}
    </>
  );

  const className =
    "group flex items-center gap-3 bg-surface rounded-2xl border px-4 py-3.5 shadow-card transition-colors w-full text-left " +
    (selected ? "border-brand-blue/60 ring-1 ring-brand-blue/30" : "border-border hover:border-brand-blue/40");

  if (selectionMode) {
    return (
      <button type="button" onClick={() => onToggleSelect?.(song.id)} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/chants/${song.id}`} className={className}>
      {content}
    </Link>
  );
}
