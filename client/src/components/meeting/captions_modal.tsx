import { X, Subtitles, ChevronDown, Check, ArrowRight, Languages } from "lucide-react";

interface CaptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCaptionsEnabled: boolean;
  onToggleCaptions: () => void;
  spokenLang: string;
  onSelectSpokenLang: (lang: string) => void;
  captionLang: string;
  onSelectCaptionLang: (lang: string) => void;
}

const SPOKEN_LANGUAGES = [
  { code: "hi-IN", label: "Hindi (हिन्दी)", short: "HI", popular: true },
  { code: "en-US", label: "English (US)", short: "US", popular: true },
  { code: "en-IN", label: "English (India)", short: "IN", popular: true },
  { code: "es-ES", label: "Spanish (Español)", short: "ES" },
  { code: "fr-FR", label: "French (Français)", short: "FR" },
  { code: "de-DE", label: "German (Deutsch)", short: "DE" },
  { code: "ja-JP", label: "Japanese (日本語)", short: "JA" },
];

const CAPTION_LANGUAGES = [
  { code: "en", label: "English", short: "EN", popular: true },
  { code: "hi", label: "Hindi (हिन्दी)", short: "HI", popular: true },
  { code: "es", label: "Spanish (Español)", short: "ES" },
  { code: "fr", label: "French (Français)", short: "FR" },
];

export const CaptionsModal = ({
  isOpen,
  onClose,
  isCaptionsEnabled,
  onToggleCaptions,
  spokenLang,
  onSelectSpokenLang,
  captionLang,
  onSelectCaptionLang,
}: CaptionsModalProps) => {
  if (!isOpen) return null;

  const currentSpoken = SPOKEN_LANGUAGES.find((l) => l.code === spokenLang) || SPOKEN_LANGUAGES[0];
  const currentCaption = CAPTION_LANGUAGES.find((l) => l.code === captionLang) || CAPTION_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Subtle backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Clean Modern Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#242424] border border-[#383838] p-5 sm:p-6 text-zinc-100 shadow-2xl z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#34d399]">
              <Subtitles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Captions & Translation
              </h3>
              <p className="text-xs text-zinc-400">
                Real-time speech to text & subtitle translation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Master Live Captions Switch */}
        <div className="my-5 flex items-center justify-between rounded-xl bg-[#1e1e1e] border border-[#383838] p-3.5 transition-colors">
          <div>
            <div className="text-sm font-medium text-white">Live Subtitles</div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {isCaptionsEnabled ? "Subtitles are currently showing" : "Turn on to see speech transcripts on screen"}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isCaptionsEnabled}
            onClick={onToggleCaptions}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isCaptionsEnabled ? "bg-[#10b981]" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isCaptionsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Language Configuration Section */}
        <div className="space-y-4">
          {/* 1. Spoken Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Language you speak
              </label>
              <span className="text-[11px] text-zinc-500">Input audio</span>
            </div>

            {/* Quick Segmented Shortcuts for top languages */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {SPOKEN_LANGUAGES.slice(0, 3).map((lang) => {
                const isSelected = spokenLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onSelectSpokenLang(lang.code)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#10b981]/20 border-[#10b981]/50 text-[#34d399] shadow-xs"
                        : "bg-[#1e1e1e] border-[#383838] text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <span>{lang.label.split(" ")[0]}</span>
                    {isSelected && <Check className="h-3 w-3 text-[#10b981]" />}
                  </button>
                );
              })}
            </div>

            {/* Full Dropdown for all languages */}
            <div className="relative">
              <select
                value={spokenLang}
                onChange={(e) => onSelectSpokenLang(e.target.value)}
                className="w-full appearance-none rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-3.5 pr-10 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#10b981] transition-colors cursor-pointer"
              >
                {SPOKEN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#1e1e1e] text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          {/* 2. Subtitles Target Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Translate subtitles to
              </label>
              <span className="text-[11px] text-zinc-500">Output text</span>
            </div>

            {/* Quick Segmented Shortcuts */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {CAPTION_LANGUAGES.slice(0, 2).map((lang) => {
                const isSelected = captionLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onSelectCaptionLang(lang.code)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#10b981]/20 border-[#10b981]/50 text-[#34d399] shadow-xs"
                        : "bg-[#1e1e1e] border-[#383838] text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <span>{lang.label}</span>
                    {isSelected && <Check className="h-3 w-3 text-[#10b981]" />}
                  </button>
                );
              })}
            </div>

            {/* Full Dropdown for all target languages */}
            <div className="relative">
              <select
                value={captionLang}
                onChange={(e) => onSelectCaptionLang(e.target.value)}
                className="w-full appearance-none rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-3.5 pr-10 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#10b981] transition-colors cursor-pointer"
              >
                {CAPTION_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#1e1e1e] text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Translation Flow Summary Indicator */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1e1e1e] border border-[#383838] px-3.5 py-2.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-[#34d399]" />
            <span className="font-medium text-zinc-200">
              {currentSpoken.label.split(" ")[0]}
            </span>
            <ArrowRight className="h-3 w-3 text-zinc-500" />
            <span className="font-semibold text-[#34d399]">
              {currentCaption.label}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">Live</span>
        </div>

        {/* Clean Footer */}
        <div className="mt-6 pt-4 border-t border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            {isCaptionsEnabled ? (
              <span className="flex items-center gap-1.5 text-[#34d399] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Subtitles active
              </span>
            ) : (
              <span className="text-zinc-500">Subtitles off</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#10b981] hover:bg-[#059669] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptionsModal;
