import { useState, useEffect, useRef } from "react";
import {
  X,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Radio,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from "lucide-react";
import soundEffects from "../../utils/soundEffects";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  localStream: MediaStream | null;
  isMuted: boolean;
  onToggleMute: () => void;
}

const AudioSettingsModal = ({
  isOpen,
  onClose,
  localStream,
  isMuted,
  onToggleMute,
}: AudioSettingsModalProps) => {
  // Volume state (0 to 100)
  const [masterVol, setMasterVol] = useState<number>(() => {
    return Math.round(soundEffects.getMasterVolume() * 100);
  });
  const [isOutputMuted, setIsOutputMuted] = useState(false);

  // Live mic meter bars
  const [micFrequencies, setMicFrequencies] = useState<number[]>(new Array(24).fill(6));
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mic test recording state
  const [isRecordingTest, setIsRecordingTest] = useState(false);
  const [recordCountdown, setRecordCountdown] = useState(3);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Speaker test state
  const [isPlayingSpeakerTest, setIsPlayingSpeakerTest] = useState(false);

  // ─── 1. Live Mic Visualizer ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !localStream || isMuted) {
      setMicFrequencies(new Array(24).fill(6));
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setMicFrequencies(new Array(24).fill(6));
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(localStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.55;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);

        // Map frequency bands to percentage heights (6% min, 100% max)
        const bars: number[] = [];
        const totalBars = 24;
        const step = Math.max(1, Math.floor(bufferLength / totalBars));
        for (let i = 0; i < totalBars; i++) {
          const val = dataArray[i * step] || 0;
          const height = Math.max(6, Math.min(100, Math.round((val / 255) * 100)));
          bars.push(height);
        }
        setMicFrequencies(bars);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn("Audio meter setup notice:", err);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, localStream, isMuted]);

  // ─── 2. Master Volume Change ────────────────────────────────────
  const handleVolumeChange = (newVal: number) => {
    setMasterVol(newVal);
    soundEffects.setMasterVolume(newVal / 100);
    if (newVal === 0) {
      setIsOutputMuted(true);
    } else if (isOutputMuted) {
      setIsOutputMuted(false);
    }
  };

  const handleToggleOutputMute = () => {
    setIsOutputMuted((prev) => {
      const next = !prev;
      soundEffects.setMasterMute(next);
      return next;
    });
  };

  // ─── 3. Speaker Test via Howler.js ──────────────────────────────
  const handlePlaySpeakerTest = () => {
    if (isPlayingSpeakerTest) return;
    setIsPlayingSpeakerTest(true);
    soundEffects.playSpeakerTest(() => {
      setIsPlayingSpeakerTest(false);
    });
  };

  // ─── 4. Voice Test Recording & Playback via Howler.js ────────────
  const handleStartMicTest = () => {
    if (!localStream || isRecordingTest) return;

    if (isMuted) {
      onToggleMute();
    }

    recordedChunksRef.current = [];
    setRecordedVoiceUrl(null);
    setIsRecordingTest(true);
    setRecordCountdown(3);

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(localStream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedVoiceUrl(audioUrl);
        setIsRecordingTest(false);

        setIsPlayingVoice(true);
        soundEffects.playVoiceSample(audioUrl, () => {
          setIsPlayingVoice(false);
        });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      let timeLeft = 3;
      const interval = setInterval(() => {
        timeLeft -= 1;
        setRecordCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.warn("MediaRecorder mic test notice:", err);
      setIsRecordingTest(false);
    }
  };

  const handlePlayVoiceSample = () => {
    if (!recordedVoiceUrl || isPlayingVoice) return;
    setIsPlayingVoice(true);
    soundEffects.playVoiceSample(recordedVoiceUrl, () => {
      setIsPlayingVoice(false);
    });
  };

  const handleStopVoiceSample = () => {
    soundEffects.stopVoiceSample();
    setIsPlayingVoice(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Premium Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0e1217] border border-zinc-800/90 p-6 sm:p-7 text-zinc-100 shadow-2xl z-10 animate-scale-up">
        {/* Luminous upper ambient glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-56 w-full rounded-full bg-emerald-500/4 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4.5 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200">
              <Sliders className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Audio & Crystal-Clear Mic
                </h2>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Studio Quality
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                High-fidelity 48kHz stereo & studio noise filters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-850 active:scale-95 transition-all"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body Panels */}
        <div className="flex flex-col gap-4 relative z-10">
          {/* Panel 1: Live Mic visualizer */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
                    isMuted
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Microphone Frequency</span>
                  <p className="text-[10px] text-zinc-400">
                    {isMuted ? "Microphone currently muted" : "Live mic signal detector"}
                  </p>
                </div>
              </div>

              <button
                onClick={onToggleMute}
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wide transition-all border ${
                  isMuted
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {isMuted ? "Unmute Mic" : "Mute Mic"}
              </button>
            </div>

            {/* Pristine Modern Equalizer Graph */}
            <div className="flex h-11 items-end justify-between gap-0.75 rounded-xl bg-zinc-950/70 border border-zinc-850/80 px-4 py-2">
              {micFrequencies.map((val, idx) => (
                <div
                  key={idx}
                  className="w-full rounded-full transition-all duration-75 ease-out"
                  style={{
                    height: `${isMuted ? 6 : val}%`,
                    backgroundColor: isMuted
                      ? "#3f3f46"
                      : val > 65
                      ? "#10b981"
                      : val > 30
                      ? "#10b981"
                      : "#059669",
                    opacity: isMuted ? 0.3 : 0.85,
                  }}
                />
              ))}
            </div>

            {/* Filter Indicators */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/40 border border-zinc-850 px-2.5 py-1.5 text-[9px] font-semibold text-zinc-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Echo Cancel</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/40 border border-zinc-850 px-2.5 py-1.5 text-[9px] font-semibold text-zinc-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Noise Filter</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/40 border border-zinc-850 px-2.5 py-1.5 text-[9px] font-semibold text-zinc-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>48kHz Audio</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Voice recording test */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Echo Check</span>
                <p className="text-[10px] text-zinc-400">
                  Record your voice and verify clarity with automatic loop playback
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleStartMicTest}
                disabled={isRecordingTest}
                className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isRecordingTest
                    ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                    : "bg-lime-500 hover:bg-lime-600 text-zinc-950 active:scale-95 shadow-lg shadow-lime-950/10"
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>
                  {isRecordingTest
                    ? `Recording... (${recordCountdown}s)`
                    : "Record Voice Test (3s)"}
                </span>
              </button>

              {recordedVoiceUrl && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isPlayingVoice ? (
                    <button
                      onClick={handlePlayVoiceSample}
                      className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-all active:scale-95"
                    >
                      <Play className="h-3 w-3 fill-zinc-200" />
                      <span>Hear Your Voice</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopVoiceSample}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
                    >
                      <Square className="h-3 w-3 fill-emerald-400" />
                      <span>Voice Playing...</span>
                    </button>
                  )}

                  <button
                    onClick={handleStartMicTest}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
                    title="Record again"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {recordedVoiceUrl && (
              <p className="mt-2 text-[10px] text-zinc-400">
                ✓ Recorded voice processed. Played back in crystal-clear quality for testing.
              </p>
            )}
          </div>

          {/* Panel 3: Speaker Test and Output Volume */}
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Speaker & Audio Volume</span>
                  <p className="text-[10px] text-zinc-400">Verify audio alerts and output chime clarity</p>
                </div>
              </div>

              <button
                onClick={handlePlaySpeakerTest}
                disabled={isPlayingSpeakerTest}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-bold tracking-wide transition-all ${
                  isPlayingSpeakerTest
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                <Play className="h-3 w-3 fill-current" />
                <span>{isPlayingSpeakerTest ? "Playing..." : "Test Speakers"}</span>
              </button>
            </div>

            {/* Slider control */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleOutputMute}
                className="text-zinc-400 hover:text-white transition-colors"
                title={isOutputMuted ? "Unmute output" : "Mute output"}
              >
                {isOutputMuted || masterVol === 0 ? (
                  <VolumeX className="h-4.5 w-4.5 text-red-400" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5 text-emerald-400" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={isOutputMuted ? 0 : masterVol}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-[#a3e635] focus:outline-none"
              />

              <span className="min-w-9 text-right font-mono text-[11px] font-bold text-zinc-300">
                {isOutputMuted ? 0 : masterVol}%
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-end relative z-10">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white active:scale-95"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioSettingsModal;
