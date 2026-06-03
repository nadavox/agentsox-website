import { defineFaqClientRegistry, type FaqClientConfig } from '@agentsox/faq-agent';
import { agentsoxFaqClient } from './agentsox';
import { shadesOfSoulFaqClient } from './shades-of-soul';

/**
 * The clients this deployment serves, keyed by id (the `siteId` the frontend sends).
 * `defineFaqClientRegistry` keys each config by its own `id` and throws on
 * duplicates, so the key can never drift from the config it points at.
 *
 * To onboard a client: add `./<id>.ts` (+ `./<id>.faq.json`) next to this file and
 * list its config below. NEVER import from `../../test/` here - test fixtures must
 * not be able to ship.
 */
export const FAQ_CLIENTS: Record<string, FaqClientConfig> = defineFaqClientRegistry([
  shadesOfSoulFaqClient,
  agentsoxFaqClient,
]);
