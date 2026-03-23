<?php

/**
 * River Edge - CiviCRM extension providing a custom RiverLea child stream.
 *
 * Provides:
 * - 'riveredge' stream (based on Walbrook) with full-width contact layout
 * - Mobile-responsive CSS (tables→cards, accordion tabs, touch targets)
 * - Per-user light/dark mode toggle injected into the CiviCRM nav menu
 */

/**
 * Implements hook_civicrm_config().
 */
function riveredge_civicrm_config(&$config): void {
  $extPath = __DIR__;
  if (strpos(get_include_path(), $extPath) === FALSE) {
    set_include_path($extPath . PATH_SEPARATOR . get_include_path());
  }
}

/**
 * Implements hook_civicrm_install().
 */
function riveredge_civicrm_install(): void {}

/**
 * Implements hook_civicrm_enable().
 */
function riveredge_civicrm_enable(): void {}

/**
 * Implements hook_civicrm_pageRun().
 *
 * Loads responsive CSS and the dark-mode/accordion JS whenever a RiverLea
 * stream is active. Weight 150 ensures these load after river.css (weight 100).
 */
function riveredge_civicrm_pageRun(&$page): void {
  if (!\Civi::service('riverlea.style_loader')->isActive()) {
    return;
  }
  // Inline snippet in <head>: applies saved theme class before first paint
  // to avoid a flash. This is tiny and inlined so it always runs first.
  \CRM_Core_Region::instance('html-header')->add([
    'markup' => '<script>
(function(){
  try {
    var t = localStorage.getItem("riveredge-theme");
    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-riveredge-theme", t);
    }
  } catch(e) {}
})();
</script>',
    'weight' => -200,
  ]);

  \Civi::resources()
    ->addStyleFile('riveredge', 'css/responsive.css', 150, 'html-header')
    // page-footer runs after the DOM is fully built — document.body is
    // always available, no DOMContentLoaded complexity needed.
    ->addScriptFile('riveredge', 'js/riveredge.js', 150, 'page-footer');
}
