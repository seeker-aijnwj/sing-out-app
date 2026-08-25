// Gestion du thème clair/sombre. Appliqué au tout début du chargement
// (voir main.jsx) pour éviter tout flash de couleur, et modifiable ensuite
// depuis la page Plus.

const KEY = "singout:theme"; // "light" | "dark"

export function getTheme() {
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

// À appeler une seule fois, le plus tôt possible.
export function initTheme() {
  applyTheme(getTheme());
}
