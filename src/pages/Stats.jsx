import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic2, Music4, Clock, TrendingUp } from "lucide-react";
import { getSongs, getAllPerformances } from "../lib/storage.js";
import { formatDateLong } from "../lib/share.js";
import AccessGate from "../components/AccessGate.jsx";

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

const TONE_CLASSES = {
  blue: "bg-brand-blue",
  teal: "bg-brand-teal",
  gold: "bg-[#E8A23D]",
};

function Bar({ label, count, max, tone = "blue", onClick }) {
  const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className="w-full text-left">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-ink font-medium truncate pr-2">{label}</span>
        <span className="text-muted shrink-0">{count}×</span>
      </div>
      <div className="h-2 rounded-full bg-paper overflow-hidden">
        <div className={`h-full rounded-full ${TONE_CLASSES[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </Comp>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const songs = getSongs();
  const performances = useMemo(() => getAllPerformances(), []);

  const leadStats = useMemo(() => {
    const map = new Map();
    for (const p of performances) {
      if (!p.lead) continue;
      map.set(p.lead, (map.get(p.lead) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [performances]);

  const keyStats = useMemo(() => {
    const map = new Map();
    for (const p of performances) {
      if (!p.key) continue;
      map.set(p.key, (map.get(p.key) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [performances]);

  const topSongs = useMemo(() => {
    const map = new Map();
    for (const p of performances) map.set(p.songId, (map.get(p.songId) || 0) + 1);
    return [...map.entries()]
      .map(([songId, count]) => ({ song: songs.find((s) => s.id === songId), count }))
      .filter((x) => x.song)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [performances, songs]);

  const forgottenSongs = useMemo(() => {
    const lastUsed = new Map();
    for (const p of performances) {
      if (!p.date) continue;
      if (!lastUsed.has(p.songId) || p.date > lastUsed.get(p.songId)) lastUsed.set(p.songId, p.date);
    }
    return songs
      .map((s) => ({ song: s, lastUsed: lastUsed.get(s.id) || null, days: daysSince(lastUsed.get(s.id)) }))
      .filter((x) => x.days === null || x.days >= 60)
      .sort((a, b) => {
        if (a.days === null && b.days === null) return 0;
        if (a.days === null) return -1;
        if (b.days === null) return 1;
        return b.days - a.days;
      })
      .slice(0, 10);
  }, [performances, songs]);

  const maxLead = leadStats[0]?.[1] || 0;
  const maxKey = keyStats[0]?.[1] || 0;
  const maxSong = topSongs[0]?.count || 0;

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Statistiques</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-8">
        <AccessGate
          level="member"
          title="Statistiques réservées aux membres"
          hint="Créez un compte gratuit et connectez-vous pour suivre vos statistiques (chants les plus interprétés, leads, gammes, chants oubliés)."
        >
        {performances.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-card">
              <TrendingUp size={24} />
            </div>
            <p className="font-display font-semibold text-ink mb-1">Pas encore de données</p>
            <p className="text-sm text-muted">
              Ajoutez des chants à vos listes avec un lead et une gamme pour voir apparaître des statistiques ici.
            </p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-3 px-1">
                <TrendingUp size={13} /> Chants les plus interprétés
              </h2>
              <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 space-y-3.5">
                {topSongs.map(({ song, count }) => (
                  <Bar
                    key={song.id}
                    label={song.title}
                    count={count}
                    max={maxSong}
                    tone="blue"
                    onClick={() => navigate(`/chants/${song.id}`)}
                  />
                ))}
              </div>
            </section>

            {leadStats.length > 0 && (
              <section>
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-3 px-1">
                  <Mic2 size={13} /> Leads
                </h2>
                <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 space-y-3.5">
                  {leadStats.map(([lead, count]) => (
                    <Bar key={lead} label={lead} count={count} max={maxLead} tone="teal" />
                  ))}
                </div>
              </section>
            )}

            {keyStats.length > 0 && (
              <section>
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-3 px-1">
                  <Music4 size={13} /> Gammes les plus utilisées
                </h2>
                <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 space-y-3.5">
                  {keyStats.map(([key, count]) => (
                    <Bar key={key} label={key} count={count} max={maxKey} tone="gold" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {forgottenSongs.length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-3 px-1">
              <Clock size={13} /> Chants oubliés
            </h2>
            <p className="text-xs text-muted mb-2.5 px-1">
              Jamais interprétés, ou pas repris depuis au moins 60 jours.
            </p>
            <div className="space-y-2">
              {forgottenSongs.map(({ song, lastUsed, days }) => (
                <Link
                  key={song.id}
                  to={`/chants/${song.id}`}
                  className="flex items-center justify-between gap-2 bg-surface border border-border rounded-2xl px-4 py-3 shadow-card hover:border-brand-blue/40 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block font-display font-medium text-sm text-ink truncate">{song.title}</span>
                    {song.category && <span className="block text-xs text-muted truncate">{song.category}</span>}
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {lastUsed ? `Depuis le ${formatDateLong(lastUsed)}` : "Jamais chanté"}
                    {days !== null && days !== Infinity ? ` · ${days} j` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        </AccessGate>
      </main>
    </div>
  );
}
