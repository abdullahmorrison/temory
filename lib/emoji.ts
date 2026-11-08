/** True for a single emoji, including ones built from several code points (flags, skin tones, families). */
export function isOneEmoji(text: string) {
  return [...new Intl.Segmenter().segment(text)].length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(text);
}

/** The last emoji in what was typed, or "" if there is none. */
export function lastEmoji(text: string) {
  const graphemes = [...new Intl.Segmenter().segment(text)].map((g) => g.segment);
  return graphemes.findLast(isOneEmoji) ?? "";
}
