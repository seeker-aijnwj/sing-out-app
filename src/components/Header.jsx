import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Header({ title, subtitle, action }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-border">
      <div className="max-w-xl mx-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <Link to="/" className="shrink-0 flex items-center gap-2 group" aria-label="Sing Out — accueil">
          <img src={logo} alt="" className="h-9 w-9 object-contain" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-lg leading-tight text-ink truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
