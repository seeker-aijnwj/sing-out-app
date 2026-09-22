import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, Lightbulb, Check } from "lucide-react";
import { saveSuggestion } from "../lib/storage.js";
import { useCurrentUser } from "../lib/auth.js";
import { CONTACT_EMAIL as PREORDER_EMAIL } from "../config.js";
import AccessGate from "../components/AccessGate.jsx";

function buildMailto(entry) {
  const subject = `Suggestion Sing Out — ${entry.authorName}`;
  const body = [
    `De : ${entry.authorName}`,
    entry.authorEmail ? `Email : ${entry.authorEmail}` : null,
    "",
    "Suggestion :",
    entry.message,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return `mailto:${PREORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Suggestions() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const entry = saveSuggestion({ name, email, message });
    window.location.href = buildMailto(entry);
    setSent(true);
  };

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Faire une suggestion</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        <AccessGate
          level="plus"
          title="Suggestions réservées aux Membres Plus/Pro"
          hint="Connectez-vous avec un compte Membre Plus, Pro ou Admin pour envoyer une suggestion."
        >
          {sent ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-4">
                <Check size={24} />
              </div>
              <p className="font-display font-semibold text-ink mb-2">Merci pour votre suggestion !</p>
              <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
                Votre application e-mail a dû s'ouvrir avec un message pré-rempli. Si rien ne s'est ouvert, écrivez
                directement à <a href={`mailto:${PREORDER_EMAIL}`} className="text-brand-blue font-medium">{PREORDER_EMAIL}</a>.
              </p>
              <Link to="/plus" className="inline-block text-sm font-medium bg-brand-blue text-white px-5 py-2.5 rounded-xl shadow-fab">
                Retour
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 mb-6 flex items-start gap-3">
                <Lightbulb size={18} className="text-brand-blue shrink-0 mt-0.5" />
                <p className="text-sm text-muted">
                  Une idée pour améliorer Sing Out ? Un bug à signaler ? Écrivez-le ici — ça part directement par e-mail.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!user && (
                  <>
                    <label className="block">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Votre nom</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Votre email (facultatif)</span>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                    </label>
                  </>
                )}
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 px-1">Votre suggestion</span>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre idée ou le problème rencontré…"
                    rows={5}
                    className="input resize-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <Send size={18} /> Envoyer ma suggestion
                </button>
              </form>
            </>
          )}
        </AccessGate>
      </main>
    </div>
  );
}
