# Bridge

A departure board for a fleet of agents. It reads `maw herdr serve` and shows
every pane as a row that flips when its status changes.

![board](docs/board.png)

```
bridge.buildwithoracle.com/?host=http://127.0.0.1:3457
```

## Pointing it at a fleet

`?host=` is read once, remembered, and stripped from the address bar, so a
reload is not a re-configuration. Press <kbd>h</kbd> to change it later, or
leave it unset to read whatever origin served the page.

Reads need nothing. `wake` and `send` need the operator token, which you paste
with <kbd>t</kbd> and which never leaves your browser.

```bash
# read-only, self-expiring, no token
maw herdr serve --insecure-no-token --listen 127.0.0.1:3488 --demo-minutes 30

# full operator access
maw herdr serve --token-file ~/.maw-herdr-token --listen 127.0.0.1:3457
```

## Keys

| Key | Does |
|---|---|
| <kbd>/</kbd> | Filter by folder, session, or engine |
| <kbd>j</kbd> <kbd>k</kbd> | Move the cursor |
| <kbd>g</kbd> <kbd>G</kbd> | First and last row |
| <kbd>w</kbd> | Wake the selected agent |
| <kbd>s</kbd> | Send it a message |
| <kbd>h</kbd> <kbd>t</kbd> | Backend, token |
| <kbd>?</kbd> | Key map |

## Why it is not god

[god.buildwithoracle.com](https://god.buildwithoracle.com) is a place you
explore: isometric rooms, a dozen views, an agent you find by knowing which tab
it lives in. Bridge is an instrument you read. One screen, no tabs, every agent
on it, sorted so blocked comes first.

It shares god's API contract exactly, including `?host=`, so both can watch the
same fleet at the same time.

Folder leads every row because it is the only part an operator recognises:
herdr encodes session names, so the raw id is base64url and identifies nothing
to a human. The id is still there, in the pane header, where you need it to
address the agent.

## Develop

```bash
bun install
bun run dev
bun run build
bun run deploy   # Cloudflare Workers, static assets only
```

It deploys as static assets only, with no Worker script: Cloudflare serves
files directly, so there is nothing that could see fleet data or hold a token.
Headers come from `public/_headers`, and SPA deep links from
`not_found_handling`.
