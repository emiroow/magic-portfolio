import type { UseMutationResult } from '@tanstack/react-query';

/**
 * The record a mutation is currently working on.
 *
 * A list that spins every row's button while one request is in flight tells the owner
 * the wrong thing about their own data — it reads as "the whole archive is busy" when
 * one record is. Each row asks whether it is the one instead.
 *
 * Takes either shape the dashboard mutations use: a bare id for a delete, or the
 * document for a flag toggle.
 */
export function pendingRecordId<TData, TVariables>(mutation: UseMutationResult<TData, unknown, TVariables>): string | undefined {
  if (!mutation.isPending) return undefined;

  const variables: unknown = mutation.variables;
  if (typeof variables === 'string') return variables;
  if (variables && typeof variables === 'object') {
    const id = (variables as { _id?: unknown })._id;
    if (typeof id === 'string') return id;
  }
  return undefined;
}
