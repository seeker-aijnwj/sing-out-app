import { NavLink } from "react-router-dom";
import { Home, Music2, ListMusic, MoreHorizontal } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        <Tab to="/" icon={<Home size={20} />} label="Accueil" end />
        <Tab to="/chants" icon={<Music2 size={20} />} label="Chants" />
        <Tab to="/listes" icon={<ListMusic size={20} />} label="Listes" />
        <Tab to="/plus" icon={<MoreHorizontal size={20} />} label="Plus" />
      </div>
    </nav>
  );
}

function Tab({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
          isActive ? "text-brand-blue" : "text-muted"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
