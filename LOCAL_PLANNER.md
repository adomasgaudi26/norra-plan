# Local planner data

The planner can use a local JSON file as its live source of truth. This keeps routine task, category, and ELO edits out of the GitHub Pages deployment loop.

1. Start the data server in one terminal:

   ```powershell
   pnpm planner:server
   ```

2. Start the Next.js app in another terminal:

   ```powershell
   pnpm dev
   ```

Open `http://localhost:3000`. The app detects the local server at `http://localhost:8787/api/planner`, pulls the JSON state, writes edits back to it, and polls for changes from another tab.

The first successful local load fills `data/planner.json` with the current seeded planner state. The server writes that file atomically, so the file can also be inspected or edited directly. The browser falls back to its existing localStorage/seed state when the server is unavailable.

For a trusted local network, start the server on the laptop's LAN interface and open the Next.js app from the laptop address:

```powershell
$env:PLANNER_HOST = "0.0.0.0"
pnpm planner:server
```

Use `http://<laptop-ip>:3000` in the browser. This is a local-network assumption: the server has no authentication, so it should not be exposed to the public internet. If the endpoint cannot be inferred from the browser address, set `NEXT_PUBLIC_PLANNER_API_URL` before starting Next.js.

For a disposable or alternate JSON file, set `PLANNER_DATA_FILE` before starting the server. The default is `data/planner.json` in this repository.

GitHub Pages remains a static fallback. A Pages-hosted HTTPS page cannot write to a plain HTTP localhost endpoint because of browser mixed-content rules; use the local Next.js page when live JSON sync is needed.
