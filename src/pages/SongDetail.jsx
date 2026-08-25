import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Share2, Video, CheckCheck, Music4, Mic2, CalendarDays, History, Star, Presentation, Tag, MessageSquare, UserRound, Send } from "lucide-react";
import { getSong, deleteSong, getSongHistory, toggleFavorite, onDataChange, getComments, addComment, deleteComment } from "../lib/storage.js";
import { formatSongText, formatDateLong } from "../lib/share.js";
import ShareSheet from "../components/ShareSheet.jsx";
import PresentMode from "../components/PresentMode.jsx";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";
import { useCurrentUser } from "../lib/auth.js";

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [song, setSong] = useState(() => getSong(id));
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [presenting, setPresenting] = useState(Boolean(location.state?.present));
  const [comments, setComments] = useState(() => getComments(id));
  const [commentText, setCommentText] = useState("");
  const currentUser = useCurrentUser();
  const { allowed: canUsePlusFeatures } = useAccess("plus");

  useEffect(() => onDataChange(() => {
    setSong(getSong(id));
    setComments(getComments(id));
  }), [id]);

  if (!song) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-ink font-medium mb-3">Ce chant n'existe plus.</p>
        <Link to="/chants" className="text-brand-blue text-sm font-medium">Retour aux chants</Link>
      </div>
    );
  }

  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const history = getSongHistory(song.id);
  const keyCounts = history.reduce((acc, h) => {
    if (!h.key) return acc;
    acc[h.key] = (acc[h.key] || 0) + 1;
    return acc;
  }, {});
  const keySummary = Object.entries(keyCounts).sort((a, b) => b[1] - a[1]);

  const handleDelete = () => {
    deleteSong(song.id);
    navigate("/chants", { replace: true });
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_#fff_0%,_var(--color-paper)_55%)]">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 text-sm font-medium text-muted truncate px-1">
            {song.category || "Chant"}
            {song.originalKey && (
              <span className="ml-2 inline-flex items-center gap-1 text-brand-teal font-semibold">
                <Music4 size={12} /> {song.originalKey}
              </span>
            )}
          </p>
          <button
            onClick={() => toggleFavorite(song.id)}
            className={`p-2 rounded-full hover:bg-surface ${song.favorite ? "text-[#E8A23D]" : "text-ink-soft"}`}
            aria-label={song.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star size={18} fill={song.favorite ? "currentColor" : "none"} />
          </button>
          <Link to={`/chants/${song.id}/modifier`} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Modifier">
            <Pencil size={18} />
          </Link>
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
        <div className="relative animate-fade-up">
          <div className="bubble-tail relative bg-bubble border border-bubble-border rounded-2xl rounded-tl-md px-5 py-4 shadow-bubble ml-2">
            <h1 className="font-display font-bold text-lg text-bubble-accent mb-3 leading-snug">
              Chant : {song.title}
            </h1>

            <div className="space-y-4">
              {song.lyrics
                ?.filter((v) => v.text?.trim())
                .map((verse) => (
                  <div key={verse.id}>
                    {verse.label?.trim() && (
                      <p className="font-semibold text-bubble-accent/80 mb-0.5">[{verse.label.trim()}]</p>
                    )}
                    <p className="text-ink whitespace-pre-line leading-relaxed">{verse.text}</p>
                  </div>
                ))}
              {!song.lyrics?.some((v) => v.text?.trim()) && !song.youtubeUrl && (
                <p className="text-sm text-bubble-accent/70 italic">Aucune parole enregistrée pour ce chant.</p>
              )}
            </div>

            {song.youtubeUrl && (
              <a
                href={song.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 text-sm text-brand-blue font-medium break-all hover:underline"
              >
                <Video size={16} className="shrink-0" />
                {song.youtubeUrl}
              </a>
            )}

            {song.chords?.trim() && (
              <div className="mt-4 border-t border-bubble-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-bubble-accent/70 mb-1">Accords</p>
                <p className="text-sm text-ink font-mono whitespace-pre-line leading-relaxed">{song.chords}</p>
              </div>
            )}

            {song.notes?.trim() && (
              <p className="mt-4 text-sm text-ink-soft border-t border-bubble-border pt-3 whitespace-pre-line">
                {song.notes}
              </p>
            )}

            <div className="flex items-center justify-end gap-1 mt-3 text-[11px] text-bubble-accent/60">
              {time} <CheckCheck size={14} />
            </div>
          </div>
        </div>

        {song.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 px-1">
            {song.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs font-medium text-ink-soft bg-surface border border-border rounded-full px-2.5 py-1">
                <Tag size={11} /> {tag}
              </span>
            ))}
          </div>
        )}

        {song.createdByName && (
          <p className="flex items-center gap-1.5 text-xs text-muted mt-2 px-1">
            <UserRound size={12} /> Ajouté par {song.createdByName}
          </p>
        )}

        <section className="mt-6 animate-fade-up">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <History size={14} /> Historique d'interprétation
            </h2>
            <span className="text-xs font-medium text-ink-soft">
              {history.length === 0
                ? "Jamais interprété"
                : `${history.length} fois`}
            </span>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-card">
              Ce chant n'a encore été ajouté à aucune liste. Ajoutez-le à une liste avec un lead et une gamme pour
              commencer à suivre son historique.
            </p>
          ) : (
            <div className="space-y-2">
              {keySummary.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {keySummary.map(([key, count]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2.5 py-1"
                    >
                      <Music4 size={11} /> {key} · {count}×
                    </span>
                  ))}
                </div>
              )}
              {history.map((h) => (
                <Link
                  key={h.id}
                  to={`/listes/${h.setId}`}
                  className="block bg-surface border border-border rounded-2xl px-4 py-3 shadow-card hover:border-brand-blue/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-semibold text-sm text-ink truncate">{h.setTitle}</p>
                    {h.date && (
                      <span className="flex items-center gap-1 text-xs text-muted shrink-0">
                        <CalendarDays size={12} /> {formatDateLong(h.date)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{h.momentName}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {h.lead && (
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <Mic2 size={12} /> {h.lead}
                      </span>
                    )}
                    {h.key && (
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        <Music4 size={12} /> {h.key}
                      </span>
                    )}
                    {!h.lead && !h.key && <span className="text-xs text-muted italic">Aucun détail renseigné</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 animate-fade-up">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
            <MessageSquare size={14} /> Notes d'équipe
          </h2>
          {canUsePlusFeatures ? (
            <div className="space-y-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-card">
                  Aucune note pour l'instant. Laissez une remarque pour l'équipe (arrangement, tempo, historique…).
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-card">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <UserRound size={12} className="text-brand-blue" /> {c.authorName}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        {currentUser && (currentUser.id === c.authorId || currentUser.isAdmin) && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-danger hover:bg-danger-soft rounded p-0.5"
                            aria-label="Supprimer la note"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-ink-soft whitespace-pre-line">{c.text}</p>
                  </div>
                ))
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  addComment(song.id, commentText);
                  setCommentText("");
                }}
                className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-3 py-2 shadow-card"
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ajouter une note…"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="shrink-0 p-1.5 rounded-full bg-brand-blue text-white disabled:opacity-40"
                  aria-label="Envoyer"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          ) : (
            <AccessGate
              level="plus"
              hint="Les notes d'équipe (arrangement, tempo, remarques...) sont réservées aux Membres Plus/Pro."
            />
          )}
        </section>

        <button
          onClick={() => setPresenting(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-surface border border-border text-ink font-medium py-3.5 rounded-2xl shadow-card active:scale-[0.98] transition-transform"
        >
          <Presentation size={18} />
          Mode présentation
        </button>

        <button
          onClick={() => setShareOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
        >
          <Share2 size={18} />
          Partager ce chant
        </button>
      </main>

      {presenting && <PresentMode song={song} onClose={() => setPresenting(false)} />}

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={song.title}
        text={formatSongText(song)}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setConfirmDelete(false)} aria-label="Fermer" />
          <div className="relative bg-surface rounded-2xl shadow-card p-5 w-full max-w-xs animate-fade-up">
            <p className="font-display font-semibold text-ink mb-1">Supprimer ce chant ?</p>
            <p className="text-sm text-muted mb-4">
              « {song.title} » sera retiré de votre bibliothèque et des listes qui le contiennent.
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
