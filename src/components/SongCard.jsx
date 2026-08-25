import { Link } from "react-router-dom";
import { ChevronRight, Video, Star } from "lucide-react";
import { toggleFavorite } from "../lib/storage.js";

const PALETTE = ["bg-brand-blue", "bg-brand-teal", "bg-[#E8A23D]", "bg-[#B45CD6]", "bg-[#DC4C40]"];

function colorFor(category) {
  if (!category) return "bg-muted";
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

export default function SongCard({ song }) {
  return (
    <Link
      to={`/chants/${song.id}`}
      className="group flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors"
    >
      <span className={`shrink-0 w-2 h-2 rounded-full ${colorFor(song.category)}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-ink truncate">{song.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {song.category && <p className="text-xs text-muted truncate">{song.category}</p>}
          {song.youtubeUrl && <Video size={13} className="text-muted shrink-0" />}
        </div>
      </div>
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
      <ChevronRight size={18} className="text-border group-hover:text-brand-blue shrink-0 transition-colors" />
    </Link>
  );
}
