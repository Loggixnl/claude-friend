import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getLanguageFlag(languageCode: string): string {
  const flagMap: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    ru: "🇷🇺",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ar: "🇸🇦",
    hi: "🇮🇳",
    nl: "🇳🇱",
    pl: "🇵🇱",
    tr: "🇹🇷",
    vi: "🇻🇳",
    th: "🇹🇭",
    id: "🇮🇩",
    uk: "🇺🇦",
    cs: "🇨🇿",
    sv: "🇸🇪",
    da: "🇩🇰",
    fi: "🇫🇮",
    no: "🇳🇴",
    el: "🇬🇷",
    he: "🇮🇱",
    hu: "🇭🇺",
    ro: "🇷🇴",
    sk: "🇸🇰",
    bg: "🇧🇬",
    hr: "🇭🇷",
    sr: "🇷🇸",
    sl: "🇸🇮",
    et: "🇪🇪",
    lv: "🇱🇻",
    lt: "🇱🇹",
    ms: "🇲🇾",
    tl: "🇵🇭",
    bn: "🇧🇩",
  };
  return flagMap[languageCode] || "🌐";
}

export function getLanguageName(languageCode: string): string {
  const nameMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    vi: "Vietnamese",
    th: "Thai",
    id: "Indonesian",
    uk: "Ukrainian",
    cs: "Czech",
    sv: "Swedish",
    da: "Danish",
    fi: "Finnish",
    no: "Norwegian",
    el: "Greek",
    he: "Hebrew",
    hu: "Hungarian",
    ro: "Romanian",
    sk: "Slovak",
    bg: "Bulgarian",
    hr: "Croatian",
    sr: "Serbian",
    sl: "Slovenian",
    et: "Estonian",
    lv: "Latvian",
    lt: "Lithuanian",
    ms: "Malay",
    tl: "Filipino",
    bn: "Bengali",
  };
  return nameMap[languageCode] || languageCode.toUpperCase();
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
];

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
