## Release smoke test (Ableton AU/VST3)

Run these in **AU** and **VST3**.

### 1) First launch after full Ableton restart
- Launch Ableton (fresh), insert Sairyne.
- Expected: starts on **Your projects**.

### 2) Reopen plugin window (same Ableton session)
- Close/minimize Sairyne window, reopen it.
- Expected: returns to the **same screen** you last used (Projects or Chat).

### 3) Project selection → correct chat
- Open Project A → send 1 message.
- Back to Projects → open Project B.
- Expected: Project B shows **its own chat** (not Project A’s).

### 4) Create project (+) UX
- On **Your projects**, press **+**.
- Expected: stays on Projects, new project appears highlighted, rename input focused.
- Press **Cancel** immediately.
- Expected: the new project is removed (undo create).

### 5) Clear chat (per project)
- Open context menu on a project → **Clear chat** → confirm.
- Expected: only that project’s chat is cleared; other projects unaffected.

### 6) Auth persistence
- Sign in.
- Close/reopen plugin window.
- Expected: still signed in.

### 7) Offline mode behavior
- Disconnect network (or block API).
- Expected: UI switches to offline state and remains responsive; no rapid spam retries.


