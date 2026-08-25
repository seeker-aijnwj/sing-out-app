import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, GripVertical, Music2, Type, Mic2, Music4, LayoutTemplate, Save, Lightbulb } from "lucide-react";
import { getSet, getSongs, saveSet, newId, getTemplates, saveTemplate, getAllPerformances } from "../lib/storage.js";
import { KEY_SUGGESTIONS } from "./SongForm.jsx";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";

const STALE_DAYS = 60;

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function emptyMoment() {
  return { id: newId(), name: "", numbered: false, items: [] };
}

function blankSet() {
  return { title: "Propositions de chants", date: "", moments: [emptyMoment()] };
}

export default function SetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const existing = editing ? getSet(id) : null;
  const songs = getSongs();

  const [set, setSet] = useState(() =>
    existing ? { ...existing, moments: existing.moments?.length ? existing.moments : [emptyMoment()] } : blankSet()
  );
  const [pickerFor, setPickerFor] = useState(null);
  const [error, setError] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const songsById = useMemo(() => Object.fromEntries(songs.map((s) => [s.id, s])), [songs]);
  const { allowed: canUseMemberFeatures } = useAccess("member");
  const templates = canUseMemberFeatures ? getTemplates() : [];

  const lastUsedBySong = useMemo(() => {
    const map = new Map();
    for (const p of getAllPerformances()) {
      if (!p.date) continue;
      if (!map.has(p.songId) || p.date > map.get(p.songId)) map.set(p.songId, p.date);
    }
    return map;
  }, []);

  const rankedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const da = lastUsedBySong.get(a.id);
      const db = lastUsedBySong.get(b.id);
      if (!da && !db) return a.title.localeCompare(b.title, "fr");
      if (!da) return -1;
      if (!db) return 1;
      return da.localeCompare(db);
    });
  }, [songs, lastUsedBySong]);

  if (editing && !existing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-ink font-medium mb-3">Cette liste n'existe plus.</p>
        <button onClick={() => navigate("/listes")} className="text-brand-blue text-sm font-medium">
          Retour aux listes
        </button>
      </div>
    );
  }

  const updateMoment = (mid, patch) => {
    setSet((s) => ({ ...s, moments: s.moments.map((m) => (m.id === mid ? { ...m, ...patch } : m)) }));
  };

  const addMoment = () => setSet((s) => ({ ...s, moments: [...s.moments, emptyMoment()] }));

  const removeMoment = (mid) => setSet((s) => ({ ...s, moments: s.moments.filter((m) => m.id !== mid) }));

  const addSongItem = (mid, songId) => {
    updateMoment(mid, {
      items: [...set.moments.find((m) => m.id === mid).items, { id: newId(), songId }],
    });
    setPickerFor(null);
  };

  const addTextItem = (mid) => {
    updateMoment(mid, {
      items: [...set.moments.find((m) => m.id === mid).items, { id: newId(), text: "" }],
    });
  };

  const updateItem = (mid, iid, patch) => {
    const moment = set.moments.find((m) => m.id === mid);
    updateMoment(mid, { items: moment.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) });
  };

  const removeItem = (mid, iid) => {
    const moment = set.moments.find((m) => m.id === mid);
    updateMoment(mid, { items: moment.items.filter((it) => it.id !== iid) });
  };

  const moveItem = (mid, idx, dir) => {
    const moment = set.moments.find((m) => m.id === mid);
    const items = [...moment.items];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    updateMoment(mid, { items });
  };

  const applyTemplate = (template) => {
    const hasContent = set.moments.some((m) => m.name.trim() || m.items.length);
    if (hasContent && !window.confirm("Remplacer la structure actuelle par ce modèle ? Les chants déjà ajoutés seront perdus.")) {
      return;
    }
    setSet((s) => ({
      ...s,
      moments: template.moments.map((m) => ({ id: newId(), name: m.name, numbered: m.numbered, items: [] })),
    }));
    setTemplatePickerOpen(false);
  };

  const saveAsTemplate = () => {
    const usableMoments = set.moments.filter((m) => m.name.trim());
    if (usableMoments.length === 0) {
      window.alert("Donnez un nom à au moins un moment avant d'enregistrer un modèle.");
      return;
    }
    const name = window.prompt("Nom du modèle (ex. Culte du dimanche)", set.title.trim() || "Mon modèle");
    if (!name?.trim()) return;
    saveTemplate({
      name: name.trim(),
      moments: usableMoments.map((m) => ({ name: m.name.trim(), numbered: m.numbered })),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!set.title.trim()) {
      setError("Donnez un titre à cette liste.");
      return;
    }
    const cleaned = {
      ...set,
      title: set.title.trim(),
      date: set.date,
      moments: set.moments
        .filter((m) => m.name.trim() || m.items.length)
        .map((m) => ({ ...m, name: m.name.trim() || "Sans titre" })),
    };
    const saved = saveSet(cleaned);
    navigate(`/listes/${saved.id}`, { replace: true });
  };

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">
            {editing ? "Modifier la liste" : "Nouvelle liste"}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 pt-5 space-y-5">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Titre</span>
          <input
            autoFocus
            value={set.title}
            onChange={(e) => setSet((s) => ({ ...s, title: e.target.value }))}
            placeholder="Ex. Propositions de chants pour le culte"
            className="input"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Date (facultatif)</span>
          <input
            type="date"
            value={set.date}
            onChange={(e) => setSet((s) => ({ ...s, date: e.target.value }))}
            className="input"
          />
        </label>

        {templates.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setTemplatePickerOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-brand-teal bg-brand-teal/5 rounded-xl py-2.5"
            >
              <LayoutTemplate size={14} /> Charger un modèle de structure
            </button>
            {templatePickerOpen && (
              <div className="mt-1.5 border border-border rounded-xl divide-y divide-border overflow-hidden">
                {templates.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left px-3 py-2.5 text-sm text-ink hover:bg-surface flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{tpl.name}</span>
                    <span className="text-xs text-muted shrink-0">{tpl.moments.length} moment{tpl.moments.length > 1 ? "s" : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!canUseMemberFeatures && (
          <AccessGate level="member" compact hint="Connectez-vous pour utiliser des modèles de structure." />
        )}

        <div className="space-y-4">
          {set.moments.map((moment) => (
            <div key={moment.id} className="bg-surface border border-border rounded-2xl p-3.5 shadow-card space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={moment.name}
                  onChange={(e) => updateMoment(moment.id, { name: e.target.value })}
                  placeholder="Nom du moment (ex. Recueillement)"
                  className="flex-1 font-display font-semibold text-sm bg-paper border border-border rounded-lg px-2.5 py-1.5 text-ink outline-none focus:border-brand-blue"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={moment.numbered}
                    onChange={(e) => updateMoment(moment.id, { numbered: e.target.checked })}
                  />
                  Numéroté
                </label>
                <button
                  type="button"
                  onClick={() => removeMoment(moment.id)}
                  className="p-1.5 rounded-lg text-danger hover:bg-danger-soft shrink-0"
                  aria-label="Supprimer ce moment"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-1.5">
                {moment.items.map((item, idx) => (
                  <div key={item.id} className="bg-paper rounded-xl px-2 py-1.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={14} className="text-border shrink-0" />
                      {item.songId ? (
                        <span className="flex-1 text-sm text-ink truncate flex items-center gap-1.5">
                          <Music2 size={13} className="text-brand-blue shrink-0" />
                          {songsById[item.songId]?.title || "Chant introuvable"}
                        </span>
                      ) : (
                        <input
                          value={item.text || ""}
                          onChange={(e) => updateItem(moment.id, item.id, { text: e.target.value })}
                          placeholder="Texte libre (ex. Selon le message)"
                          className="flex-1 text-sm bg-transparent outline-none text-ink placeholder:text-muted"
                        />
                      )}
                      <button type="button" onClick={() => moveItem(moment.id, idx, -1)} className="p-1 text-muted hover:text-ink disabled:opacity-30" disabled={idx === 0} aria-label="Monter">
                        ↑
                      </button>
                      <button type="button" onClick={() => moveItem(moment.id, idx, 1)} className="p-1 text-muted hover:text-ink disabled:opacity-30" disabled={idx === moment.items.length - 1} aria-label="Descendre">
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(moment.id, item.id)}
                        className="p-1 text-danger hover:bg-danger-soft rounded"
                        aria-label="Retirer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {item.songId && (
                      <div className="flex items-center gap-1.5 pl-[22px]">
                        <div className="relative flex-1">
                          <Mic2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            value={item.lead || ""}
                            onChange={(e) => updateItem(moment.id, item.id, { lead: e.target.value })}
                            placeholder="Lead"
                            className="w-full text-xs bg-surface border border-border rounded-lg pl-6 pr-2 py-1.5 text-ink placeholder:text-muted outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div className="relative flex-1">
                          <Music4 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                          <input
                            value={item.key || ""}
                            onChange={(e) => updateItem(moment.id, item.id, { key: e.target.value })}
                            placeholder="Gamme"
                            list="key-suggestions-set"
                            className="w-full text-xs bg-surface border border-border rounded-lg pl-6 pr-2 py-1.5 text-ink placeholder:text-muted outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerFor(pickerFor === moment.id ? null : moment.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-brand-blue bg-brand-blue/5 rounded-xl py-2"
                >
                  <Music2 size={14} /> Ajouter un chant
                </button>
                <button
                  type="button"
                  onClick={() => addTextItem(moment.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-ink-soft bg-paper rounded-xl py-2"
                >
                  <Type size={14} /> Texte libre
                </button>
              </div>

              {pickerFor === moment.id && (
                <div className="border border-border rounded-xl max-h-56 overflow-y-auto divide-y divide-border">
                  {songs.length === 0 ? (
                    <p className="text-xs text-muted p-3">Aucun chant enregistré pour l'instant.</p>
                  ) : (
                    (canUseMemberFeatures ? rankedSongs : songs).map((song, idx) => {
                      const lastUsed = lastUsedBySong.get(song.id);
                      const stale = !lastUsed || daysSince(lastUsed) >= STALE_DAYS;
                      return (
                        <button
                          type="button"
                          key={song.id}
                          onClick={() => addSongItem(moment.id, song.id)}
                          className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-paper flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="truncate flex items-center gap-1.5">
                              {canUseMemberFeatures && idx < 3 && stale && <Lightbulb size={12} className="text-[#E8A23D] shrink-0" />}
                              <span className="truncate">{song.title}</span>
                            </span>
                            {canUseMemberFeatures && (
                              <span className="block text-xs text-muted truncate">
                                {lastUsed ? `Chanté le ${new Date(lastUsed).toLocaleDateString("fr-FR")}` : "Jamais chanté"}
                              </span>
                            )}
                          </span>
                          {song.category && <span className="text-xs text-muted shrink-0">{song.category}</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <datalist id="key-suggestions-set">
          {KEY_SUGGESTIONS.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={addMoment}
            className="flex items-center justify-center gap-2 text-sm font-medium text-brand-blue border border-dashed border-brand-blue/40 rounded-2xl py-3"
          >
            <Plus size={16} /> Ajouter un moment
          </button>
          <button
            type="button"
            onClick={() => (canUseMemberFeatures ? saveAsTemplate() : navigate("/connexion"))}
            className="flex items-center justify-center gap-2 text-sm font-medium text-ink-soft border border-dashed border-border rounded-2xl py-3 disabled:opacity-50"
          >
            <Save size={16} /> Enregistrer comme modèle
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
        >
          <Check size={18} />
          {editing ? "Enregistrer les modifications" : "Enregistrer la liste"}
        </button>
      </form>
    </div>
  );
}
