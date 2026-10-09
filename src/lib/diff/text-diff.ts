/**
 * EVIDENTIA Document Diff Engine
 * Produces structured line-by-line and token-level diffs with added/removed/unchanged blocks.
 */

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffSummary {
  additionsCount: number;
  deletionsCount: number;
  unchangedCount: number;
  lines: DiffLine[];
  hasChanges: boolean;
}

/**
 * Standard line-by-line diff algorithm using Longest Common Subsequence (LCS).
 */
export function computeTextDiff(originalText: string, modifiedText: string): DiffSummary {
  const origLines = originalText.split(/\r?\n/);
  const modLines = modifiedText.split(/\r?\n/);

  const n = origLines.length;
  const m = modLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble diff lines
  const lines: DiffLine[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      lines.unshift({
        type: "unchanged",
        content: origLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.unshift({
        type: "added",
        content: modLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      lines.unshift({
        type: "removed",
        content: origLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  let additionsCount = 0;
  let deletionsCount = 0;
  let unchangedCount = 0;

  for (const line of lines) {
    if (line.type === "added") additionsCount++;
    else if (line.type === "removed") deletionsCount++;
    else unchangedCount++;
  }

  return {
    additionsCount,
    deletionsCount,
    unchangedCount,
    lines,
    hasChanges: additionsCount > 0 || deletionsCount > 0,
  };
}
