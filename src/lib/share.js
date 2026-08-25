// Construit le texte partagé (format proche de ce qu'on tape "à la main"
// sur WhatsApp : *gras*, lignes vides entre sections) et ouvre les
// messageries ou le partage natif du système.

export function formatSongText(song) {
  const lines = [`*Chant : ${song.title}*`];
  if (song.originalKey) lines.push(`Gamme : ${song.originalKey}`);
  lines.push("");
  const hasLyrics = song.lyrics?.some((v) => v.text?.trim());
  if (hasLyrics) {
    song.lyrics.forEach((verse, i) => {
      if (!verse.text?.trim()) return;
      if (verse.label?.trim()) lines.push(`[${verse.label.trim()}]`);
      lines.push(verse.text.trim());
      if (i < song.lyrics.length - 1) lines.push("");
    });
  }
  if (song.youtubeUrl) {
    if (hasLyrics) lines.push("");
    lines.push(song.youtubeUrl);
  }
  return lines.join("\n").trim();
}

export function formatSetText(set, songsById) {
  const lines = [`*${(set.title || "Propositions de chants").toUpperCase()}*`];
  if (set.date) {
    lines.push(formatDateLong(set.date).toUpperCase());
  }
  lines.push("");

  set.moments.forEach((moment) => {
    lines.push(`*${moment.name}*`);
    lines.push("");
    moment.items.forEach((item, idx) => {
      const prefix = moment.numbered ? `${idx + 1}. ` : "";
      if (item.songId) {
        const song = songsById[item.songId];
        if (!song) return;
        const details = [item.lead, item.key].filter(Boolean).join(" · ");
        lines.push(`${prefix}${song.title}${details ? ` (${details})` : ""}`);
        if (song.youtubeUrl) lines.push(song.youtubeUrl);
      } else if (item.text) {
        lines.push(`${prefix}${item.text}`);
      }
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

export function formatDateLong(isoDate) {
  try {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return isoDate;
  }
}

export async function shareText({ title, text }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // fall through to manual options if native share fails for another reason
    }
  }
  return "unavailable";
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function telegramUrl(text) {
  return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}
