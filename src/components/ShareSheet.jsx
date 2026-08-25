import { useEffect, useState } from "react";
import { Send, MessageCircle, Copy, Share2, Check, X } from "lucide-react";
import { shareText, whatsappUrl, telegramUrl, copyText } from "../lib/share.js";

export default function ShareSheet({ open, onClose, title, text }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const handleNativeShare = async () => {
    const result = await shareText({ title, text });
    if (result === "shared") onClose();
  };

  const handleCopy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-up"
      />
      <div className="relative w-full sm:max-w-sm bg-surface rounded-t-3xl sm:rounded-3xl shadow-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink">Partager</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted hover:bg-paper" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-2">
          <ShareOption
            icon={<MessageCircle size={22} />}
            label="WhatsApp"
            color="bg-[#25D366]"
            href={whatsappUrl(text)}
            onClick={onClose}
          />
          <ShareOption
            icon={<Send size={22} />}
            label="Telegram"
            color="bg-[#229ED9]"
            href={telegramUrl(text)}
            onClick={onClose}
          />
          {typeof navigator !== "undefined" && navigator.share ? (
            <ShareOption icon={<Share2 size={22} />} label="Autre" color="bg-brand-blue" onClick={handleNativeShare} />
          ) : (
            <ShareOption
              icon={copied ? <Check size={22} /> : <Copy size={22} />}
              label={copied ? "Copié" : "Copier"}
              color="bg-ink-soft"
              onClick={handleCopy}
            />
          )}
        </div>

        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={handleCopy}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-ink-soft bg-paper hover:bg-border transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copié dans le presse-papiers" : "Copier le texte"}
          </button>
        )}
      </div>
    </div>
  );
}

function ShareOption({ icon, label, color, href, onClick }) {
  const content = (
    <>
      <span className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-card ${color}`}>
        {icon}
      </span>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </>
  );
  const className = "flex flex-col items-center gap-1.5 py-1";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={onClick} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
