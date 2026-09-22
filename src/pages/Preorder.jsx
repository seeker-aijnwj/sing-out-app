import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Send, PartyPopper } from "lucide-react";
import { savePreorder } from "../lib/storage.js";
import { CONTACT_EMAIL as PREORDER_EMAIL } from "../config.js";

const emptyForm = { prenom: "", nom: "", email: "", contact: "", assemblee: "", tailleEquipe: "", message: "" };

function buildMailto(entry) {
  const subject = `Précommande Sing Out v1.0.0 — ${entry.prenom} ${entry.nom}`;
  const lines = [
    `Prénom : ${entry.prenom}`,
    `Nom : ${entry.nom}`,
    `Email : ${entry.email}`,
    `Contact : ${entry.contact}`,
    `Assemblée : ${entry.assemblee}`,
    `Taille d'équipe estimée : ${entry.tailleEquipe || "—"}`,
    "",
    "Message :",
    entry.message || "—",
  ];
  const body = lines.join("\n");
  return `mailto:${PREORDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Preorder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.contact.trim() || !form.assemblee.trim()) {
      setError("Merci de renseigner au minimum votre nom, prénom, email, contact et assemblée.");
      return;
    }
    const entry = savePreorder(form);
    window.location.href = buildMailto(entry);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-full pb-10">
        <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
          <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
            <button onClick={() => navigate("/")} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Accueil">
              <ArrowLeft size={20} />
            </button>
            <p className="flex-1 font-display font-semibold text-ink px-1">Précommande</p>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-4">
            <PartyPopper size={26} />
          </div>
          <p className="font-display font-semibold text-lg text-ink mb-2">Merci pour votre précommande !</p>
          <p className="text-sm text-muted mb-1 max-w-sm mx-auto">
            Votre application e-mail a dû s'ouvrir avec un message pré-rempli — il ne reste qu'à l'envoyer.
          </p>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            Si rien ne s'est ouvert, écrivez-nous directement à{" "}
            <a href={`mailto:${PREORDER_EMAIL}`} className="text-brand-blue font-medium">
              {PREORDER_EMAIL}
            </a>
            .
          </p>
          <Link to="/" className="inline-block text-sm font-medium bg-brand-blue text-white px-5 py-2.5 rounded-xl shadow-fab">
            Retour à l'accueil
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Précommander Sing Out v1.0.0</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4 mb-6">
          <p className="text-sm text-ink font-medium mb-1">Soyez parmi les premiers</p>
          <p className="text-sm text-muted">
            Laissez vos coordonnées pour précommander la version 1.0.0 de Sing Out. Nous vous recontacterons dès sa
            sortie, avec les modalités d'accès pour votre assemblée.
          </p>
        </div>

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

          <Field label="Contact (téléphone / WhatsApp)">
            <input required value={form.contact} onChange={set("contact")} placeholder="+225 07 00 00 00 00" className="input" />
          </Field>

          <Field label="Assemblée">
            <input required value={form.assemblee} onChange={set("assemblee")} placeholder="Nom de votre assemblée / église" className="input" />
          </Field>

          <Field label="Taille d'équipe estimée (facultatif)">
            <input value={form.tailleEquipe} onChange={set("tailleEquipe")} placeholder="Ex. 10 à 20 personnes" className="input" />
          </Field>

          <Field label="Message (facultatif)">
            <textarea
              value={form.message}
              onChange={set("message")}
              placeholder="Besoins particuliers, questions, nombre d'assemblées à couvrir…"
              rows={3}
              className="input resize-none"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-medium py-3.5 rounded-2xl shadow-fab active:scale-[0.98] transition-transform"
          >
            <Send size={18} />
            Envoyer ma précommande
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Mail size={12} /> Envoyé à {PREORDER_EMAIL}
          </p>
        </form>
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
