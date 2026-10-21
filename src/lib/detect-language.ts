/**
 * Détection gratuite et locale de la langue d'un texte (français ou anglais),
 * à partir de mots très courants. Sert à signaler qu'une prestation est écrite
 * dans une autre langue que celle du visiteur. Renvoie null si le texte est trop court
 * ou ambigu.
 */

const EN = new Set(["the", "and", "with", "you", "your", "will", "for", "this", "our", "are", "from", "include", "my", "can"]);
const FR = new Set(["le", "la", "les", "et", "avec", "vous", "votre", "pour", "une", "des", "est", "nous", "dans", "sur", "du"]);

export function detectLanguage(text: string): "fr" | "en" | null {
  const words = text.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿœ']+/g) ?? [];
  let en = 0;
  let fr = 0;
  for (const w of words) {
    if (EN.has(w)) en++;
    if (FR.has(w)) fr++;
  }
  if (en + fr < 3) return null;
  if (en > fr * 1.5) return "en";
  if (fr > en * 1.5) return "fr";
  return null;
}
