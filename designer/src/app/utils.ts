const ACRONYM_THRESHOLD = 3;

export function CamelToKebab(camelString: String) {
  const words = camelString.split(/(?=[A-Z])/);
  let i = 0;
  let numSingleLetters = 0;
  while (i < words.length) {
    if (words[i].length === 1) {
      numSingleLetters += 1;
    } else {
      if (numSingleLetters >= ACRONYM_THRESHOLD) {
        const firstSingleLetterIdx = i - numSingleLetters;
        const acronymSubsequence = words.slice(firstSingleLetterIdx, i - 1);
        words[firstSingleLetterIdx] = acronymSubsequence.join('');
        const numSlotsToDelete = acronymSubsequence.length - 1;
        words.splice(firstSingleLetterIdx + 1, numSlotsToDelete);
        i -= numSlotsToDelete;
      }
      numSingleLetters = 0;
    }
    i += 1;
  }

  return words.join('-')
    .toLowerCase();
}
