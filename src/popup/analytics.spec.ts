import { trackEvent } from './analytics';

describe('popup analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.assign(global, {
      ANALYTICS_ENABLED: true,
      EXTENSION_VERSION: '1.4.0',
      fetch: jest.fn().mockResolvedValue({ ok: true }),
    });
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => '12345678-1234-4234-8234-123456789012',
    });
    jest.spyOn(Date, 'now').mockReturnValue(1_789_870_000_000);
  });
  afterEach(() => jest.restoreAllMocks());

  const sent = (index = 0) => JSON.parse((fetch as jest.Mock).mock.calls[index][1].body);

  it('uses the first-party relay without bundling or transmitting a secret', () => {
    trackEvent('popup_open', { site_domain_name: 'kabutan.jp' });
    expect(fetch).toHaveBeenCalledWith(
      'https://investee.info/api/analytics/extension',
      expect.objectContaining({ keepalive: true, credentials: 'omit' }),
    );
    expect(sent()).toEqual({
      client_id: '12345678-1234-4234-8234-123456789012',
      session_id: 1_789_870_000,
      name: 'popup_open',
      params: {
        site_domain_name: 'kabutan.jp',
        extension_version: '1.4.0',
        engagement_time_msec: expect.any(Number),
      },
    });
  });

  it('keeps a session across interactions and rolls it after 30 minutes of inactivity', () => {
    trackEvent('popup_open');
    jest.spyOn(Date, 'now').mockReturnValue(1_789_870_010_000);
    trackEvent('analysis_interaction', { interaction_type: 'autoplay_off' });
    expect(sent(1).session_id).toBe(sent().session_id);
    jest.spyOn(Date, 'now').mockReturnValue(1_789_871_810_000);
    trackEvent('popup_open');
    expect(sent(2).session_id).toBe(1_789_871_810);
    expect(sent(2).client_id).toBe(sent().client_id);
  });

  it('does not send development activity and replaces unknown domains', () => {
    Object.assign(global, { ANALYTICS_ENABLED: false });
    trackEvent('popup_open');
    expect(fetch).not.toHaveBeenCalled();
    Object.assign(global, { ANALYTICS_ENABLED: true });
    trackEvent('popup_open', { site_domain_name: 'private.example' });
    expect(sent().params.site_domain_name).toBe('unknown');
  });

  it('recovers corrupt session data and contains blocked storage and failed requests', async () => {
    localStorage.setItem('investeeExtensionAnalyticsSession', '{broken');
    (fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    expect(() => trackEvent('popup_open')).not.toThrow();
    await Promise.resolve();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => trackEvent('popup_open')).not.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

it('honors the persisted collection opt-out before creating an identifier or request', () => {
  localStorage.clear();
  localStorage.setItem('investeeExtensionAnalyticsEnabled', 'false');
  Object.assign(global, { ANALYTICS_ENABLED: true, fetch: jest.fn() });
  trackEvent('popup_open');
  expect(fetch).not.toHaveBeenCalled();
  expect(localStorage.getItem('investeeExtensionClientId')).toBeNull();
});
