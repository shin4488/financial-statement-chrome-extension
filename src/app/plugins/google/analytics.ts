import StringUtil from '@/app/plugins/utils/stringUtil';

const getOrCreateClientIdasync = async () => {
  const clientIdStorageKey = 'investeeExtensionClientId';
  const clientId = localStorage.getItem(clientIdStorageKey);
  if (!StringUtil.isEmpty(clientId)) {
    return clientId as string;
  }

  // Generate a unique client ID, the actual value is not relevant
  const newClientId = self.crypto.randomUUID();
  localStorage.setItem(clientIdStorageKey, newClientId);
  return newClientId;
};

const logEventToAnalytics = async (eventName: string, params: Record<string, unknown>) => {
  // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?hl=ja&client_type=firebase#payload_query_parameters
  const uri = `https://www.google-analytics.com/mp/collect?measurement_id=${VITE_GOOGLE_MEASUREMENT_ID}V&=firebase_app_id=${VITE_GOOGLE_FIREBASE_APP_ID}&api_secret=${VITE_GOOGLE_ANALYTICS_API_KEY}`;
  return await fetch(uri, {
    method: 'POST',
    body: JSON.stringify({
      client_id: await getOrCreateClientIdasync(),
      events: [
        {
          name: eventName,
          params: { ...params, engagement_time_msec: 100, session_id: new Date().getTime() },
        },
      ],
    }),
  });
};

export const logLoadStatementsEventToAnalytics = async (siteDomain: string, stockCode: string) => {
  return await logEventToAnalytics('load_statements', {
    site_domain_name: siteDomain,
    stock_code: stockCode,
  });
};
