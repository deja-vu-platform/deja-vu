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

/**
 * Attempt to turn a string into a DVHTML input-ready value
 * null, undefined, true, false, and numeric values are returned directly
 * surrounding quotes are stripped if they were necessary
 *    (i.e. it would be a non-string without them)
 * otherwise, they are assumed to be desired
 */
export function strToVal(
  str: string
): null | undefined | boolean | number | string {
  const keywords = {
    false: false,
    true: true,
    null: null,
    undefined: undefined
  };

  let checkStr = str;
  const inQuotes = str.match(/^'(.*)'$/) || str.match(/^"(.*)"$/);
  if (inQuotes) {
    checkStr = inQuotes[1];
  }

  if (checkStr in keywords) {
    return inQuotes ? `"${checkStr}"` : keywords[checkStr];
  }

  const valFloat = parseFloat(checkStr);
  if (!Number.isNaN(valFloat)) {
    return inQuotes ? `"${valFloat}"` : valFloat;
  }

  return JSON.stringify(str);
}
