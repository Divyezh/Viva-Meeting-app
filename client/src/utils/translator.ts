// ─── Real-Time Speech Translator & Common Hindi Phrases Dictionary ───

const translationCache = new Map<string, string>();

// High-frequency Hindi/Hinglish phrases commonly spoken in video meetings
const HINDI_PHRASE_MAP: Record<string, string> = {
  "नमस्ते": "Hello everyone",
  "नमस्कार": "Greetings",
  "आप कैसे हैं": "How are you all?",
  "क्या आप मुझे सुन सकते हैं": "Can you hear me?",
  "मेरी आवाज आ रही है": "Is my audio audible?",
  "मेरी आवाज आ रही है क्या": "Can you hear my voice?",
  "मेरी आवाज़ आ रही है": "Can you hear my voice?",
  "स्क्रीन दिख रही है": "Is my screen visible?",
  "स्क्रीन दिख रही है क्या": "Can you see my screen?",
  "हां": "Yes",
  "हाँ": "Yes",
  "नहीं": "No",
  "ठीक है": "Okay, alright",
  "बिल्कुल": "Absolutely",
  "समझ गया": "Understood",
  "धन्यवाद": "Thank you",
  "शुक्रिया": "Thank you very much",
  "अलविदा": "Goodbye",
  "शुरू करते हैं": "Let's begin",
  "अगला विषय": "Next topic",
  "कोई सवाल": "Any questions?",
  "कोई प्रश्न": "Any queries?",
  "मैं स्क्रीन शेयर कर रहा हूँ": "I am sharing my screen",
  "मैं स्क्रीन शेयर कर रहा हूं": "I am sharing my screen",
  "क्या आप देख सकते हैं": "Can you see this?",
  "दो मिनट रुकिए": "Please wait for two minutes",
  "एक सेकंड": "Just a second",
  "बहुत बढ़िया": "Great job, wonderful",
  "शानदार": "Awesome, fantastic",
  "मैं म्यूट पर था": "I was on mute",
  "आप म्यूट पर हैं": "You are on mute",
  "कृपया अनम्यूट करें": "Please unmute yourself",
};

/**
 * Fallback dictionary match for common Hindi words/phrases
 */
export function getHindiMeetingPhraseTranslation(hindiText: string): string | null {
  const clean = hindiText.trim().toLowerCase();
  for (const [key, val] of Object.entries(HINDI_PHRASE_MAP)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return val;
    }
  }
  return null;
}

/**
 * Translates speech text from source language to target language in real-time.
 * Default: Hindi (hi) -> English (en).
 */
export async function translateText(
  text: string,
  sourceLang: string = "hi-IN",
  targetLang: string = "en"
): Promise<{ translatedText: string; originalText: string }> {
  if (!text || !text.trim()) {
    return { translatedText: "", originalText: "" };
  }

  const cleanText = text.trim();
  const src = sourceLang.split("-")[0].toLowerCase();
  const tgt = targetLang.split("-")[0].toLowerCase();

  // If source and target are the same language, no translation needed
  if (src === tgt) {
    return { translatedText: cleanText, originalText: cleanText };
  }

  const cacheKey = `${src}_${tgt}_${cleanText.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return {
      translatedText: translationCache.get(cacheKey)!,
      originalText: cleanText,
    };
  }

  // 1. Try Google Translate API (fast, free, public gtx endpoint)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(
      cleanText
    )}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: any) => (item && item[0] ? item[0] : ""))
          .join("")
          .trim();
        if (translated) {
          translationCache.set(cacheKey, translated);
          return { translatedText: translated, originalText: cleanText };
        }
      }
    }
  } catch (err) {
    console.debug("Translation API network notice:", err);
  }

  // 2. Try Local Hindi meeting phrase dictionary
  if (src === "hi") {
    const dictResult = getHindiMeetingPhraseTranslation(cleanText);
    if (dictResult) {
      translationCache.set(cacheKey, dictResult);
      return { translatedText: dictResult, originalText: cleanText };
    }
  }

  // Fallback to original text if translation service unavailable
  return { translatedText: cleanText, originalText: cleanText };
}
