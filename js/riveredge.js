/**
 * River Edge — riveredge.js
 *
 * Loaded in page-footer region so the DOM is fully built when this runs.
 * document.body is always available — no DOMContentLoaded dance needed.
 */
(function (window, document) {
  'use strict';

  var STORAGE_KEY  = 'riveredge-theme';
  var ACCORDION_BP = 767;
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

  function positionToggle() {
    var wrapper = document.getElementById('riveredge-theme-toggle-wrapper');
    if (!wrapper) return;

    // --crm-menubar-bottom is set by CiviCRM's crm.menubar.js to the pixel
    // bottom-edge of the nav bar (viewport px, e.g. "81px").  It is reliable
    // across page types and doesn't depend on the nav's position property.
    var raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--crm-menubar-bottom').trim();
    var bottom = parseFloat(raw);

    if (bottom > 0) {
      // Use a fixed nav height of 44px; top = bottom - height.
      var h = 44;
      //wrapper.style.top    = Math.max(0, bottom - h) + 'px';
      wrapper.style.top    = '0px';
      wrapper.style.height = h + 'px';
    }
    // If the variable isn't set yet the wrapper keeps its current style;
    // the retry loop will call us again until it appears.
  }

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
    positionToggle();
    console.log('[riveredge] toggle injected');
  }

  // Inject now (DOM is ready — we are in page-footer).
  injectToggle();

  // Reposition on resize (handles orientation change, window resize, etc.)
  window.addEventListener('resize', positionToggle);

  // Also inject after AJAX menu load, in case it fires after us.
  if (window.CRM && CRM.$) {
    CRM.$(document).on('crmLoad.riveredge', function (e) {
      if (e.target && e.target.id === 'civicrm-menu') { injectToggle(); positionToggle(); }
    });
  }

  // Last-resort: retry a few times in case of unusual load order.
  // Also reposition each tick — CiviCRM's menubar JS sets the nav's final
  // top offset asynchronously, so early reads of getBoundingClientRect may
  // return 0. Keep correcting until the nav settles.
  var _retries = 0;
  var _retryTimer = setInterval(function () {
    injectToggle();
    positionToggle();
    if (++_retries >= 20 || document.getElementById('riveredge-theme-toggle')) {
      clearInterval(_retryTimer);
    }
  }, 500);

  /* ─── 3. Table → card: stamp data-label on <td>s ────────────────────────── */

  var TABLE_SEL = 'table.dataTable,table.display,table.crm-ajax-table,' +
                  'table.crm-data-table,table.crm-entity-table,table.crm-results-table,' +
                  'table.table,' + /* SearchKit displays use Bootstrap's table.table */
                  'table.selector'; /* Custom CiviCRM tab tables */

  function stampTable(table) {
    var headers = [];
    var labelRow = null;
    // Standard: headers in thead th elements
    table.querySelectorAll('thead th').forEach(function (th) {
      headers.push((th.textContent || '').trim());
    });
    // Fallback: headers as th elements in first tbody row (e.g. table.selector)
    if (!headers.length) {
      var firstRow = table.querySelector('tbody tr');
      if (firstRow) {
        var ths = firstRow.querySelectorAll('th');
        var tds = firstRow.querySelectorAll('td');
        if (ths.length && !tds.length) {
          ths.forEach(function (th) { headers.push((th.textContent || '').trim()); });
          labelRow = firstRow;
        }
      }
    }
    if (!headers.length) return;
    if (labelRow) { labelRow.classList.add('riveredge-label-row'); }
    table.querySelectorAll('tbody tr').forEach(function (row) {
      if (row === labelRow) return;
      row.querySelectorAll('td').forEach(function (cell, i) {
        cell.setAttribute('data-label', headers[i] !== undefined ? headers[i] : '');
      });
    });
  }

  function stampAll(root) {
    if (window.innerWidth > TABLE_BP) return;
    (root || document).querySelectorAll(TABLE_SEL).forEach(function (table) {
      stampTable(table);
      // SearchKit tables are rendered by Angular after the page loads.
      // Watch each table.table tbody for row insertions and re-stamp on change.
      if (table.classList.contains('table') && !table._riveredgeWatched) {
        table._riveredgeWatched = true;
        // Watch the whole table with subtree so we catch Angular filling in
        // both thead (column header text) and tbody (data rows).
        // Debounce to let Angular finish a full render cycle before stamping.
        var _stampTimer;
        new MutationObserver(function () {
          if (window.innerWidth <= TABLE_BP) {
            clearTimeout(_stampTimer);
            _stampTimer = setTimeout(function () { stampTable(table); }, 60);
          }
        }).observe(table, { childList: true, subtree: true });
      }
    });
  }

  stampAll();

  /* ─── 4. Action-link → collapsible accordion (mobile only) ──────────────── */

  function buildActionAccordion(root) {
    (root || document).querySelectorAll('.crm-container .action-link').forEach(function (al) {
      if (al.dataset.riveredgeAccordion === 'done') return;
      al.dataset.riveredgeAccordion = 'done';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'riveredge-action-toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML =
        '<span class="crm-i fa-caret-right" aria-hidden="true"></span>' +
        '<span class="riveredge-action-label">Actions</span>' +
        '<span class="riveredge-action-caret" aria-hidden="true">&#9662;</span>';

      var body = document.createElement('div');
      body.className = 'riveredge-action-body';

      // Move all existing children (the <a> buttons) into the body.
      while (al.firstChild) { body.appendChild(al.firstChild); }

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        body.classList.toggle('open', !open);
      });

      al.appendChild(btn);
      al.appendChild(body);
      al.classList.add('riveredge-action-accordion');
    });
  }

  buildActionAccordion();

  /* ─── 5. Contact tabs → hamburger menu (mobile) ─────────────────────────── */

  function getTabLabel(li) {
    var a = li.querySelector('a');
    if (!a) return '';
    var clone = a.cloneNode(true);
    clone.querySelectorAll('i,svg,.crm-i,.fa').forEach(function (el) { el.parentNode.removeChild(el); });
    var t = clone.textContent.trim();
    if (t) return t;
    return (a.getAttribute('aria-label') || a.getAttribute('title') || '').trim();
  }

  function buildHamburger(tc) {
    if (tc.dataset.riveredgeHamburger === 'done') return;

    var navItems = Array.from(tc.querySelectorAll('.crm-contact-tabs-list > li,.ui-tabs-nav > li'));
    if (!navItems.length) return;

    // Direct-child panels only — jQuery UI always keeps them as immediate children
    // of the tab container, in nav order. Using children (not querySelectorAll)
    // avoids picking up nav <li> elements that share IDs with panel hrefs.
    var allPanels = Array.from(tc.children).filter(function (el) {
      return el.classList.contains('ui-tabs-panel');
    });

    // Only accept an element as a panel if it actually has the ui-tabs-panel class.
    // This prevents href lookups from accidentally matching a nav <li> that shares
    // the same id as the href fragment (e.g. <li id="tab_contribute"> vs the panel).
    function asPanel(el) {
      return (el && el.classList.contains('ui-tabs-panel')) ? el : null;
    }

    var tabData = navItems.map(function (item, navIdx) {
      var a = item.querySelector('a');
      var panel = null;

      if (a) {
        // 1. aria-controls (reliable when set by jQuery UI)
        panel = asPanel(document.getElementById(a.getAttribute('aria-controls')));

        // 2. aria-labelledby reverse lookup — find the panel whose labelledby
        //    equals this <a>'s id; jQuery UI sets both, so this is very reliable.
        if (!panel && a.id) {
          panel = asPanel(tc.querySelector('[aria-labelledby="' + a.id + '"]'));
        }

        // 3. href fragment — only if the resolved element is actually a panel,
        //    not a nav item that happens to share the same id.
        if (!panel) {
          var href = a.getAttribute('href') || '';
          if (href.charAt(0) === '#') {
            panel = asPanel(tc.querySelector(href)) ||
                    asPanel(document.getElementById(href.slice(1)));
          }
        }
      }

      // 4. Index-based fallback using direct-child panels (same order as nav).
      if (!panel) { panel = allPanels[navIdx] || null; }

      return { item: item, panel: panel, label: getTabLabel(item) };
    });

    if (!tabData.some(function (d) { return d.panel; })) return; // no panels found

    tc.classList.add('riveredge-hamburger-active');

    // Hide all panels up front. Use !important so jQuery UI's AJAX show/hide
    // callbacks can't override our visibility control.
    tabData.forEach(function (d) {
      if (d.panel) { d.panel.style.setProperty('display', 'none', 'important'); }
    });

    // ── Bar (button + dropdown wrapper) ────────────────────────────────────
    var bar = document.createElement('div');
    bar.className = 'riveredge-tab-bar';

    var btn = document.createElement('button');
    btn.className = 'riveredge-tab-btn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span class="riveredge-tab-hamburger" aria-hidden="true">&#9776;</span>' +
      '<span class="riveredge-tab-current"></span>' +
      '<span class="riveredge-tab-caret" aria-hidden="true">&#9662;</span>';

    var currentLabel = btn.querySelector('.riveredge-tab-current');

    // ── Dropdown ────────────────────────────────────────────────────────────
    var menu = document.createElement('ul');
    menu.className = 'riveredge-tab-menu';
    menu.setAttribute('role', 'menu');

    // Find the initially active tab index.
    // 1. Check CSS classes (set by jQuery UI when already initialised).
    var activeIdx = 0;
    navItems.forEach(function (item, idx) {
      if (item.classList.contains('ui-tabs-active') || item.classList.contains('ui-state-active')) {
        activeIdx = idx;
      }
    });

    // 2. Cross-check with the URL's selectedChild param — more reliable than CSS
    //    classes when buildHamburger runs before CiviCRM's ready() handlers have
    //    had a chance to activate the correct tab.
    try {
      var sc = new URLSearchParams(window.location.search).get('selectedChild');
      if (sc) {
        tabData.forEach(function (d, idx) {
          if (!d.panel) return;
          var pid = d.panel.id || '';
          // panel IDs are like "tab_contribute"; selectedChild values like "contribute"
          if (pid === sc || pid === 'tab_' + sc || pid.indexOf(sc) !== -1) {
            activeIdx = idx;
          }
        });
      }
    } catch (_) {}

    tabData.forEach(function (d, idx) {
      var label = d.label || ('Tab ' + (idx + 1));
      var li = document.createElement('li');
      li.setAttribute('role', 'none');
      var a = document.createElement('a');
      a.href = '#';
      a.className = 'riveredge-tab-item';
      a.textContent = label;
      a.setAttribute('role', 'menuitem');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        selectTab(idx);
        closeMenu();
      });
      li.appendChild(a);
      menu.appendChild(li);
    });

    // skipJQ: pass true for the initial call so we don't override CiviCRM's own
    // selectedChild handling. CiviCRM's $(document).ready() handler activates the
    // correct tab via tabs('option','active', N) which fires tabsactivate — our
    // tabsactivate handler then updates visibility. If we also call
    // tabs('option','active', 0) here we'd reset it before ready() runs.
    function selectTab(idx, skipJQ) {
      var d = tabData[idx];
      currentLabel.textContent = d.label || ('Tab ' + (idx + 1));

      menu.querySelectorAll('.riveredge-tab-item').forEach(function (a, i) {
        a.classList.toggle('riveredge-tab-item-active', i === idx);
      });

      // Use !important so jQuery UI's AJAX callbacks (which set display via jQuery
      // .show()/.hide() without !important) cannot override our panel visibility.
      tabData.forEach(function (td, i) {
        if (td.panel) {
          td.panel.style.setProperty('display', (i === idx) ? 'block' : 'none', 'important');
        }
      });

      // Track active panel/index so crmLoad and deferred sync can re-assert visibility.
      tc.dataset.riveredgeActivePanel = d.panel ? d.panel.id : '';
      tc.dataset.riveredgeActiveIdx   = String(idx);

      // Tell jQuery UI which tab is active (triggers tabsactivate, loads AJAX content).
      // Skipped on the initial build call so CiviCRM's selectedChild handling is
      // not interrupted — the deferred sync below will re-check and correct if needed.
      if (!skipJQ && window.CRM && CRM.$) {
        try { CRM.$('#mainTabContainer').tabs('option', 'active', idx); } catch(_) {}
      }
      if (d.panel) { stampAll(d.panel); }
    }

    function openMenu() {
      // Use position:fixed with JS coords so no ancestor overflow/grid clips the dropdown.
      var rect = bar.getBoundingClientRect();
      menu.style.top   = rect.bottom + 'px';
      menu.style.left  = rect.left   + 'px';
      menu.style.width = rect.width  + 'px';
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
    }

    function closeMenu() {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('open')) { closeMenu(); } else { openMenu(); }
    });

    var outsideHandler = function (e) {
      if (!bar.contains(e.target)) { closeMenu(); }
    };
    document.addEventListener('click', outsideHandler);
    bar._outsideHandler = outsideHandler;

    bar.appendChild(btn);
    bar.appendChild(menu);
    tc.insertBefore(bar, tc.firstChild);

    // Set _riveredgeTabData BEFORE selectTab so the tabsactivate handler triggered
    // by selectTab (and any concurrent CiviCRM tab switches) can use it.
    tc._riveredgeTabData = tabData;

    // Pass skipJQ=true: don't force jQuery UI's active tab on initial build.
    // CiviCRM's own ready() handler will activate the selectedChild tab and fire
    // tabsactivate, which our handler uses to update visibility correctly.
    selectTab(activeIdx, true);

    // Watch for async label updates (tab counts injected after page load).
    // When a nav item's text changes, mirror it into the hamburger menu item.
    var menuItems = Array.from(menu.querySelectorAll('.riveredge-tab-item'));
    var observer = new MutationObserver(function () {
      tabData.forEach(function (d, i) {
        var fresh = getTabLabel(d.item);
        if (!fresh || fresh === d.label) return;
        d.label = fresh;
        if (menuItems[i]) { menuItems[i].textContent = fresh; }
        // Also update the button label if this tab is currently shown.
        if (menuItems[i] && menuItems[i].classList.contains('riveredge-tab-item-active')) {
          currentLabel.textContent = fresh;
        }
      });
    });
    navItems.forEach(function (item) {
      observer.observe(item, { subtree: true, childList: true, characterData: true });
    });
    tc._riveredgeObserver = observer;
    tc.dataset.riveredgeHamburger = 'done';

    // Deferred re-sync: if CiviCRM's $(document).ready() activates a different tab
    // after buildHamburger ran, re-check jQuery UI's actual active index and switch.
    if (window.CRM && CRM.$) {
      setTimeout(function () {
        if (tc.dataset.riveredgeHamburger !== 'done') return;
        try {
          var jqActive = CRM.$('#mainTabContainer').tabs('option', 'active');
          if (typeof jqActive === 'number' && tabData[jqActive] &&
              jqActive !== parseInt(tc.dataset.riveredgeActiveIdx || '0', 10)) {
            selectTab(jqActive);
          }
        } catch (_) {}
      }, 350);
    }
  }

  function teardownHamburger(tc) {
    if (tc.dataset.riveredgeHamburger !== 'done') return;
    if (tc._riveredgeObserver) {
      tc._riveredgeObserver.disconnect();
      delete tc._riveredgeObserver;
    }
    delete tc._riveredgeTabData;
    var bar = tc.querySelector('.riveredge-tab-bar');
    if (bar) {
      if (bar._outsideHandler) { document.removeEventListener('click', bar._outsideHandler); }
      bar.parentNode.removeChild(bar);
    }
    Array.from(tc.querySelectorAll('.ui-tabs-panel,[id^="tab_"]')).forEach(function (p) {
      p.style.removeProperty('display');
    });
    tc.classList.remove('riveredge-hamburger-active');
    delete tc.dataset.riveredgeHamburger;
  }

  var _tabAttempts = 0;

  function handleTabs() {
    var tc = document.querySelector('.crm-contact-page #mainTabContainer.ui-tabs');
    if (!tc) {
      // jQuery UI may not have initialised #mainTabContainer yet; retry briefly.
      if (++_tabAttempts < 20) { setTimeout(handleTabs, 250); }
      return;
    }
    _tabAttempts = 0;
    if (window.innerWidth <= ACCORDION_BP) { buildHamburger(tc); } else { teardownHamburger(tc); }
  }

  handleTabs();

  if (window.CRM && CRM.$) {
    CRM.$(document).on('draw.dt',          function (e) { stampTable(e.target); });
    CRM.$(document).on('crmLoad',          function (e) {
      stampAll(e.target);
      buildActionAccordion(e.target);
      handleTabs();
      // CiviCRM's AJAX (tab pagination etc.) resets panel style.display to ''
      // after loading new content, causing our CSS to re-hide the active panel.
      // Re-apply display:block to whichever panel was active.
      var tc = document.querySelector('.crm-contact-page #mainTabContainer.riveredge-hamburger-active');
      if (tc && tc.dataset.riveredgeActivePanel) {
        var ap = document.getElementById(tc.dataset.riveredgeActivePanel);
        if (ap) { ap.style.setProperty('display', 'block', 'important'); }
      }
    });
    CRM.$(document).on('tabsactivate tabscreate', function (_e, ui) {
      var p = ui && (ui.newPanel || ui.panel);
      if (!p || !p[0]) return;
      var panelEl = p[0];

      // Sync hamburger visibility whenever jQuery UI activates a tab — this covers
      // the selectedChild URL param case where CiviCRM (not the user) switches tabs.
      // tabsactivate fires AFTER jQuery UI shows the panel, so we can override here.
      var tc = document.querySelector('.crm-contact-page #mainTabContainer.riveredge-hamburger-active');
      if (tc && tc._riveredgeTabData) {
        var newIdx = -1;
        tc._riveredgeTabData.forEach(function (d, i) {
          if (d.panel === panelEl) { newIdx = i; }
        });
        if (newIdx >= 0) {
          var d = tc._riveredgeTabData[newIdx];
          // Update button label.
          var lbl = tc.querySelector('.riveredge-tab-current');
          if (lbl) { lbl.textContent = d.label || ('Tab ' + (newIdx + 1)); }
          // Update dropdown active state.
          tc.querySelectorAll('.riveredge-tab-item').forEach(function (a, i) {
            a.classList.toggle('riveredge-tab-item-active', i === newIdx);
          });
          // Re-assert panel visibility with !important so CSS/jQuery can't re-hide.
          tc._riveredgeTabData.forEach(function (td, i) {
            if (td.panel) {
              td.panel.style.setProperty('display', (i === newIdx) ? 'block' : 'none', 'important');
            }
          });
          tc.dataset.riveredgeActivePanel = d.panel ? d.panel.id : '';
        }
      }

      stampAll(panelEl);
    });
  }

  // Flip Bootstrap dropdown menus upward when they would overflow the viewport
  // bottom — prevents the last card's action menu from being clipped.
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('[data-toggle="dropdown"]');
    if (!btn) return;
    var group = btn.closest('.btn-group') || btn.closest('.dropdown');
    if (!group) return;
    // Wait one tick for Bootstrap to open the menu, then measure and flip if needed.
    setTimeout(function () {
      var menu = group.querySelector('.dropdown-menu');
      if (!menu) return;
      var rect = menu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        group.classList.add('dropup');
      } else {
        group.classList.remove('dropup');
      }
    }, 0);
  });

  var _rz;
  window.addEventListener('resize', function () {
    clearTimeout(_rz);
    _rz = setTimeout(function () { stampAll(); handleTabs(); }, 200);
  });

  /* ─── 7. Contact merge — fix inline-style !important on section title rows ── */
  /* tr.no-data rows on the merge page have style="background-color:#fff !important"
     hard-coded in the template.  Inline !important cannot be overridden by any
     CSS rule, so we patch the style attribute directly when in dark mode.      */
  function fixMergeRows() {
    var isDark = html.getAttribute('data-riveredge-theme') === 'dark' ||
                 (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches &&
                  !html.getAttribute('data-riveredge-theme'));
    document.querySelectorAll('tr.no-data').forEach(function (tr) {
      if (isDark) {
        tr.style.setProperty('background-color', '#21242e', 'important');
        tr.style.setProperty('border-bottom-color', '#3a3f52', 'important');
        tr.style.setProperty('color', 'var(--crm-text-color)', 'important');
      } else {
        // Restore original if switching back to light
        tr.style.setProperty('background-color', '#fff', 'important');
        tr.style.setProperty('border-bottom-color', '#ccc', 'important');
        tr.style.removeProperty('color');
      }
    });
  }

  fixMergeRows();

  // Re-run when the user toggles theme
  var _origApply = applyTheme;
  applyTheme = function (theme) {
    _origApply(theme);
    fixMergeRows();
  };

}(window, document));
