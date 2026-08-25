import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { getSong, saveSong, newId } from "../lib/storage.js";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";

const CATEGORY_SUGGESTIONS = [
  "Début de culte",
  "Recueillement",
  "Louange",
  "Sainte Cène",
  "Animation",
  "Offrande",
  "Envoi",
];

export const KEY_SUGGESTIONS = [
  "Do", "Do#", "Ré", "Ré#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si",
  "Do m", "Ré m", "Mi m", "Fa m", "Sol m", "La m", "Si m",
];

function emptyVerse() {
  return { id: newId(), label: "", text: "" };
}

function blankSong() {
  return { title: "", category: "", originalKey: "", youtubeUrl: "", notes: "", tags: [], chords: "", lyrics: [emptyVerse()] };
}

export default function SongForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const existing = editing ? getSong(id) : null;
  const { allowed: canUsePlusFeatures } = useAccess("plus");

  const [song, setSong] = useState(() => {
    if (existing) {
      return {
        ...existing,
        originalKey: existing.originalKey || "",
        tags: existing.tags || [],
        chords: existing.chords || "",
        lyrics: existing.lyrics?.length ? existing.lyrics : [emptyVerse()],
      };
    }
    return blankSong();
  });
  const [tagsText, setTagsText] = useState(() => (existing?.tags || []).join(", "));
  const [error, setError] = useState("");

  if (editing && !existing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-ink font-medium mb-3">Ce chant n'existe plus.</p>
        <button onClick={() => navigate("/")} className="text-brand-blue text-sm font-medium">
          Retour aux chants
        </button>
      </div>
    );
  }

  const updateVerse = (vid, patch) => {
    setSong((s) => ({
      ...s,
      lyrics: s.lyrics.map((v) => (v.id === vid ? { ...v, ...patch } : v)),
    }));
  };

  const addVerse = () => {
    setSong((s) => ({ ...s, lyrics: [...s.lyrics, emptyVerse()] }));
  };

  const removeVerse = (vid) => {
    setSong((s) => ({ ...s, lyrics: s.lyrics.filter((v) => v.id !== vid) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!song.title.trim()) {
      setError("Donnez un titre à ce chant.");
      return;
    }
    const saved = saveSong({
      ...song,
      title: song.title.trim(),
      category: song.category.trim(),
      originalKey: song.originalKey?.trim() || "",
      youtubeUrl: song.youtubeUrl.trim(),
      notes: song.notes?.trim() || "",
      tags: canUsePlusFeatures
        ? tagsText.split(",").map((t) => t.trim()).filter(Boolean)
        : song.tags || [],
      chords: canUsePlusFeatures ? song.chords?.trim() || "" : song.chords || "",
      lyrics: song.lyrics
        .map((v) => ({ ...v, label: v.label.trim(), text: v.text }))
        .filter((v) => v.text?.trim() || v.label),
    });
    navigate(`/chants/${saved.id}`, { replace: true });
  };

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">
            {editing ? "Modifier le chant" : "Nouveau chant"}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 pt-5 space-y-5">
        <Field label="Titre">
          <input
            autoFocus
            value={song.title}
            onChange={(e) => setSong((s) => ({ ...s, title: e.target.value }))}
            placeholder="Ex. Ouvre mes yeux Saint-Esprit"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie / moment">
            <input
              value={song.category}
              onChange={(e) => setSong((s) => ({ ...s, category: e.target.value }))}
              placeholder="Ex. Recueillement"
              list="category-suggestions"
              className="input"
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Gamme originelle">
            <input
              value={song.originalKey}
              onChange={(e) => setSong((s) => ({ ...s, originalKey: e.target.value }))}
              placeholder="Ex. Sol"
              list="key-suggestions"
              className="input"
            />
            <datalist id="key-suggestions">
              {KEY_SUGGESTIONS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Paroles</span>
            <button
              type="button"
              onClick={addVerse}
              className="flex items-center gap-1 text-xs font-medium text-brand-blue"
            >
              <Plus size={14} /> Ajouter un couplet
            </button>
          </div>

          <div className="space-y-3">
            {song.lyrics.map((verse, i) => (
              <div key={verse.id} className="bg-surface border border-border rounded-2xl p-3.5 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={verse.label}
                    onChange={(e) => updateVerse(verse.id, { label: e.target.value })}
                    placeholder={`Étiquette (ex. V${i + 1}, Refrain)`}
                    className="flex-1 text-xs font-semibold uppercase tracking-wide bg-paper border border-border rounded-lg px-2.5 py-1.5 text-ink-soft placeholder:normal-case placeholder:font-normal outline-none focus:border-brand-blue"
                  />
                  {song.lyrics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVerse(verse.id)}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-soft shrink-0"
                      aria-label="Supprimer ce couplet"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <textarea
                  value={verse.text}
                  onChange={(e) => updateVerse(verse.id, { text: e.target.value })}
                  placeholder="Paroles de ce couplet…"
                  rows={4}
                  className="w-full bg-transparent text-sm text-ink placeholder:text-muted outline-none resize-none leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>

        <Field label="Lien vidéo (YouTube, etc.)">
          <input
            value={song.youtubeUrl}
            onChange={(e) => setSong((s) => ({ ...s, youtubeUrl: e.target.value }))}
            placeholder="https://youtu.be/…"
            className="input"
            inputMode="url"
          />
        </Field>

        {canUsePlusFeatures ? (
          <>
            <Field label="Étiquettes (séparées par des virgules)">
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Ex. rapide, louange, enfants"
                className="input"
              />
            </Field>
            <Field label="Accords (facultatif)">
              <textarea
                value={song.chords}
                onChange={(e) => setSong((s) => ({ ...s, chords: e.target.value }))}
                placeholder={"Ex. G - D - Em - C\n(un accord par ligne ou par mesure, comme vous préférez)"}
                rows={3}
                className="input font-mono resize-none"
              />
            </Field>
          </>
        ) : (
          <AccessGate
            level="plus"
            compact
            hint="Étiquettes et accords sont réservés aux Membres Plus/Pro."
          />
        )}

        <Field label="Notes (facultatif)">
          <textarea
            value={song.notes}
            onChange={(e) => setSong((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Style musical, tonalité, indications pour les musiciens…"
            rows={2}
            className="input resize-none"
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
        >
          <Check size={18} />
          {editing ? "Enregistrer les modifications" : "Enregistrer le chant"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">{label}</span>
      {children}
    </label>
  );
}
