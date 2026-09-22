import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Star,
  ListMusic,
  Music2,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Sparkles,
  CloudOff,
  Cloud,
  RefreshCw,
  X,
  Rocket,
} from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import logo from "../assets/logo.png";
import { getSongs, getSets, getAllPerformances, onDataChange } from "../lib/storage.js";
import { formatDateLong } from "../lib/share.js";
import { getSyncStatus, onSyncStatusChange } from "../lib/sync.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

const SYNC_LABEL = {
  disabled: { label: "Local uniquement", icon: CloudOff, tone: "text-muted" },
  offline: { label: "Hors-ligne", icon: CloudOff, tone: "text-muted" },
  idle: { label: "Local uniquement", icon: CloudOff, tone: "text-muted" },
  syncing: { label: "Synchronisation…", icon: RefreshCw, tone: "text-brand-blue" },
  synced: { label: "Synchronisé", icon: Cloud, tone: "text-brand-teal" },
  error: { label: "Erreur de sync", icon: CloudOff, tone: "text-danger" },
};

export default function Home() {
  const [songs, setSongs] = useState(() => getSongs());
  const [sets, setSets] = useState(() => getSets());
  const [query, setQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  useEffect(() => onDataChange(() => {
    setSongs(getSongs());
    setSets(getSets());
  }), []);

  useEffect(() => onSyncStatusChange(setSyncStatus), []);

  const todayIso = new Date().toISOString().slice(0, 10);

  const upcomingSet = useMemo(
    () => sets.filter((s) => s.date && s.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))[0],
    [sets, todayIso]
  );
  const fallbackSet = upcomingSet ? null : sets[0];
  const highlightSet = upcomingSet || fallbackSet;

  const favorites = useMemo(() => songs.filter((s) => s.favorite).slice(0, 8), [songs]);

  const recentSongs = useMemo(
    () => [...songs].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5),
    [songs]
  );

  const topSong = useMemo(() => {
    const counts = new Map();
    for (const p of getAllPerformances()) counts.set(p.songId, (counts.get(p.songId) || 0) + 1);
    let best = null;
    for (const song of songs) {
      const count = counts.get(song.id) || 0;
      if (count > 0 && (!best || count > best.count)) best = { song, count };
    }
    return best;
  }, [songs]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matchedSongs = songs
      .filter((s) => s.title.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({ type: "chant", id: s.id, label: s.title, hint: s.category }));
    const matchedSets = sets
      .filter((s) => s.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((s) => ({ type: "liste", id: s.id, label: s.title, hint: s.date ? formatDateLong(s.date) : null }));
    return [...matchedSongs, ...matchedSets];
  }, [songs, sets, query]);

  const sync = SYNC_LABEL[syncStatus] || SYNC_LABEL.disabled;
  const SyncIcon = sync.icon;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
          <img src={logo} alt="" className="h-9 w-9 object-contain shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-lg leading-tight text-ink truncate">{greeting()}</h1>
            <p className="text-xs text-muted truncate capitalize">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Link
            to="/plus"
            className={`shrink-0 flex items-center gap-1 text-[11px] font-medium ${sync.tone}`}
            title="Voir l'état de la synchronisation"
          >
            <SyncIcon size={13} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            {sync.label}
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-6">
        {/* Recherche rapide */}
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un chant, une liste…"
            className="w-full bg-surface border border-border rounded-2xl pl-10 pr-9 py-3 text-sm text-ink placeholder:text-muted focus:border-brand-blue outline-none shadow-card transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Effacer"
            >
              <X size={16} />
            </button>
          )}

          {searchResults && (
            <div className="absolute inset-x-0 top-full mt-2 bg-surface border border-border rounded-2xl shadow-card overflow-hidden z-10">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted px-4 py-3">Aucun résultat pour « {query} ».</p>
              ) : (
                searchResults.map((r) => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    to={r.type === "chant" ? `/chants/${r.id}` : `/listes/${r.id}`}
                    onClick={() => setQuery("")}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-paper border-b border-border last:border-0"
                  >
                    {r.type === "chant" ? (
                      <Music2 size={15} className="text-brand-blue shrink-0" />
                    ) : (
                      <ListMusic size={15} className="text-brand-teal shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink truncate">{r.label}</span>
                      {r.hint && <span className="block text-xs text-muted truncate">{r.hint}</span>}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bannière précommande v1.0.0 */}
        <Link
          to="/precommande"
          className="flex items-center gap-3 bg-gradient-to-r from-brand-blue to-brand-teal text-white rounded-2xl px-4 py-3.5 shadow-fab active:scale-[0.98] transition-transform"
        >
          <Rocket size={18} className="shrink-0" />
          <span className="text-sm font-medium flex-1">La version 1.0.0 arrive — précommandez-la</span>
          <ChevronRight size={16} className="shrink-0" />
        </Link>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/chants/nouveau"
            className="flex items-center gap-2.5 bg-brand-blue text-white rounded-2xl px-4 py-3.5 shadow-fab active:scale-[0.98] transition-transform"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Nouveau chant</span>
          </Link>
          <Link
            to="/listes/nouvelle"
            className="flex items-center gap-2.5 bg-brand-teal text-white rounded-2xl px-4 py-3.5 shadow-fab active:scale-[0.98] transition-transform"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Nouvelle liste</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile icon={<Music2 size={16} />} value={songs.length} label="Chants" to="/chants" />
          <StatTile icon={<ListMusic size={16} />} value={sets.length} label="Listes" to="/listes" />
          <StatTile
            icon={<TrendingUp size={16} />}
            value={topSong ? topSong.count : "—"}
            label={topSong ? topSong.song.title : "Top chant"}
            to={topSong ? `/chants/${topSong.song.id}` : undefined}
            small
          />
        </div>

        {/* Prochaine / dernière liste */}
        {highlightSet && (
          <section className="animate-fade-up">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
              {upcomingSet ? "Prochaine liste" : "Dernière liste"}
            </h2>
            <Link
              to={`/listes/${highlightSet.id}`}
              className="group flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors"
            >
              <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal">
                <ListMusic size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-ink truncate">{highlightSet.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted truncate">
                  {highlightSet.date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} /> {formatDateLong(highlightSet.date)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-border group-hover:text-brand-blue shrink-0 transition-colors" />
            </Link>
          </section>
        )}

        {/* Favoris */}
        {favorites.length > 0 && (
          <section className="animate-fade-up">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
              <Star size={13} className="text-[#E8A23D]" fill="currentColor" /> Favoris
            </h2>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
              {favorites.map((song) => (
                <Link
                  key={song.id}
                  to={`/chants/${song.id}`}
                  className="shrink-0 w-40 snap-start bg-surface border border-border rounded-2xl px-3.5 py-3 shadow-card hover:border-brand-blue/40 transition-colors"
                >
                  <p className="font-display font-semibold text-sm text-ink line-clamp-2 leading-snug">{song.title}</p>
                  {song.category && <p className="text-xs text-muted truncate mt-1">{song.category}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Derniers chants ajoutés */}
        {recentSongs.length > 0 && (
          <section className="animate-fade-up">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
              <Sparkles size={13} /> Ajoutés récemment
            </h2>
            <div className="space-y-2">
              {recentSongs.map((song) => (
                <Link
                  key={song.id}
                  to={`/chants/${song.id}`}
                  className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3 shadow-card hover:border-brand-blue/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-medium text-sm text-ink truncate">{song.title}</p>
                    {song.category && <p className="text-xs text-muted truncate">{song.category}</p>}
                  </div>
                  <ChevronRight size={16} className="text-border shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {songs.length === 0 && (
          <div className="flex flex-col items-center text-center px-8 py-10 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-card">
              <Music2 size={26} />
            </div>
            <p className="font-display font-semibold text-ink mb-1">Bienvenue sur Sing Out</p>
            <p className="text-sm text-muted max-w-xs mb-5">
              Commencez par ajouter votre premier chant, puis regroupez-le dans une liste pour votre prochain culte.
            </p>
            <Link
              to="/chants/nouveau"
              className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-fab"
            >
              <Plus size={16} /> Ajouter un chant
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatTile({ icon, value, label, to, small }) {
  const content = (
    <div className="bg-surface border border-border rounded-2xl px-3 py-3 shadow-card h-full flex flex-col gap-1.5">
      <span className="text-brand-blue">{icon}</span>
      <span className="font-display font-bold text-lg text-ink leading-none">{value}</span>
      <span className={`text-muted leading-snug ${small ? "text-[11px] line-clamp-2" : "text-xs"}`}>{label}</span>
    </div>
  );
  return to ? (
    <Link to={to} className="hover:opacity-90 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
}
