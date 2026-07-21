export type CreationState =
  | 'idle' | 'validating' | 'simulating_registry' | 'registry_wallet'
  | 'registry_confirming' | 'registry_verified' | 'simulating_factory'
  | 'factory_wallet' | 'factory_confirming' | 'onchain_verified'
  | 'indexer_pending' | 'api_visible' | 'complete' | 'rejected' | 'failed';

export const creationTransitions: Record<CreationState, CreationState[]> = {
  idle: ['validating'], validating: ['simulating_registry', 'failed'],
  simulating_registry: ['registry_wallet', 'failed'], registry_wallet: ['registry_confirming', 'rejected'],
  registry_confirming: ['registry_verified', 'failed'], registry_verified: ['simulating_factory', 'failed'],
  simulating_factory: ['factory_wallet', 'failed'], factory_wallet: ['factory_confirming', 'rejected'],
  factory_confirming: ['onchain_verified', 'failed'], onchain_verified: ['indexer_pending', 'failed'],
  indexer_pending: ['api_visible', 'failed'], api_visible: ['complete'], complete: [], rejected: [], failed: []
};

export function assertCreationTransition(from: CreationState, to: CreationState) {
  if (!creationTransitions[from].includes(to)) throw new Error(`Invalid creation transition: ${from} -> ${to}`);
}
