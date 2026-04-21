/** Mirrors `backend/core/plans.py` for UI gating only; enforcement is server-side. */

const PLAN_FREE = 'Free';
const PLAN_STARTER = 'Starter';
const PLAN_PRO = 'Pro';
const PLAN_FOUNDING = 'Founding Member';

const ALLOWED_PROVIDERS: Record<string, Set<string> | null> = {
  [PLAN_FREE]: new Set(['anthropic', 'openai']),
  [PLAN_STARTER]: new Set(['anthropic', 'openai']),
  [PLAN_PRO]: null,
  [PLAN_FOUNDING]: null,
};

const ATTACHMENTS: Record<string, boolean> = {
  [PLAN_FREE]: false,
  [PLAN_STARTER]: false,
  [PLAN_PRO]: true,
  [PLAN_FOUNDING]: true,
};

function normalizePlan(planName: string | null | undefined): string {
  const p = (planName ?? '').trim();
  if (!p) return PLAN_FREE;
  return p;
}

function allowedProvidersForPlan(planName: string | null | undefined): Set<string> | null {
  const p = normalizePlan(planName);
  return ALLOWED_PROVIDERS[p] ?? ALLOWED_PROVIDERS[PLAN_FREE]!;
}

export function canUseProvider(planName: string | null | undefined, provider: string): boolean {
  const allowed = allowedProvidersForPlan(planName);
  if (allowed === null) return true;
  return allowed.has((provider || '').toLowerCase());
}

export function hasAttachments(planName: string | null | undefined): boolean {
  const p = normalizePlan(planName);
  return ATTACHMENTS[p] ?? ATTACHMENTS[PLAN_FREE];
}

export function isAiProviderListRestricted(planName: string | null | undefined): boolean {
  return allowedProvidersForPlan(planName) !== null;
}

export function isWorkspaceCountAtLimit(
  planName: string | null | undefined,
  currentCount: number,
): boolean {
  const p = normalizePlan(planName);
  const max: Record<string, number | null> = {
    [PLAN_FREE]: 1,
    [PLAN_STARTER]: 2,
    [PLAN_PRO]: null,
    [PLAN_FOUNDING]: null,
  };
  const limit = max[p] ?? max[PLAN_FREE];
  if (limit === null) return false;
  return currentCount >= limit;
}
