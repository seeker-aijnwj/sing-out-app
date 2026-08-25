import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, LogOut, ShieldCheck, Clock, Crown, Sparkles, Check, X as XIcon, ShieldAlert } from "lucide-react";
import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  useCurrentUser,
  logout,
  requestUpgrade,
  cancelUpgradeRequest,
  updateProfile,
  MEMBERSHIP_LABELS,
  UPGRADE_PRICE,
} from "../lib/auth.js";

const TIER_ICON = { member: ShieldCheck, plus: Sparkles, pro: Crown };

export default function Account() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  if (!user) {
    return (
      <div className="min-h-full pb-24">
        <Header title="Mon compte" subtitle="Connectez-vous pour accéder à votre profil" />
        <main className="max-w-xl mx-auto px-4 pt-8 text-center">
          <p className="text-sm text-muted mb-5">Vous n'êtes pas connecté.</p>
          <div className="flex gap-2 justify-center">
            <Link to="/connexion" className="text-sm font-medium bg-brand-blue text-white px-4 py-2.5 rounded-xl shadow-fab">
              Se connecter
            </Link>
            <Link to="/inscription" className="text-sm font-medium bg-surface border border-border px-4 py-2.5 rounded-xl">
              Devenir membre
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const TierIcon = TIER_ICON[user.membership] || ShieldCheck;

  const startEdit = () => {
    setForm({
      prenom: user.prenom,
      nom: user.nom,
      contact: user.contact,
      assemblee: user.assemblee,
      departement: user.departement,
      rolePrecis: user.rolePrecis,
    });
    setEditing(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    updateProfile(user.id, form);
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-full pb-24">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Mon compte</p>
          <button onClick={handleLogout} className="p-2 rounded-full text-danger hover:bg-danger-soft" aria-label="Se déconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Carte identité */}
        <div className="bg-surface border border-border rounded-2xl shadow-card px-5 py-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="shrink-0 w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-display font-bold text-lg">
              {user.prenom[0]}
              {user.nom[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            {user.isAdmin && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-brand-teal bg-brand-teal/10 rounded-full px-2 py-1">
                <ShieldAlert size={11} /> Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-paper rounded-xl px-3.5 py-2.5 mb-4">
            <TierIcon size={16} className="text-brand-blue shrink-0" />
            <span className="text-sm font-medium text-ink flex-1">{MEMBERSHIP_LABELS[user.membership]}</span>
            {user.membershipStatus === "pending" && (
              <span className="flex items-center gap-1 text-xs text-[#E8A23D] font-medium shrink-0">
                <Clock size={12} /> Demande {MEMBERSHIP_LABELS[user.requestedTier]} en attente
              </span>
            )}
          </div>

          {!editing ? (
            <div className="space-y-1.5 text-sm">
              <Row label="Contact" value={user.contact} />
              <Row label="Assemblée" value={user.assemblee} />
              <Row label="Département" value={user.departement} />
              <Row label="Rôle précis" value={user.rolePrecis} />
              <button onClick={startEdit} className="mt-3 text-xs font-medium text-brand-blue">
                Modifier mes informations
              </button>
            </div>
          ) : (
            <form onSubmit={saveEdit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="input" placeholder="Prénom" />
                <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="input" placeholder="Nom" />
              </div>
              <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="input" placeholder="Contact" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.assemblee} onChange={(e) => setForm((f) => ({ ...f, assemblee: e.target.value }))} className="input" placeholder="Assemblée" />
                <input value={form.departement} onChange={(e) => setForm((f) => ({ ...f, departement: e.target.value }))} className="input" placeholder="Département" />
              </div>
              <input value={form.rolePrecis} onChange={(e) => setForm((f) => ({ ...f, rolePrecis: e.target.value }))} className="input" placeholder="Rôle précis" />
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-brand-blue text-white rounded-xl py-2.5">
                  <Check size={14} /> Enregistrer
                </button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-paper text-ink-soft rounded-xl py-2.5">
                  <XIcon size={14} /> Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        {user.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors"
          >
            <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal">
              <ShieldAlert size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">Espace admin</p>
              <p className="text-xs text-muted">Valider les demandes, gérer les membres</p>
            </div>
          </Link>
        )}

        {/* Adhésion */}
        {!user.isAdmin && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Adhésion</h2>

            {user.membershipStatus === "pending" ? (
              <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4">
                <p className="text-sm text-ink font-medium mb-1">
                  Demande {MEMBERSHIP_LABELS[user.requestedTier]} envoyée
                </p>
                <p className="text-xs text-muted mb-3">
                  Envoyez le reçu de votre versement de {UPGRADE_PRICE[user.requestedTier]} par WhatsApp au numéro qui
                  vous sera communiqué. Un administrateur validera votre adhésion dès réception.
                </p>
                <button
                  onClick={() => cancelUpgradeRequest(user.id)}
                  className="text-xs font-medium text-danger"
                >
                  Annuler ma demande
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {user.membership !== "plus" && user.membership !== "pro" && (
                  <UpgradeCard
                    tier="plus"
                    title="Membre Plus"
                    price={UPGRADE_PRICE.plus}
                    hint="Débloque les fonctionnalités Chants avancées et Collaboration (tags, recherche dans les paroles, accords, notes d'équipe…)."
                    onRequest={() => requestUpgrade(user.id, "plus")}
                  />
                )}
                {user.membership !== "pro" && (
                  <UpgradeCard
                    tier="pro"
                    title="Membre Pro"
                    price={UPGRADE_PRICE.pro}
                    hint="Inclut tout Membre Plus, plus les fonctionnalités à venir réservées aux membres Pro."
                    onRequest={() => requestUpgrade(user.id, "pro")}
                  />
                )}
                {user.membership === "pro" && (
                  <p className="text-sm text-muted text-center py-4">Vous êtes déjà Membre Pro, le palier le plus complet 🎉</p>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-ink font-medium truncate">{value}</span>
    </p>
  );
}

function UpgradeCard({ tier, title, price, hint, onRequest }) {
  const Icon = TIER_ICON[tier];
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card px-4 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={16} className="text-brand-blue" />
        <p className="font-display font-semibold text-ink">{title}</p>
        <span className="ml-auto text-sm font-semibold text-ink">{price}</span>
      </div>
      <p className="text-xs text-muted mb-3">{hint}</p>
      <button
        onClick={onRequest}
        className="w-full text-sm font-medium bg-brand-blue text-white rounded-xl py-2.5"
      >
        Demander {title}
      </button>
    </div>
  );
}
