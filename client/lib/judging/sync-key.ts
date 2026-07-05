/**
 * Deterministic sync identity per judge + stream + project.
 * Used as the client queue dedupe key and matches judgments PK columns on server.
 */
export function judgmentSyncKey(
  judgeId: string,
  streamId: string,
  projectId: string
): string {
  return `${judgeId}:${streamId}:${projectId}`;
}
