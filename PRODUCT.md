# Bridge — product context

## What it is
A single-screen operator board for a fleet of coding agents running under
`maw herdr serve`. It answers one question fast: which agent needs me now.

## Who uses it
One operator (Nat) watching 40-70 panes across a machine fleet, usually on a
second monitor, in a dim room, for hours.

## Mode
Operate. Scanability and honesty about connection state outrank expression.

## Product truths
- Session names arrive base64url-encoded from herdr. The checkout folder is the
  only human-readable identity, so it leads every row.
- Reads are open; writes need an operator token. That distinction must be
  visible at rest, never discovered through a failed action.
- A tokenless demo backend self-expires. The board must show it going away.
- The backend may be unreachable, or blocked outright by mixed content when an
  HTTPS page addresses an HTTP LAN host. Both are normal, and each needs its
  own message.

## Non-goals
- No spatial metaphor, no avatars, no game layer.
- No hard-coded fleet knowledge. Every name and colour derives from the API.
- The Worker proxies nothing and stores nothing.
