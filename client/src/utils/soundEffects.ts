import { Howl, Howler } from "howler";

// ─── Lightweight High-Clarity WAV Audio Synthesizer ──────────────
// Generates pristine 16-bit 44.1kHz PCM WAV Data URIs for offline, zero-latency Howler sounds.

function createWavDataUri(
  durationSec: number,
  generator: (time: number) => number,
  sampleRate: number = 44100
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF Header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");

  // "fmt " Subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" Subchunk
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generator(t);
    // Clamp to [-1, 1]
    sample = Math.max(-1, Math.min(1, sample));
    // Scale to 16-bit signed integer
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // Convert buffer to base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// ─── Sound Wave Synthesis Presets ─────────────────────────────────

// 1. Crystal Join Room Chime (Rising harmonic chord: E5 -> G#5 -> B5)
const joinSoundUri = createWavDataUri(0.45, (t) => {
  const env = Math.exp(-t * 5.5);
  let freq = 659.25; // E5
  if (t > 0.12) freq = 830.61; // G#5
  if (t > 0.24) freq = 987.77; // B5
  const wave1 = Math.sin(2 * Math.PI * freq * t);
  const wave2 = 0.3 * Math.sin(4 * Math.PI * freq * t);
  return env * (wave1 + wave2) * 0.4;
});

// 2. Soft Leave Room Chime (Gentle falling tone)
const leaveSoundUri = createWavDataUri(0.35, (t) => {
  const env = Math.exp(-t * 6.5);
  let freq = 783.99; // G5
  if (t > 0.14) freq = 523.25; // C5
  const wave = Math.sin(2 * Math.PI * freq * t);
  return env * wave * 0.35;
});

// 3. Mic Live / Unmuted Crisp Chime
const micOnUri = createWavDataUri(0.18, (t) => {
  const env = Math.exp(-t * 14.0);
  const freq = 880; // A5
  const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * 1760 * t);
  return env * wave * 0.35;
});

// 4. Mic Muted Soft Cue
const micOffUri = createWavDataUri(0.18, (t) => {
  const env = Math.exp(-t * 16.0);
  const freq = 440; // A4
  const wave = Math.sin(2 * Math.PI * freq * t);
  return env * wave * 0.3;
});

// 5. In-Meeting Chat Ping (Crystal glass chime)
const chatPingUri = createWavDataUri(0.28, (t) => {
  const env = Math.exp(-t * 8.0);
  const freq = 1046.5; // C6
  const wave = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * 2093 * t);
  return env * wave * 0.35;
});

// 6. HD Speaker Test Chime (Pristine 4-note ascending chord: C5 - E5 - G5 - C6)
const speakerTestUri = createWavDataUri(0.8, (t) => {
  const env = Math.exp(-t * 3.8);
  let freq = 523.25; // C5
  if (t > 0.15) freq = 659.25; // E5
  if (t > 0.30) freq = 783.99; // G5
  if (t > 0.45) freq = 1046.5; // C6
  const wave =
    0.6 * Math.sin(2 * Math.PI * freq * t) +
    0.3 * Math.sin(4 * Math.PI * freq * t) +
    0.1 * Math.sin(6 * Math.PI * freq * t);
  return env * wave * 0.5;
});

// ─── Howler Howl Instances ────────────────────────────────────────

const sounds = {
  join: new Howl({ src: [joinSoundUri], html5: false, volume: 0.6 }),
  leave: new Howl({ src: [leaveSoundUri], html5: false, volume: 0.5 }),
  micOn: new Howl({ src: [micOnUri], html5: false, volume: 0.5 }),
  micOff: new Howl({ src: [micOffUri], html5: false, volume: 0.5 }),
  chat: new Howl({ src: [chatPingUri], html5: false, volume: 0.55 }),
  speakerTest: new Howl({ src: [speakerTestUri], html5: false, volume: 0.75 }),
};

// Current active voice playback Howl instance
let activeVoiceHowl: Howl | null = null;

// ─── Exported Sound Effects API ───────────────────────────────────

export const soundEffects = {
  /**
   * Play crystal chime when user or peer joins the room
   */
  playJoin: () => {
    try {
      sounds.join.play();
    } catch (e) {
      console.debug("Howler join sound notice:", e);
    }
  },

  /**
   * Play gentle tone when peer leaves
   */
  playLeave: () => {
    try {
      sounds.leave.play();
    } catch (e) {
      console.debug("Howler leave sound notice:", e);
    }
  },

  /**
   * Play cue when microphone is unmuted (live)
   */
  playMicOn: () => {
    try {
      sounds.micOn.play();
    } catch (e) {
      console.debug("Howler mic on sound notice:", e);
    }
  },

  /**
   * Play cue when microphone is muted
   */
  playMicOff: () => {
    try {
      sounds.micOff.play();
    } catch (e) {
      console.debug("Howler mic off sound notice:", e);
    }
  },

  /**
   * Play ping when a new chat message is received
   */
  playChatMessage: () => {
    try {
      sounds.chat.play();
    } catch (e) {
      console.debug("Howler chat sound notice:", e);
    }
  },

  /**
   * Play pristine HD test chord for speaker/headphone check
   */
  playSpeakerTest: (onEnd?: () => void) => {
    try {
      if (onEnd) {
        sounds.speakerTest.once("end", onEnd);
      }
      sounds.speakerTest.play();
    } catch (e) {
      console.debug("Howler speaker test notice:", e);
    }
  },

  /**
   * Play back user's recorded mic test sample through Howler.js
   * so they can hear their crystal-clear voice fidelity!
   */
  playVoiceSample: (audioUrl: string, onEnd?: () => void) => {
    if (activeVoiceHowl) {
      activeVoiceHowl.stop();
      activeVoiceHowl.unload();
      activeVoiceHowl = null;
    }

    activeVoiceHowl = new Howl({
      src: [audioUrl],
      format: ["webm", "wav", "ogg", "mp3"],
      html5: true, // Use HTML5 Audio for Blob URLs
      volume: 1.0,
      onend: () => {
        if (onEnd) onEnd();
      },
      onloaderror: (_id, err) => {
        console.warn("Howler voice playback load notice:", err);
        if (onEnd) onEnd();
      },
      onplayerror: (_id, err) => {
        console.warn("Howler voice playback error notice:", err);
        if (onEnd) onEnd();
      },
    });

    activeVoiceHowl.play();
  },

  /**
   * Stop any active voice sample playback
   */
  stopVoiceSample: () => {
    if (activeVoiceHowl) {
      activeVoiceHowl.stop();
      activeVoiceHowl.unload();
      activeVoiceHowl = null;
    }
  },

  /**
   * Adjust master audio volume across the entire app (0.0 to 1.0)
   */
  setMasterVolume: (volume: number) => {
    Howler.volume(Math.max(0, Math.min(1, volume)));
  },

  /**
   * Get current master volume (0.0 to 1.0)
   */
  getMasterVolume: () => {
    return Howler.volume();
  },

  /**
   * Mute or unmute all Howler sound outputs
   */
  setMasterMute: (muted: boolean) => {
    Howler.mute(muted);
  },
};

export default soundEffects;
