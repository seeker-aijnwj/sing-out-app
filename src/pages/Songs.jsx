import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Music2, X, Star, Languages, CheckSquare } from "lucide-react";
import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import SongCard from "../components/SongCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SelectionBar from "../components/SelectionBar.jsx";
import { getSongs, onDataChange, deleteSongs, duplicateSongs, setSongsDraft } from "../lib/storage.js";
import { useAccess } from "../components/AccessGate.jsx";

export default function Songs() {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [language, setLanguage] = useState("Toutes");
  const [songs, setSongs] = useState(() => getSongs());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const { allowed: canUsePlusFeatures } = useAccess("plus");

  useEffect(() => onDataChange(() => setSongs(getSongs())), []);

  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v);
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedIds = useMemo(() => [...selected], [selected]);
  const allSelectedAreDrafts = selectedIds.length > 0 && selectedIds.every((id) => songs.find((s) => s.id === id)?.draft);

  const handleBulkDelete = () => {
    if (!window.confirm(`Supprimer ${selectedIds.length} chant${selectedIds.length > 1 ? "s" : ""} ? Cette action est irréversible.`)) return;
    deleteSongs(selectedIds);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const handleBulkDuplicate = () => {
    duplicateSongs(selectedIds);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const handleBulkDraft = () => {
    setSongsDraft(selectedIds, !allSelectedAreDrafts);
    setSelected(new Set());
    setSelectionMode(false);
  };

  const languages = useMemo(() => {
    const set = new Set(songs.map((s) => s.language?.trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [songs]);

  const scoped = useMemo(() => {
    let list = favoritesOnly ? songs.filter((s) => s.favorite) : songs;
    if (language !== "Toutes") list = list.filter((s) => (s.language || "Français") === language);
    return list;
  }, [songs, favoritesOnly, language]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((s) => {
      if (s.title.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) return true;
      if (s.language?.toLowerCase().includes(q)) return true;
      if (s.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      if (canUsePlusFeatures && s.lyrics?.some((v) => v.text?.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [scoped, query, canUsePlusFeatures]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const key = s.category?.trim() || "Sans catégorie";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [filtered]);

  return (
    <div className="pb-24">
      <Header
        title="Chants"
        subtitle={`${songs.length} chant${songs.length > 1 ? "s" : ""} enregistré${songs.length > 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2 shrink-0">
            {canUsePlusFeatures && songs.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                aria-pressed={selectionMode}
                aria-label="Sélectionner plusieurs chants"
                title="Sélectionner plusieurs chants"
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  selectionMode ? "bg-ink text-white" : "bg-surface border border-border text-ink-soft"
                }`}
              >
                <CheckSquare size={18} />
              </button>
            )}
            <Link
              to="/chants/nouveau"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue text-white shadow-fab active:scale-95 transition-transform"
              aria-label="Ajouter un chant"
            >
              <Plus size={20} />
            </Link>
          </div>
        }
      />

      <main className="max-w-xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={canUsePlusFeatures ? "Rechercher un chant, une catégorie, un mot des paroles…" : "Rechercher un chant, une catégorie…"}
              className="w-full bg-surface border border-border rounded-2xl pl-10 pr-9 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-blue outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label="Effacer la recherche"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            title="Afficher uniquement les favoris"
            className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors ${
              favoritesOnly
                ? "bg-[#E8A23D]/15 border-[#E8A23D]/40 text-[#E8A23D]"
                : "bg-surface border-border text-muted hover:text-ink"
            }`}
          >
            <Star size={18} fill={favoritesOnly ? "currentColor" : "none"} />
          </button>
        </div>

        {languages.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
            <span className="flex items-center gap-1 text-xs text-muted shrink-0">
              <Languages size={13} />
            </span>
            {["Toutes", ...languages].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                  language === lang ? "bg-brand-blue text-white" : "bg-surface border border-border text-ink-soft"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}

        {songs.length === 0 ? (
          <EmptyState
            icon={<Music2 size={26} />}
            title="Aucun chant pour l'instant"
            hint="Ajoutez votre premier chant : titre, paroles, lien vidéo. Il pourra ensuite être partagé ou ajouté à une liste."
            action={
              <Link
                to="/chants/nouveau"
                className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-fab"
              >
                <Plus size={16} /> Ajouter un chant
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={favoritesOnly ? <Star size={22} /> : <Search size={22} />}
            title="Aucun résultat"
            hint={
              query
                ? `Rien ne correspond à « ${query} ».`
                : favoritesOnly
                  ? "Marquez des chants en favoris avec l'étoile pour les retrouver ici."
                  : `Aucun chant en ${language} pour l'instant.`
            }
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([category, items]) => (
              <section key={category} className="animate-fade-up">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
                  {category} · {items.length}
                </h2>
                <div className="space-y-2">
                  {items.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      selectionMode={selectionMode}
                      selected={selected.has(song.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <SelectionBar
        count={selected.size}
        allDrafts={allSelectedAreDrafts}
        onDuplicate={handleBulkDuplicate}
        onToggleDraft={handleBulkDraft}
        onDelete={handleBulkDelete}
        onCancel={toggleSelectionMode}
      />

      <BottomNav />
    </div>
  );
}

