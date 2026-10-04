/**
 * Professional Real-time Singlish to Sinhala Unicode Transliteration Engine
 * Accurate mapping of consonants, independent vowels, and dependent vowel signs (Pili: ispili, papili, kombu, aela-pili, aeda-pili)
 */

export const COMMON_SINHALA_PHRASES = [
  { singlish: "ayubowan", sinhala: "ආයුබෝවන්!", desc: "Greeting / Welcome" },
  { singlish: "kohomada", sinhala: "කොහොමද? ඔබට කෙසේද උදව් කළ හැක්කේ?", desc: "How are you? How can we help?" },
  { singlish: "sthuthi", sinhala: "ස්තූතියි! අප හා සම්බන්ධ වීම ගැන.", desc: "Thank you for contacting us" },
  { singlish: "order wisthara", sinhala: "කරුණාකර ඔබගේ ඇණවුම් අංකය (Order #) එවන්න.", desc: "Request Order Number" },
  { singlish: "mila ganan", sinhala: "අපගේ පැකේජ සහ මිල ගණන් විස්තර මෙන්න:", desc: "Pricing & Packages info" },
  { singlish: "agent enawa", sinhala: "මදක් රැඳී සිටින්න, අපගේ නියෝජිතයෙකු සම්බන්ධ වනු ඇත.", desc: "Human Agent connecting" },
  { singlish: "wada welawa", sinhala: "අපගේ සේවා වේලාවන්: සඳුදා - සිකුරාදා පෙ.ව. 8.30 - ප.ව. 5.30 දක්වා.", desc: "Business Hours" },
  { singlish: "samawenna", sinhala: "සිදුවූ ප්‍රමාදයට අපගේ බලවත් කණගාටුව.", desc: "Apology for delay" },
];

const CONSONANTS: [string, string][] = [
  ["sh", "ශ"], ["Sh", "ෂ"], ["ch", "ච"], ["th", "ත"], ["dh", "ද"],
  ["kh", "ඛ"], ["gh", "ඝ"], ["jh", "ඣ"], ["Th", "ඨ"], ["Dh", "ඪ"],
  ["ph", "ඵ"], ["bh", "භ"], ["ng", "ඟ"], ["nd", "ඳ"], ["mb", "ඹ"],
  ["kn", "ඤ"], ["gn", "ඥ"], ["k", "ක"], ["g", "ග"], ["j", "ජ"],
  ["t", "ට"], ["d", "ඩ"], ["N", "ණ"], ["n", "න"], ["p", "ප"],
  ["b", "බ"], ["m", "ම"], ["y", "ය"], ["r", "ර"], ["l", "ල"],
  ["v", "ව"], ["w", "ව"], ["s", "ස"], ["h", "හ"], ["f", "ෆ"],
  ["L", "ළ"]
];

const VOWEL_PILI: [string, string][] = [
  ["aae", "ෑ"], ["aai", "ායි"], ["aaw", "ාව්"], ["aau", "ාවු"],
  ["aa", "ා"], ["A", "ා"], ["ae", "ැ"], ["ai", "ෛ"], ["au", "ෞ"],
  ["ee", "ී"], ["ii", "ී"], ["I", "ී"], ["i", "ි"],
  ["oo", "ූ"], ["uu", "ූ"], ["U", "ූ"], ["u", "ු"],
  ["ea", "ේ"], ["ei", "ේ"], ["E", "ේ"], ["e", "ෙ"],
  ["oe", "ෝ"], ["oi", "ොයි"], ["O", "ෝ"], ["o", "ො"],
  ["a", ""]
];

const INDEPENDENT_VOWELS: [string, string][] = [
  ["aae", "ඈ"], ["aa", "ආ"], ["A", "ආ"], ["ae", "ඇ"], ["ai", "ඓ"],
  ["au", "ඖ"], ["ee", "ඊ"], ["ii", "ඊ"], ["i", "ඉ"], ["oo", "ඌ"],
  ["uu", "ඌ"], ["u", "උ"], ["ea", "ඒ"], ["e", "එ"], ["oe", "ඕ"],
  ["o", "ඔ"], ["a", "අ"]
];

/**
 * Transliterates Singlish input text into proper Sinhala Unicode
 * Handles real-time incremental keystrokes where preceding consonants have Hal (්)
 * and vowel modifiers (ispili, papili, kombu, etc.) replace the Hal.
 */
export function transliterateSinglishToSinhala(text: string): string {
  if (!text) return "";

  let s = text;

  // 1. Direct word replacements for very common words with non-standard spelling
  const specialMap: Record<string, string> = {
    "ayubowan": "ආයුබෝවන්",
    "Ayubowan": "ආයුබෝවන්",
    "sthuthi": "ස්තූතියි",
    "sthutiyi": "ස්තූතියි",
    "Sthuthi": "ස්තූතියි",
    "kohomada": "කොහොමද",
    "Kohomada": "කොහොමද",
    "puluwan": "පුළුවන්",
    "Puluwan": "පුළුවන්",
    "hari": "හරි",
    "Hari": "හරි",
    "bohoma": "බොහොම",
    "karunakara": "කරුණාකර",
    "Karunakara": "කරුණාකර",
  };

  for (const [en, si] of Object.entries(specialMap)) {
    const regex = new RegExp(`\\b${en}\\b`, "g");
    s = s.replace(regex, si);
  }

  // 2. Real-time typing: Hal (්) followed by English vowel/modifiers
  // e.g. "ස්" + "i" -> "සි", "ක" + "්" + "u" -> "කු", "ම" + "්" + "a" -> "ම"
  for (const [vStr, vPili] of VOWEL_PILI) {
    const regex = new RegExp(`්${vStr}`, "g");
    s = s.replace(regex, vPili);
  }

  // 3. Double vowel extensions on existing vowel signs:
  // e.g. "ක" (inherent a) + "a" -> "කා"
  // "කි" + "i" or "e" -> "කී"
  // "කු" + "u" or "o" -> "කූ"
  // "කෙ" + "e" -> "කේ"
  // "කො" + "o" -> "කෝ"
  // "කැ" + "e" -> "කෑ"
  s = s.replace(/([ක-ෆ])a/g, "$1ා");
  s = s.replace(/([ක-ෆ])i/g, "$1ී");
  s = s.replace(/([ක-ෆ])u/g, "$1ූ");
  s = s.replace(/([ක-ෆ])e/g, "$1ේ");
  s = s.replace(/([ක-ෆ])o/g, "$1ෝ");

  // Upgrade single is-pilla to double is-pilla: ි + i -> ී
  s = s.replace(/ිi/g, "ී");
  s = s.replace(/ිe/g, "ී");

  // Upgrade single paa-pilla to double paa-pilla: ු + u -> ූ
  s = s.replace(/ුu/g, "ූ");
  s = s.replace(/ුo/g, "ූ");

  // Upgrade kombuva to diga kombuva: ෙ + e -> ේ
  s = s.replace(/ෙe/g, "ේ");

  // Upgrade kombuva ha aela-pilla to diga: ො + o -> ෝ
  s = s.replace(/ොo/g, "ෝ");

  // Upgrade aeda-pilla to diga aeda-pilla: ැ + e -> ෑ
  s = s.replace(/ැe/g, "ෑ");

  // 4. Whole-word / multi-char consonant + vowel patterns
  for (const [cStr, cChar] of CONSONANTS) {
    for (const [vStr, vPili] of VOWEL_PILI) {
      const combo = cStr + vStr;
      s = s.replace(new RegExp(combo, "g"), cChar + vPili);
    }
  }

  // 5. Standalone English consonants (default to Hal: ්)
  for (const [cStr, cChar] of CONSONANTS) {
    s = s.replace(new RegExp(cStr, "g"), cChar + "්");
  }

  // 6. Standalone Independent Vowels (at beginning of word or after space)
  for (const [vStr, vChar] of INDEPENDENT_VOWELS) {
    s = s.replace(new RegExp(vStr, "g"), vChar);
  }

  // 7. Special Sinhala phonetic nuances:
  // "න්හ" in words like "සින්හල" -> "සිංහල" (Anusvaraya)
  s = s.replace(/න්හ/g, "ංහ");
  s = s.replace(/න්ස්/g, "ංස්");

  return s;
}
