import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { login } from "../lib/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      login(email, password);
      navigate(location.state?.from || "/compte", { replace: true });
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
          <p className="flex-1 font-display font-semibold text-ink px-1">Se connecter</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Email</span>
            <input
              autoFocus
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
          >
            <LogIn size={18} />
            Se connecter
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-5">
          Pas encore membre ?{" "}
          <Link to="/inscription" className="text-brand-blue font-medium">
            Créer un compte
          </Link>
        </p>

        <div className="mt-8 bg-surface border border-dashed border-border rounded-2xl px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Comptes de test</p>
          <ul className="text-xs text-muted space-y-1 font-mono">
            <li>admin@singout.app / Admin123!</li>
            <li>membre@singout.app / Membre123!</li>
            <li>plus@singout.app / Plus123!</li>
            <li>pro@singout.app / Pro123!</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
