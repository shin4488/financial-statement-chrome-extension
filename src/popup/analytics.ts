import { getValidSiteInstance } from '@/background/siteClassMapper';

type EventName = 'popup_open' | 'report_result' | 'analysis_interaction' | 'outbound_click';
export type EventParams = {
  site_domain_name?: string;
  result_status?: 'success' | 'empty' | 'error';
  result_count?: number;
  unavailable_count?: number;
  interaction_type?: 'chart_navigation' | 'autoplay_on' | 'autoplay_off';
  chart_type?: 'bs' | 'pl' | 'cf' | 'indicators';
  link_domain?: 'kabutan.jp' | 'investee.info';
};

const clientKey = 'investeeExtensionClientId';
const sessionKey = 'investeeExtensionAnalyticsSession';
const sessionTimeout = 30 * 60 * 1000;
let previousEventTime = performance.now();

// 計測はポップアップ内の操作だけ。タブの移動履歴や銘柄・URL・企業名は送らない。
export function trackEvent(name: EventName, params: EventParams = {}): void {
  if (!ANALYTICS_ENABLED) {
    return;
  }
  try {
    if (localStorage.getItem('investeeExtensionAnalyticsEnabled') === 'false') {
      return;
    }
    let clientId = localStorage.getItem(clientKey);
    if (
      !clientId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)
    ) {
      clientId = crypto.randomUUID();
      localStorage.setItem(clientKey, clientId);
    }
    const now = Date.now();
    let session: { id: number; lastActive: number } | null = null;
    try {
      session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    } catch {
      // 古い・壊れた保存値は新しいセッションで回復する。
    }
    if (
      !session ||
      !Number.isInteger(session.id) ||
      session.id <= 0 ||
      session.id > 9_999_999_999 ||
      !Number.isFinite(session.lastActive) ||
      now - session.lastActive >= sessionTimeout ||
      now < session.lastActive
    ) {
      session = { id: Math.floor(now / 1000), lastActive: now };
    }
    session.lastActive = now;
    localStorage.setItem(sessionKey, JSON.stringify(session));
    const elapsed = Math.max(
      1,
      Math.min(3_600_000, Math.round(performance.now() - previousEventTime)),
    );
    previousEventTime = performance.now();
    const safeParams = { ...params };
    if (safeParams.site_domain_name && !getValidSiteInstance(safeParams.site_domain_name)) {
      safeParams.site_domain_name = 'unknown';
    }
    // 秘密キーはサーバだけが持つ。host_permissionsは既存のinvestee.infoを使用。
    void fetch('https://investee.info/api/analytics/extension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      keepalive: true,
      body: JSON.stringify({
        client_id: clientId,
        session_id: session.id,
        name,
        params: {
          ...safeParams,
          engagement_time_msec: elapsed,
          extension_version: EXTENSION_VERSION,
        },
      }),
    }).catch(() => undefined);
  } catch {
    // ストレージ制限・広告ブロック・通信障害があっても本来の機能を止めない。
  }
}
