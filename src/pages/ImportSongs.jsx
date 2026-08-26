import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, FileJson, Check, Download } from "lucide-react";
import { importSongs } from "../lib/storage.js";
import AccessGate, { useAccess } from "../components/AccessGate.jsx";

export default function ImportSongs() {
  const navigate = useNavigate();
  const { allowed } = useAccess("plus");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [loadingExample, setLoadingExample] = useState(false);

  const parsed = (() => {
    if (!raw.trim()) return null;
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  })();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    const text = await file.text();
    setRaw(text);
  };

  const loadExample = async () => {
    setError("");
    setResult(null);
    setLoadingExample(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/alpha-chants.json`);
      if (!res.ok) throw new Error("Impossible de charger le fichier d'exemple.");
      const text = await res.text();
      setRaw(text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingExample(false);
    }
  };

  const handleImport = () => {
    setError("");
    if (!parsed) {
      setError("Le contenu collé n'est pas un JSON valide (un tableau de chants est attendu).");
      return;
    }
    try {
      const res = importSongs(parsed);
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Importer des chants</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {!allowed ? (
          <AccessGate
            level="plus"
            title="Import réservé aux Membres Plus/Pro"
            hint="Connectez-vous avec un compte Membre Plus, Pro ou Admin pour importer des chants en masse."
          />
        ) : (
          <>
            <p className="text-sm text-muted mb-5">
              Collez un JSON (tableau de chants), importez un fichier <code className="text-xs bg-surface border border-border rounded px-1 py-0.5">.json</code>,
              ou partez du fichier d'exemple préparé pour la version alpha — une dizaine de chants chrétiens connus (liens
              vidéo réels), sans les paroles : à vous de les compléter, pour respecter les droits d'auteur.
            </p>

            <button
              onClick={loadExample}
              disabled={loadingExample}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-brand-teal bg-brand-teal/5 rounded-2xl py-3 mb-3 disabled:opacity-50"
            >
              <Download size={16} /> {loadingExample ? "Chargement…" : "Charger l'exemple alpha (10 chants)"}
            </button>

            <label className="flex items-center justify-center gap-2 text-sm font-medium text-ink-soft border border-dashed border-border rounded-2xl py-3 mb-4 cursor-pointer">
              <Upload size={16} /> Choisir un fichier .json
              <input type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
            </label>

            <label className="block mb-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">
                <FileJson size={13} /> Contenu JSON
              </span>
              <textarea
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  setResult(null);
                }}
                placeholder='[{"title": "Mon chant", "category": "Louange", "lyrics": [{"label": "V1", "text": "..."}]}]'
                rows={10}
                className="input font-mono text-xs resize-none"
              />
            </label>

            {raw.trim() && !parsed && (
              <p className="text-sm text-danger mb-3">Ce texte n'est pas un JSON valide (tableau attendu).</p>
            )}
            {parsed && !result && (
              <p className="text-sm text-muted mb-3">{parsed.length} chant{parsed.length > 1 ? "s" : ""} détecté{parsed.length > 1 ? "s" : ""} — prêt à importer.</p>
            )}
            {error && <p className="text-sm text-danger mb-3">{error}</p>}

            {result ? (
              <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 text-center">
                <Check size={22} className="mx-auto text-brand-teal mb-2" />
                <p className="text-sm text-ink font-medium mb-1">
                  {result.imported} chant{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
                </p>
                {result.skipped > 0 && (
                  <p className="text-xs text-muted mb-3">{result.skipped} ignoré{result.skipped > 1 ? "s" : ""} (déjà présent{result.skipped > 1 ? "s" : ""} ou sans titre)</p>
                )}
                <Link to="/chants" className="inline-block text-sm font-medium bg-brand-blue text-white px-4 py-2.5 rounded-xl shadow-fab">
                  Voir mes chants
                </Link>
              </div>
            ) : (
              <button
                onClick={handleImport}
                disabled={!parsed}
                className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                <Upload size={18} /> Importer
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
