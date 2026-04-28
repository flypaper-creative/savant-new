# Savant New

A bold, Awwwards-inspired static landing page with expressive typography, layered gradients, and subtle motion.

## Pages

- Home: `index.html`
- Case studies:
	- `projects/atlas.html`
	- `projects/nebula.html`
	- `projects/origin.html`

## Run locally

1. Open `index.html` directly in your browser, or
2. Serve the folder with a local HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Auto sync

This repo includes a Git-based auto-sync workflow that keeps local and remote close to synced without force-pushes or file mirroring.

1. Install the hook once:

```bash
npm run sync:install
```

2. Optional: run continuous sync in the background:

```bash
npm run sync:start
```

### What it does

- Auto-commits local file changes with `chore(sync): auto checkpoint`
- Pulls from the tracked upstream branch with `--rebase --autostash`
- Pushes the rebased result back to remote
- Runs automatically after each local commit once hooks are installed

### Notes

- An upstream branch must already be configured
- Real merge conflicts still stop the sync so nothing is overwritten silently
- The sync interval defaults to 60 seconds and can be changed with `AUTO_SYNC_INTERVAL_SECONDS`
