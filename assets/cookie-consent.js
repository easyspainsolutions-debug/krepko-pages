/* Krepko — Cookie Consent + GA gate.
   - localStorage key: krepko_consent_v1 ('all' | 'essential')
   - If 'all' → load Google Analytics 4 (with IP anonymization)
   - If 'essential' or no choice → no GA load
   - Banner shown only if no choice yet
   - window.krepkoResetConsent() — re-show banner from /cookies/ page
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'krepko_consent_v1';
  var GA_ID = 'G-8F3TB9QMLY';

  function getConsent() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch (_) { return null; }
  }

  function setConsent(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); }
    catch (_) { /* private browsing — silently ignore */ }
  }

  function loadGA() {
    if (window.__krepkoGaLoaded) return;
    window.__krepkoGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-consent');
    if (banner) banner.setAttribute('hidden', '');
  }

  function showBanner() {
    var banner = document.getElementById('cookie-consent');
    if (banner) banner.removeAttribute('hidden');
  }

  function onBannerClick(e) {
    var btn = e.target.closest('[data-consent]');
    if (!btn) return;
    var value = btn.getAttribute('data-consent');
    if (value !== 'all' && value !== 'essential') return;
    setConsent(value);
    if (value === 'all') loadGA();
    hideBanner();
  }

  function init() {
    var consent = getConsent();
    if (consent === 'all') {
      loadGA();
      hideBanner();
    } else if (consent === 'essential') {
      hideBanner();
    } else {
      showBanner();
    }
    var banner = document.getElementById('cookie-consent');
    if (banner) banner.addEventListener('click', onBannerClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Allow re-managing consent from /cookies/ policy page.
  window.krepkoResetConsent = function () {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    window.location.reload();
  };
})();
