# RiverEdge — CiviCRM Theme Extension

A custom [RiverLea](https://github.com/civicrm/riverlea) child stream for CiviCRM that adds dark mode, a per-user theme toggle, mobile-responsive admin UI, and a full-width contact summary layout.

---

## Features

- **Dark mode** — follows OS preference by default, with a per-user toggle that cycles through System → Dark → Light
- **Mobile-responsive tables** — data tables convert to labeled card stacks on small screens
- **Mobile contact tabs** — tab bar collapses to a hamburger dropdown on narrow viewports
- **Action button accordion** — Actions menu collapses to a tappable toggle on mobile
- **Full-width contact summary** — removes Claro's page padding on contact pages for a cleaner layout
- **Touch-friendly** — nav links and tab targets sized for fingers, not cursors

---

## Requirements

- CiviCRM 6.0+
- [RiverLea](https://github.com/civicrm/riverlea) extension (required dependency)
- Drupal 10+ with Claro admin theme (or similar)

---

## Installation

1. Clone or copy this extension into your CiviCRM extensions directory:

   ```bash
   cd /path/to/civicrm/ext/
   git clone git@github.com:pbarmak/riveredge.git riveredge
   ```

2. In CiviCRM, go to **Administer → System Settings → Extensions** and install **RiverEdge Theme**.

3. Activate the stream at **Administer → Customize Data and Screens → Display Preferences → Theme Settings** and select **RiverEdge**.

---

## Updating

```bash
cd /path/to/civicrm/ext/riveredge
git pull
```

No cache flush or CiviCRM restart is required for CSS/JS changes. For `info.xml` or managed entity changes, clear the CiviCRM cache afterward.

---

## File Structure

```
riveredge/
├── stream/
│   ├── main.css          # RiverLea stream variables and base overrides
│   └── dark.css          # Dark mode variable overrides
├── css/
│   └── responsive.css    # Mobile layout, table cards, accordions, theme toggle
├── js/
│   └── riveredge.js      # Theme toggle, table label stamping, accordion logic
├── managed/
│   └── RiverleaStream_Riveredge.mgd.php  # Registers the stream with RiverLea
├── info.xml
└── riveredge.php         # Extension bootstrap, loads CSS/JS via pageRun hook
```

---

## License

MIT — see [LICENSE](LICENSE).
