import type { LiveCaption } from "../../hooks/useCaptions";
import { Languages } from "lucide-react";

interface CaptionsOverlayProps {
  caption: LiveCaption | null;
  isVisible: boolean;
}

export const CaptionsOverlay = ({ caption, isVisible }: CaptionsOverlayProps) => {
  if (!isVisible || !caption || !caption.text) return null;

  const isTranslated =
    caption.spokenLang !== caption.targetLang && caption.originalText !== caption.text;

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92vw] pointer-events-none select-none transition-all duration-200 animate-fade-in">
      <div className="flex flex-col gap-1.5 rounded-xl bg-black/80 border border-white/10 p-3 sm:px-4 sm:py-3 backdrop-blur-md shadow-xl text-white">
        {/* Caption Header / Speaker Tag */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-200">
              {caption.senderName.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-zinc-200 tracking-tight">
              {caption.senderName} {caption.isLocal && "(You)"}
            </span>
            {isTranslated && (
              <span className="flex items-center gap-1 rounded-md bg-white/5 border border-white/8 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                <Languages className="h-2.5 w-2.5 text-[#34d399]" />
                <span>
                  {caption.spokenLang.startsWith("hi") ? "Hindi" : caption.spokenLang} →{" "}
                  {caption.targetLang.toUpperCase()}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>Subtitles</span>
          </div>
        </div>

        {/* Subtitle Text (Translated / English) */}
        <div className="text-sm sm:text-base font-medium text-white leading-relaxed">
          {caption.text}
        </div>

        {/* Original Spoken Text (If translated from Hindi) */}
        {isTranslated && caption.originalText && (
          <div className="text-[11px] text-zinc-400 border-t border-white/8 pt-1">
            <span className="text-zinc-500">Original: </span>
            {caption.originalText}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionsOverlay;
