import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Info, Download, Upload, Trash, ChevronRight, Cloud, CloudOff, RefreshCw, AlertTriangle, BarChart3, Sun, Moon, UserRound, LogIn, ShieldAlert, Rocket, Share2, Lightbulb } from "lucide-react";
import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ShareSheet from "../components/ShareSheet.jsx";
import { isFirebaseConfigured } from "../lib/firebase.js";
import { getSyncStatus, onSyncStatusChange, getLastSyncAt, syncNow } from "../lib/sync.js";
import { getTheme, setTheme } from "../lib/theme.js";
import { formatDateLong, formatAppShareText } from "../lib/share.js";
import { useCurrentUser, MEMBERSHIP_LABELS } from "../lib/auth.js";

const STATUS_INFO = {
  disabled: {
    label: "Non connecté",
    hint: "Sing Out fonctionne pour l'instant entièrement en local, sur cet appareil.",
    icon: CloudOff,
    tone: "text-muted bg-muted/10",
  },
  idle: {
    label: "En attente",
    hint: "Firebase est configuré, la première synchronisation va démarrer.",
    icon: Cloud,
    tone: "text-brand-blue bg-brand-blue/10",
  },
  offline: {
    label: "Hors-ligne",
    hint: "Aucune connexion Internet détectée. Les données seront envoyées dès le retour du réseau.",
    icon: CloudOff,
    tone: "text-muted bg-muted/10",
  },
  syncing: {
    label: "Synchronisation en cours…",
    hint: "Envoi des chants et listes modifiés vers Firebase.",
    icon: RefreshCw,
    tone: "text-brand-blue bg-brand-blue/10",
  },
  synced: {
    label: "Synchronisé",
    hint: "Toutes vos données locales ont été envoyées vers Firebase.",
    icon: Cloud,
    tone: "text-brand-teal bg-brand-teal/10",
  },
  error: {
    label: "Échec de synchronisation",
    hint: "La dernière tentative a échoué. Nouvel essai automatique au prochain changement.",
    icon: AlertTriangle,
    tone: "text-danger bg-danger-soft",
  },
};

// Chaque entrée ci-dessous est une future commande. Pour en ajouter une,
// il suffit d'ajouter un objet { icon, title, hint, disabled?, to? } à ce
// tableau : la page se met à jour automatiquement, sans toucher au reste de l'app.
const ITEMS = [
  {
    icon: Upload,
    title: "Importer des chants",
    hint: "Depuis un fichier JSON — réservé aux Membres Plus/Pro",
    to: "/chants/importer",
  },
  {
    icon: Lightbulb,
    title: "Faire une suggestion",
    hint: "Réservé aux Membres Plus/Pro",
    to: "/suggestions",
  },
  {
    icon: Rocket,
    title: "Précommander la v1.0.0",
    hint: "Laissez vos coordonnées pour être parmi les premiers",
    to: "/precommande",
  },
  {
    icon: Share2,
    title: "Partager Sing Out",
    hint: "Faites connaître l'appli autour de vous",
    action: "share",
  },
  {
    icon: Download,
    title: "Exporter mes données",
    hint: "Bientôt disponible",
    disabled: true,
  },
  {
    icon: Trash,
    title: "Réinitialiser les données",
    hint: "Bientôt disponible",
    disabled: true,
  },
  {
    icon: Info,
    title: "À propos de Sing Out",
    hint: "Version alpha — vos données restent sur cet appareil",
    disabled: true,
  },
];

export default function Plus() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const configured = isFirebaseConfigured();
  const [status, setStatus] = useState(getSyncStatus());
  const [lastSync, setLastSync] = useState(getLastSyncAt());
  const [theme, setThemeState] = useState(getTheme());
  const [shareAppOpen, setShareAppOpen] = useState(false);

  useEffect(() => onSyncStatusChange((s) => {
    setStatus(s);
    setLastSync(getLastSyncAt());
  }), []);

  const changeTheme = (next) => {
    setTheme(next);
    setThemeState(next);
  };

  const info = STATUS_INFO[status] || STATUS_INFO.disabled;
  const StatusIcon = info.icon;

  return (
    <div className="pb-24">
      <Header title="Plus" subtitle="Réglages et autres commandes" />

      <main className="max-w-xl mx-auto px-4 pt-4">
        {user ? (
          <Link
            to="/compte"
            className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors mb-6"
          >
            <span className="shrink-0 w-11 h-11 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-display font-bold">
              {user.prenom[0]}
              {user.nom[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted truncate">
                {MEMBERSHIP_LABELS[user.membership]}
                {user.isAdmin && " · Admin"}
                {user.membershipStatus === "pending" && " · demande en attente"}
              </p>
            </div>
            <ChevronRight size={18} className="text-border shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-3 bg-surface rounded-2xl border border-dashed border-border px-4 py-3.5 shadow-card mb-6">
            <span className="shrink-0 w-11 h-11 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <UserRound size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">Non connecté</p>
              <p className="text-xs text-muted">Connectez-vous pour débloquer plus de fonctionnalités</p>
            </div>
            <button
              onClick={() => navigate("/connexion")}
              className="shrink-0 flex items-center gap-1.5 text-sm font-medium bg-brand-blue text-white px-3.5 py-2 rounded-xl"
            >
              <LogIn size={14} /> Se connecter
            </button>
          </div>
        )}

        {user?.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card hover:border-brand-blue/40 transition-colors mb-6"
          >
            <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal">
              <ShieldAlert size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">Espace admin</p>
              <p className="text-xs text-muted">Valider les demandes, gérer les membres</p>
            </div>
            <ChevronRight size={18} className="text-border shrink-0" />
          </Link>
        )}

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Suivi</h2>
        <button
          type="button"
          onClick={() => navigate("/statistiques")}
          className="w-full flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card text-left hover:border-brand-blue/40 transition-colors mb-6"
        >
          <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue">
            <BarChart3 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-ink truncate">Statistiques</p>
            <p className="text-xs text-muted truncate">Leads, gammes, chants oubliés…</p>
          </div>
          <ChevronRight size={18} className="text-border shrink-0" />
        </button>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Apparence</h2>
        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-2xl p-1 mb-6">
          <button
            onClick={() => changeTheme("light")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl py-2.5 transition-colors ${
              theme === "light" ? "bg-brand-blue text-white" : "text-ink-soft"
            }`}
          >
            <Sun size={15} /> Clair
          </button>
          <button
            onClick={() => changeTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-xl py-2.5 transition-colors ${
              theme === "dark" ? "bg-brand-blue text-white" : "text-ink-soft"
            }`}
          >
            <Moon size={15} /> Sombre
          </button>
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Synchronisation</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-card px-4 py-3.5 mb-2">
          <div className="flex items-center gap-3">
            <span className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${info.tone}`}>
              <StatusIcon size={18} className={status === "syncing" ? "animate-spin" : ""} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink">{info.label}</p>
              <p className="text-xs text-muted">{info.hint}</p>
            </div>
          </div>

          {lastSync && (
            <p className="text-xs text-muted mt-3 pt-3 border-t border-border">
              Dernière synchronisation : {formatDateLong(lastSync.slice(0, 10))} à{" "}
              {new Date(lastSync).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {configured ? (
            <button
              onClick={() => syncNow({ pull: true })}
              disabled={status === "syncing"}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium text-brand-blue bg-brand-blue/5 rounded-xl py-2.5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={status === "syncing" ? "animate-spin" : ""} />
              Forcer la synchronisation
            </button>
          ) : (
            <p className="text-xs text-muted mt-3 pt-3 border-t border-border">
              Firebase n'est pas encore branché à cette installation. Vos chants et listes restent stockés
              uniquement sur cet appareil, en attendant.
            </p>
          )}
        </div>

        <div className="space-y-2 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">Autres commandes</h2>
          {ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.title}
                to={item.to}
                className="w-full flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card text-left hover:border-brand-blue/40 transition-colors"
              >
                <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue">
                  <item.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-ink truncate">{item.title}</p>
                  {item.hint && <p className="text-xs text-muted truncate">{item.hint}</p>}
                </div>
                <ChevronRight size={18} className="text-border shrink-0" />
              </Link>
            ) : (
              <button
                key={item.title}
                type="button"
                disabled={item.disabled}
                onClick={item.action === "share" ? () => setShareAppOpen(true) : undefined}
                className="w-full flex items-center gap-3 bg-surface rounded-2xl border border-border px-4 py-3.5 shadow-card text-left disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:border-brand-blue/40 transition-colors"
              >
                <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue">
                  <item.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-ink truncate">{item.title}</p>
                  {item.hint && <p className="text-xs text-muted truncate">{item.hint}</p>}
                </div>
                {!item.disabled && <ChevronRight size={18} className="text-border shrink-0" />}
              </button>
            )
          )}
        </div>

        <p className="text-xs text-muted text-center mt-8 px-6">
          D'autres commandes apparaîtront ici au fil des prochaines mises à jour de Sing Out.
        </p>
      </main>

      <ShareSheet
        open={shareAppOpen}
        onClose={() => setShareAppOpen(false)}
        title="Sing Out"
        text={formatAppShareText()}
      />

      <BottomNav />
    </div>
  );
}
