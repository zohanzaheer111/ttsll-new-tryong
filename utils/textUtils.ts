
/**
 * Splits text into sentence-safe chunks for the TTS API.
 * Rules:
 * - Each chunk 900-950 characters max.
 * - Chunk must end only at a full stop ".".
 * - If hitting 900 before ".", scan forward to next "." but don't exceed 950.
 * - If no "." before 950, use last "." before 950.
 */
export function splitTextIntoChunks(text: string, minChars = 900, maxChars = 950): string[] {
  const chunks: string[] = [];
  let remainingText = text.trim();

  while (remainingText.length > 0) {
    if (remainingText.length <= maxChars) {
      chunks.push(remainingText);
      break;
    }

    // Try to find a period between 900 and 950
    let splitIndex = -1;
    for (let i = minChars; i <= maxChars; i++) {
      if (remainingText[i] === '.') {
        splitIndex = i;
        break;
      }
    }

    // If not found, find the last period before 900
    if (splitIndex === -1) {
      for (let i = minChars - 1; i >= 0; i--) {
        if (remainingText[i] === '.') {
          splitIndex = i;
          break;
        }
      }
    }

    // If still no period found (unlikely for script but safe fallback), 
    // find the first period after maxChars (violates constraint but avoids breaking middle of words)
    // or just cut at maxChars if the user provided no punctuation.
    if (splitIndex === -1) {
      const nextPeriod = remainingText.indexOf('.', maxChars);
      if (nextPeriod !== -1 && nextPeriod < maxChars + 50) {
          splitIndex = nextPeriod;
      } else {
          // Absolute fallback to whitespace or just maxChars
          const lastSpace = remainingText.lastIndexOf(' ', maxChars);
          splitIndex = lastSpace !== -1 ? lastSpace : maxChars;
      }
    }

    const chunk = remainingText.substring(0, splitIndex + 1).trim();
    chunks.push(chunk);
    remainingText = remainingText.substring(splitIndex + 1).trim();
  }

  return chunks;
}

export function estimateStats(text: string) {
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const estimatedMin = (words / 150).toFixed(1);
  return { chars, words, estimatedMin };
}
