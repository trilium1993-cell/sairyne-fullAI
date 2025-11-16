import { API_URL } from '../config/api';

export type AnalyticsEventName =
  | 'PluginOpened'
  | 'PluginClosed'
  | 'VisualTipClicked'
  | 'AIMessageSent';

type AnalyticsPayload = Record<string, unknown>;

const ANALYTICS_ENDPOINT = '/analytics/event';

export class AnalyticsService {
  static async track(event: AnalyticsEventName, payload: AnalyticsPayload = {}): Promise<void> {
    try {
      await fetch(`${API_URL}${ANALYTICS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: event,
          payload,
          timestamp: Date.now(),
        }),
        keepalive: true,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[analytics] track failed', error);
      }
    }
  }
}
