import type { DonationMode } from '@/features/support/types';

/**
 * The stops of the checkout wizard.
 *
 * A method that moves money passes through the supporter's details and a payment
 * surface; a free gesture skips both, because there is nothing to record and nothing
 * to charge. Keeping the flow in one function is what lets a new support type be
 * added to `DonationMode` without touching the step components.
 */
export type Step = 'choose' | 'details' | 'method' | 'action';

/** Method, destination and amount → details → whatever the rail asks for. */
const MONEY_STEPS: Step[] = ['choose', 'details', 'method'];

/** Method and destination → open the page the gesture is made on. */
const ACTION_STEPS: Step[] = ['choose', 'action'];

/** The steps of one method, in the order they are walked. */
export function stepsFor(mode: DonationMode | undefined): Step[] {
  return mode === 'action' ? ACTION_STEPS : MONEY_STEPS;
}

/** The step a flow opens on; anything outside the flow folds back to it. */
export function clampStep(step: Step, flow: Step[]): Step {
  return flow.includes(step) ? step : 'choose';
}
