import { Component } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

// Filet de sécurité : si l'affichage d'une page plante (ex. une donnée
// inattendue sur un chant importé ou synchronisé), on affiche un message
// récupérable au lieu d'un écran blanc figé qui obligerait à recharger ou
// rouvrir l'app à l'aveugle.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[Sing Out] Erreur d'affichage :", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    // On force un retour à l'accueil pour éviter de retomber immédiatement
    // sur la page qui a planté.
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-paper">
          <div className="w-14 h-14 rounded-2xl bg-danger-soft text-danger flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="font-display font-semibold text-ink mb-1">Un problème d'affichage est survenu</p>
          <p className="text-sm text-muted mb-6 max-w-xs">
            Cette page n'a pas pu s'afficher correctement. Vos données ne sont pas perdues — un retour à l'accueil
            suffit en général à résoudre le problème.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-fab"
          >
            <RefreshCcw size={16} /> Retour à l'accueil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
