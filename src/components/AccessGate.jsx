import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { useCurrentUser, meetsLevel, MEMBERSHIP_LABELS } from "../lib/auth.js";

const LEVEL_COPY = {
  member: {
    badge: "Réservé aux membres",
    loggedOutHint: "Créez un compte gratuit et connectez-vous pour débloquer cette fonctionnalité.",
  },
  plus: {
    badge: "Réservé aux Membres Plus",
    loggedOutHint: "Créez un compte, connectez-vous, puis passez Membre Plus pour débloquer cette fonctionnalité.",
  },
  pro: {
    badge: "Réservé aux Membres Pro",
    loggedOutHint: "Créez un compte, connectez-vous, puis passez Membre Pro pour débloquer cette fonctionnalité.",
  },
};

// Utilitaire non-visuel, pour gater une simple valeur/section sans carte.
export function useAccess(level) {
  const user = useCurrentUser();
  return { user, allowed: meetsLevel(user, level) };
}

export default function AccessGate({ level, title, hint, compact = false, children }) {
  const user = useCurrentUser();
  if (meetsLevel(user, level)) return children;

  const copy = LEVEL_COPY[level] || LEVEL_COPY.member;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted bg-paper border border-dashed border-border rounded-xl px-3 py-2.5">
        <Lock size={13} className="shrink-0" />
        <span className="flex-1">{hint || copy.badge}</span>
        <Link to={user ? "/compte" : "/connexion"} className="font-medium text-brand-blue shrink-0">
          {user ? "Améliorer" : "Se connecter"}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl px-5 py-7 text-center">
      <div className="w-11 h-11 mx-auto rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-3">
        {level === "member" ? <Lock size={18} /> : <Sparkles size={18} />}
      </div>
      <p className="font-display font-semibold text-ink mb-1">{title || copy.badge}</p>
      <p className="text-sm text-muted mb-4 max-w-xs mx-auto">{hint || copy.loggedOutHint}</p>
      {!user ? (
        <div className="flex gap-2 justify-center">
          <Link to="/connexion" className="text-sm font-medium bg-brand-blue text-white px-4 py-2.5 rounded-xl shadow-fab">
            Se connecter
          </Link>
          <Link to="/inscription" className="text-sm font-medium bg-paper border border-border text-ink px-4 py-2.5 rounded-xl">
            Devenir membre
          </Link>
        </div>
      ) : user.membershipStatus === "pending" ? (
        <p className="text-xs text-muted">
          Votre demande {MEMBERSHIP_LABELS[user.requestedTier] || ""} est en cours de vérification.
        </p>
      ) : (
        <Link to="/compte" className="inline-block text-sm font-medium bg-brand-blue text-white px-4 py-2.5 rounded-xl shadow-fab">
          Passer Membre Plus
        </Link>
      )}
    </div>
  );
}
