/**
 * Deterministic sync identity per judge + stream + project + round.
 * Matches judgments PK columns on server.
 */
export function judgmentSyncKey(
  judgeId: string,
  streamId: string,
  projectId: string,
  round = 1
): string {
  return `${judgeId}:${streamId}:${projectId}:r${round}`;
}

export function parseRoundFromSearchParam(raw?: string): number {
  const n = Number(raw ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}
