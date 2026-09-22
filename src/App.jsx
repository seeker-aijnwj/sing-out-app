import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { seedIfEmpty } from "./lib/storage.js";
import { initSync } from "./lib/sync.js";
import { seedFictionalUsersIfEmpty } from "./lib/auth.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Home from "./pages/Home.jsx";
import Songs from "./pages/Songs.jsx";
import SongDetail from "./pages/SongDetail.jsx";
import SongForm from "./pages/SongForm.jsx";
import Sets from "./pages/Sets.jsx";
import SetForm from "./pages/SetForm.jsx";
import SetDetail from "./pages/SetDetail.jsx";
import Plus from "./pages/Plus.jsx";
import Stats from "./pages/Stats.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";
import ImportSongs from "./pages/ImportSongs.jsx";
import Preorder from "./pages/Preorder.jsx";
import Suggestions from "./pages/Suggestions.jsx";

// Une clé basée sur le chemin force le remontage de la limite d'erreur à
// chaque navigation : une page cassée n'empêche pas de revenir en arrière
// ou d'aller ailleurs dans l'app.
function RoutedContent() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chants" element={<Songs />} />
        <Route path="/chants/nouveau" element={<SongForm />} />
        <Route path="/chants/:id" element={<SongDetail />} />
        <Route path="/chants/:id/modifier" element={<SongForm />} />
        <Route path="/listes" element={<Sets />} />
        <Route path="/listes/nouvelle" element={<SetForm />} />
        <Route path="/listes/:id" element={<SetDetail />} />
        <Route path="/listes/:id/modifier" element={<SetForm />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="/statistiques" element={<Stats />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/compte" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/chants/importer" element={<ImportSongs />} />
        <Route path="/precommande" element={<Preorder />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    seedIfEmpty();
    seedFictionalUsersIfEmpty();
    initSync();
  }, []);

  return (
    <HashRouter>
      <RoutedContent />
    </HashRouter>
  );
}
