<?php

/**
 * Managed entity: registers the 'riveredge' stream with RiverLea.
 *
 * This stream is based on Walbrook (the Shoreditch-equivalent) and adds:
 * - Full-width contact summary layout
 * - Larger navigation menu font
 * - Refined colour palette
 *
 * Dark mode behaviour is set to 'inherit' so the browser/OS preference is
 * respected by default. The per-user JS toggle in riveredge.js can then
 * override this via a data attribute on <html>.
 *
 * To activate: Administer → Customize Data and Screens → Display Preferences
 * → Theme Settings → select "River Edge".
 */
return [
  [
    'name'    => 'RiverleaStream_Riveredge',
    'entity'  => 'RiverleaStream',
    'update'  => 'always',
    'cleanup' => 'always',
    'params'  => [
      'version' => 4,
      'values'  => [
        'name'         => 'riveredge',
        'label'        => 'River Edge',
        'description'  => 'Custom stream based on Walbrook with full-width contact layout, larger nav font, and per-user dark mode.',
        'extension'    => 'riveredge',
        'file_prefix'  => 'stream/',
        'css_file'     => 'main.css',
        'css_file_dark' => 'dark.css',
        // 'inherit' → river.css wraps dark vars in @media (prefers-color-scheme: dark)
        // Our JS toggle can then force dark/light via html[data-riveredge-theme]
        'dark_backend'  => 'inherit',
        'dark_frontend' => 'inherit',
        'vars'         => [],
        'vars_dark'    => [],
      ],
      'match' => ['name'],
    ],
  ],
];
