/**
 * River Edge — riveredge.js
 *
 * Loaded in page-footer region so the DOM is fully built when this runs.
 * document.body is always available — no DOMContentLoaded dance needed.
 */
(function (window, document) {
  'use strict';

  var STORAGE_KEY  = 'riveredge-theme';
  var ACCORDION_BP = 600;
  var TABLE_BP     = 768;
  var html         = document.documentElement;

  /* ─── 1. Theme — apply saved preference ──────────────────────────────────── */

  function getSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function savePref(v) {
    try { if (v) { localStorage.setItem(STORAGE_KEY, v); } else { localStorage.removeItem(STORAGE_KEY); } }
    catch (e) {}
  }

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      html.setAttribute('data-riveredge-theme', theme);
    } else {
      html.removeAttribute('data-riveredge-theme');
    }
  }

  // This was already called at the top of the INLINE script below.
  // Called again here as a safety net.
  applyTheme(getSaved());

  /* ─── 2. Theme toggle button ─────────────────────────────────────────────── */

  // Simple two-state toggle: dark ↔ light only.
  // Defaults to light if no preference saved.
  function getState()  { var s = getSaved(); return s === 'dark' ? 'dark' : 'light'; }
  function nextState(s){ return s === 'dark' ? 'light' : 'dark'; }

  function injectToggle() {
    if (document.getElementById('riveredge-theme-toggle')) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'riveredge-theme-toggle-wrapper';
    wrapper.style.cssText = 'position:fixed;top:0;right:80px;height:44px;display:flex;align-items:center;z-index:2147483647;pointer-events:all;';

    var btn = document.createElement('button');
    btn.id   = 'riveredge-theme-toggle';
    btn.type = 'button';
    btn.style.cssText = 'background:rgba(0,0,0,0.55);color:#fff;border:1px solid rgba(255,255,255,0.25);border-radius:4px;padding:0 10px;height:32px;cursor:pointer;font-size:13px;font-family:inherit;display:flex;align-items:center;gap:5px;white-space:nowrap;line-height:1;';

    // Dark uses a crescent SVG (inline, no emoji); Light uses ☀.
    var iconMap  = { dark: '\u263D', light: '\u2600' };
    var labelMap = { dark: 'Dark', light: 'Light' };

    function refresh() {
      var next = nextState(getState());
      btn.textContent = iconMap[next] + '\u00a0' + labelMap[next];
      btn.title = 'Switch to ' + labelMap[next];
    }

    refresh();

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var next = nextState(getState());
      applyTheme(next);
      savePref(next);
      refresh();
    });

    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);
    console.log('[riveredge] toggle injected');
  }

  // Inject now (DOM is ready — we are in page-footer).
  injectToggle();

  // Also inject after AJAX menu load, in case it fires after us.
  if (window.CRM && CRM.$) {
    CRM.$(document).on('crmLoad.riveredge', function (e) {
      if (e.target && e.target.id === 'civicrm-menu') { injectToggle(); }
    });
  }

  // Last-resort: retry a few times in case of unusual load order.
  var _retries = 0;
  var _retryTimer = setInterval(function () {
    injectToggle();
    if (++_retries >= 20 || document.getElementById('riveredge-theme-toggle')) {
      clearInterval(_retryTimer);
    }
  }, 500);

  /* ─── 3. Table → card: stamp data-label on <td>s ────────────────────────── */

  var TABLE_SEL = 'table.dataTable,table.display,table.crm-ajax-table,' +
                  'table.crm-data-table,table.crm-entity-table,table.crm-results-table';

  function stampTable(table) {
    var headers = [];
    table.querySelectorAll('thead th').forEach(function (th) {
      headers.push((th.textContent || '').trim());
    });
    if (!headers.length) return;
    table.querySelectorAll('tbody tr').forEach(function (row) {
      row.querySelectorAll('td').forEach(function (cell, i) {
        cell.setAttribute('data-label', headers[i] !== undefined ? headers[i] : '');
      });
    });
  }

  function stampAll(root) {
    if (window.innerWidth > TABLE_BP) return;
    (root || document).querySelectorAll(TABLE_SEL).forEach(stampTable);
  }

  stampAll();

  /* ─── 4. Contact tabs → accordion ───────────────────────────────────────── */

  function getTabLabel(li) {
    var a = li.querySelector('a');
    if (!a) return '';
    var clone = a.cloneNode(true);
    clone.querySelectorAll('i,svg,.crm-i,.fa').forEach(function (el) { el.parentNode.removeChild(el); });
    var t = clone.textContent.trim();
    if (t) return t;
    return (a.getAttribute('aria-label') || a.getAttribute('title') || '').trim();
  }

  function buildAccordion(tc) {
    if (tc.dataset.riveredgeAccordion === 'done') return;

    var navItems = Array.from(tc.querySelectorAll('.crm-contact-tabs-list > li,.ui-tabs-nav > li'));
    var panels   = Array.from(tc.querySelectorAll('.ui-tabs-panel,[id^="tab_"]'));
    if (!navItems.length || !panels.length) return;

    tc.classList.add('riveredge-accordion-active');

    navItems.forEach(function (item, idx) {
      var panel = panels[idx];
      if (!panel) return;
      var label = getTabLabel(item) || ('Tab ' + (idx + 1));

      var trigger = document.createElement('div');
      trigger.className = 'riveredge-accordion-trigger';
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = '<span>' + label + '</span><span class="riveredge-acc-icon" aria-hidden="true">&#9658;</span>';

      var body = document.createElement('div');
      body.className = 'riveredge-accordion-body';

      panel.parentNode.insertBefore(trigger, panel);
      panel.parentNode.insertBefore(body, panel);
      body.appendChild(panel);

      function toggle(open) {
        trigger.classList.toggle('open', open);
        body.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
        if (open) {
          panel.style.display = '';
          if (window.CRM && CRM.$) { try { CRM.$('#mainTabContainer').tabs('option', 'active', idx); } catch(e) {} }
          stampAll(panel);
        }
      }

      trigger.addEventListener('click', function () { toggle(!trigger.classList.contains('open')); });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(!trigger.classList.contains('open')); }
      });
    });

    var first = tc.querySelector('.riveredge-accordion-trigger');
    if (first) first.click();
    tc.dataset.riveredgeAccordion = 'done';
  }

  function teardownAccordion(tc) {
    if (tc.dataset.riveredgeAccordion !== 'done') return;
    tc.querySelectorAll('.riveredge-accordion-body').forEach(function (b) {
      while (b.firstChild) { b.parentNode.insertBefore(b.firstChild, b); }
      b.parentNode.removeChild(b);
    });
    tc.querySelectorAll('.riveredge-accordion-trigger').forEach(function (t) { t.parentNode.removeChild(t); });
    tc.classList.remove('riveredge-accordion-active');
    delete tc.dataset.riveredgeAccordion;
  }

  function handleTabs() {
    var tc = document.querySelector('.crm-contact-page #mainTabContainer.ui-tabs');
    if (!tc) return;
    if (window.innerWidth <= ACCORDION_BP) { buildAccordion(tc); } else { teardownAccordion(tc); }
  }

  handleTabs();

  if (window.CRM && CRM.$) {
    CRM.$(document).on('draw.dt',          function (e) { stampTable(e.target); });
    CRM.$(document).on('crmLoad',          function (e) { stampAll(e.target); handleTabs(); });
    CRM.$(document).on('tabsactivate tabscreate', function (e, ui) {
      var p = ui && (ui.newPanel || ui.panel);
      if (p && p[0]) stampAll(p[0]);
    });
  }

  var _rz;
  window.addEventListener('resize', function () {
    clearTimeout(_rz);
    _rz = setTimeout(function () { stampAll(); handleTabs(); }, 200);
  });

}(window, document));
