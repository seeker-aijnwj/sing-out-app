import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Share2, CalendarDays, Music2, Mic2, Music4, Copy, Printer, Presentation, UserRound } from "lucide-react";
import { getSet, getSongs, deleteSet, duplicateSet, onDataChange } from "../lib/storage.js";
import { formatSetText, formatDateLong } from "../lib/share.js";
import ShareSheet from "../components/ShareSheet.jsx";
import { useAccess } from "../components/AccessGate.jsx";

export default function SetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(() => getSet(id));
  const [songs, setSongs] = useState(() => getSongs());
  const songsById = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);
  const { allowed: canUseMemberFeatures } = useAccess("member");

  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => onDataChange(() => {
    setSet(getSet(id));
    setSongs(getSongs());
  }), [id]);

  if (!set) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-ink font-medium mb-3">Cette liste n'existe plus.</p>
        <Link to="/listes" className="text-brand-blue text-sm font-medium">Retour aux listes</Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteSet(set.id);
    navigate("/listes", { replace: true });
  };

  const handleDuplicate = () => {
    const copy = duplicateSet(set.id);
    if (copy) navigate(`/listes/${copy.id}/modifier`);
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_#fff_0%,_var(--color-paper)_55%)] pb-10">
      <header className="no-print sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 text-sm font-medium text-muted truncate px-1">Liste de chants</p>
          {canUseMemberFeatures && (
            <button onClick={() => window.print()} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Imprimer">
              <Printer size={18} />
            </button>
          )}
          <Link to={`/listes/${set.id}/modifier`} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Modifier">
            <Pencil size={18} />
          </Link>
          {canUseMemberFeatures && (
            <button onClick={handleDuplicate} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Dupliquer">
              <Copy size={18} />
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-full text-danger hover:bg-danger-soft"
            aria-label="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div id="print-area" className="bg-surface border border-border rounded-2xl shadow-card px-5 py-5 animate-fade-up">
          <h1 className="font-display font-extrabold text-lg text-ink uppercase leading-snug">{set.title}</h1>
          {set.date && (
            <p className="flex items-center gap-1.5 text-sm text-muted mt-1.5 uppercase tracking-wide">
              <CalendarDays size={14} /> {formatDateLong(set.date)}
            </p>
          )}

          <div className="mt-5 space-y-5">
            {set.moments.map((moment) => (
              <section key={moment.id}>
                <h2 className="font-display font-bold text-ink mb-2">{moment.name}</h2>
                <ol className={`space-y-1.5 ${moment.numbered ? "list-decimal list-inside" : ""}`}>
                  {moment.items.map((item) => {
                    if (item.songId) {
                      const song = songsById[item.songId];
                      if (!song) return null;
                      return (
                        <li key={item.id} className="text-ink-soft">
                          <span className="flex items-center gap-1.5">
                            <Link to={`/chants/${song.id}`} className="text-brand-blue font-medium hover:underline underline-offset-2">
                              {song.title}
                            </Link>
                            <Link
                              to={`/chants/${song.id}`}
                              state={{ present: true }}
                              className="no-print p-1 -m-1 text-muted hover:text-brand-blue shrink-0"
                              aria-label={`Présenter ${song.title}`}
                              title="Mode présentation"
                            >
                              <Presentation size={13} />
                            </Link>
                          </span>
                          {(item.lead || item.key) && (
                            <span className="flex items-center gap-3 mt-0.5">
                              {item.lead && (
                                <span className="flex items-center gap-1 text-xs text-muted">
                                  <Mic2 size={12} /> {item.lead}
                                </span>
                              )}
                              {item.key && (
                                <span className="flex items-center gap-1 text-xs text-muted">
                                  <Music4 size={12} /> {item.key}
                                </span>
                              )}
                            </span>
                          )}
                          {song.youtubeUrl && (
                            <a
                              href={song.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs text-muted break-all hover:underline mt-0.5"
                            >
                              {song.youtubeUrl}
                            </a>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={item.id} className="text-ink-soft">
                        {item.text}
                      </li>
                    );
                  })}
                  {moment.items.length === 0 && <li className="text-sm text-muted italic list-none">Aucun élément.</li>}
                </ol>
              </section>
            ))}
          </div>
        </div>

        {set.createdByName && (
          <p className="no-print flex items-center gap-1.5 text-xs text-muted mt-2.5 px-1">
            <UserRound size={12} /> Ajoutée par {set.createdByName}
          </p>
        )}

        <button
          onClick={() => setShareOpen(true)}
          className="no-print mt-6 w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
        >
          <Share2 size={18} />
          Partager cette liste
        </button>

        {songs.length > 0 && (
          <Link
            to={`/listes/${set.id}/modifier`}
            className="no-print mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium text-ink-soft"
          >
            <Music2 size={14} /> Ajouter ou réorganiser des chants
          </Link>
        )}
      </main>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={set.title}
        text={formatSetText(set, songsById)}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setConfirmDelete(false)} aria-label="Fermer" />
          <div className="relative bg-surface rounded-2xl shadow-card p-5 w-full max-w-xs animate-fade-up">
            <p className="font-display font-semibold text-ink mb-1">Supprimer cette liste ?</p>
            <p className="text-sm text-muted mb-4">
              « {set.title} » sera définitivement supprimée. Les chants eux-mêmes ne seront pas affectés.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-ink-soft bg-paper hover:bg-border"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-danger hover:opacity-90"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
