import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { register } from "../lib/auth.js";

const DEPARTEMENT_SUGGESTIONS = ["Louange", "Musique", "Technique", "Accueil", "Enfants", "Jeunesse", "Intercession"];

const emptyForm = {
  email: "",
  password: "",
  prenom: "",
  nom: "",
  contact: "",
  assemblee: "",
  departement: "",
  rolePrecis: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      register(form);
      navigate("/compte", { replace: true });
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
          <p className="flex-1 font-display font-semibold text-ink px-1">Devenir membre</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        <p className="text-sm text-muted mb-5">
          L'inscription de base est gratuite et débloque les listes avancées (modèles, calendrier, impression…) et les
          statistiques. Vous pourrez ensuite demander à passer Membre Plus ou Pro pour accéder à davantage de
          fonctionnalités.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <input required value={form.prenom} onChange={set("prenom")} className="input" />
            </Field>
            <Field label="Nom">
              <input required value={form.nom} onChange={set("nom")} className="input" />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" required value={form.email} onChange={set("email")} placeholder="vous@exemple.com" className="input" />
          </Field>

          <Field label="Mot de passe">
            <input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="6 caractères minimum" className="input" />
          </Field>

          <Field label="Contact (téléphone / WhatsApp)">
            <input required value={form.contact} onChange={set("contact")} placeholder="+225 07 00 00 00 00" className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Assemblée">
              <input required value={form.assemblee} onChange={set("assemblee")} placeholder="Ex. Assemblée Centrale" className="input" />
            </Field>
            <Field label="Département">
              <input
                required
                value={form.departement}
                onChange={set("departement")}
                placeholder="Ex. Louange"
                list="departement-suggestions"
                className="input"
              />
              <datalist id="departement-suggestions">
                {DEPARTEMENT_SUGGESTIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Rôle précis">
            <input required value={form.rolePrecis} onChange={set("rolePrecis")} placeholder="Ex. Choriste, lead vocal, chef de chœur…" className="input" />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
          >
            <UserPlus size={18} />
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-5">
          Déjà membre ?{" "}
          <Link to="/connexion" className="text-brand-blue font-medium">
            Se connecter
          </Link>
        </p>
      </main>
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
