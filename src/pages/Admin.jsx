import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, ShieldAlert, Clock } from "lucide-react";
import {
  useCurrentUser,
  getAllUsers,
  approveUpgrade,
  rejectUpgrade,
  setMembership,
  MEMBERSHIP_LABELS,
  onAuthChange,
} from "../lib/auth.js";

const TIER_OPTIONS = ["member", "plus", "pro"];

export default function Admin() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [, forceRefresh] = useState(0);

  useEffect(() => onAuthChange(() => forceRefresh((n) => n + 1)), []);

  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-card">
          <ShieldAlert size={24} />
        </div>
        <p className="font-display font-semibold text-ink mb-1">Accès réservé</p>
        <p className="text-sm text-muted mb-5">Cet espace est réservé aux administrateurs.</p>
        <button onClick={() => navigate("/")} className="text-brand-blue text-sm font-medium">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const users = getAllUsers();
  const pending = users.filter((u) => u.membershipStatus === "pending");
  const others = users.filter((u) => u.membershipStatus !== "pending");

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-ink-soft hover:bg-surface" aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 font-display font-semibold text-ink px-1">Espace admin</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
            <Clock size={13} /> Demandes en attente {pending.length > 0 && `· ${pending.length}`}
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted bg-surface border border-border rounded-2xl px-4 py-3.5 shadow-card">
              Aucune demande en attente.
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="bg-surface border border-border rounded-2xl shadow-card px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-display font-semibold text-sm text-ink truncate">
                      {u.prenom} {u.nom}
                    </p>
                    <span className="text-xs font-semibold text-[#E8A23D] shrink-0">
                      → {MEMBERSHIP_LABELS[u.requestedTier]}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mb-1">{u.email} · {u.contact}</p>
                  <p className="text-xs text-muted mb-3">
                    {u.assemblee} · {u.departement} · {u.rolePrecis}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        approveUpgrade(u.id);
                        forceRefresh((n) => n + 1);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-brand-blue text-white rounded-xl py-2"
                    >
                      <Check size={14} /> Valider
                    </button>
                    <button
                      onClick={() => {
                        rejectUpgrade(u.id);
                        forceRefresh((n) => n + 1);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-paper text-ink-soft rounded-xl py-2"
                    >
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 px-1">
            Tous les membres · {others.length}
          </h2>
          <div className="space-y-2">
            {others.map((u) => (
              <div key={u.id} className="bg-surface border border-border rounded-2xl shadow-card px-4 py-3.5">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-display font-semibold text-sm text-ink truncate">
                    {u.prenom} {u.nom}
                    {u.isAdmin && <span className="ml-1.5 text-[10px] font-semibold text-brand-teal align-middle">ADMIN</span>}
                  </p>
                </div>
                <p className="text-xs text-muted truncate mb-2">{u.email}</p>
                <div className="flex items-center gap-1.5">
                  {TIER_OPTIONS.map((tier) => (
                    <button
                      key={tier}
                      disabled={u.isAdmin}
                      onClick={() => {
                        setMembership(u.id, tier);
                        forceRefresh((n) => n + 1);
                      }}
                      className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors disabled:opacity-40 ${
                        u.membership === tier ? "bg-brand-blue text-white" : "bg-paper text-ink-soft"
                      }`}
                    >
                      {MEMBERSHIP_LABELS[tier]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
