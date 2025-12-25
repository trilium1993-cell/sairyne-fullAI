import { API_URL } from '../config/api';
import { getOrCreateInstallId } from './installId';

export type AnalyticsEventName =
  | 'PluginOpened'
  | 'PluginClosed'
  | 'VisualTipClicked'
  | 'AIMessageSent'
  | 'SignInSuccess'
  | 'RegisterSuccess'
  | 'ProjectCreated'
  | 'ProjectOpened'
  | 'ChatMessageSent'
  | 'ClearChat'
  | 'ResetLocalData';

type AnalyticsPayload = Record<string, unknown>;

const ANALYTICS_ENDPOINT = '/api/analytics/event';

export class AnalyticsService {
  static async track(event: AnalyticsEventName, payload: AnalyticsPayload = {}): Promise<void> {
    try {
      const installId = getOrCreateInstallId();
      await fetch(`${API_URL}${ANALYTICS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: event,
          payload: {
            ...payload,
            installId,
            source: 'plugin',
          },
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
