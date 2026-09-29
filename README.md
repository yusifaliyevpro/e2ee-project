# End-to-End Encryption — Technical English presentation

A scroll-based presentation (Next.js 16 + Tailwind 4 + Motion) by **Yusif Aliyev** for **Leyla Dadaşova**'s Technical English class.
It includes a **live, real E2EE demo**: the audience scans a QR code, each phone generates its own key pair, and the presenter sends one message that only those phones can decrypt. The server only ever stores ciphertext.

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and log in. The presenter password is `PRESENTER_PASSWORD` in `.env.local` (a random one was generated for you; change it to anything you like). The audience page `/join` is public; the presentation and all presenter APIs are locked.

## Presenting

| Key                            | Action                                                 |
| ------------------------------ | ------------------------------------------------------ |
| `↓` `→` `PageDown` `Space`     | next stop                                              |
| `↑` `←` `PageUp` `Shift+Space` | previous stop                                          |
| `Home` / `End`                 | first / last slide                                     |
| `T`                            | toggle light / dark theme (test both on the projector) |
| `F`                            | fullscreen                                             |
| `R`                            | hide / show live reactions                             |
| `J`                            | open / close joining (same as the header button)       |

Presentation clickers work too (they send PageUp/PageDown). The mouse wheel snaps slide by slide.

**Live demo checklist**

1. Joining starts **closed** (so bots and early visitors can't get in). When you want people to scan, press **J** or the "Joining closed" button in the header; it closes itself again after 4 hours. Phones that scanned early wait on a "room is closed" screen and join automatically when you open it. Phones already in the room keep working when you close it.
1. Before class, open the live demo slide and press **reset** (bottom right of "What the server stored").
1. Leave the title slide up while people sit down: its QR code lets them join early.
1. On the demo slide, pick or type a message and press **Encrypt & send**. Phones show the envelope, the ciphertext, the decryption steps and the plaintext; avatars on the projector get a ✓ as each phone decrypts.
1. Once a phone has decrypted the message, a reaction bar appears on it. Reactions are encrypted to your browser and float up from the bottom-right of the projector on every slide (press `R` to hide them).
1. On the safety-numbers slide, ask people to compare the number under the message on their phone with the one on screen.
1. On the "backdoor" slide, press **Start poll** and the phones vote live.

## Getting phones connected

Phones must reach the laptop over HTTPS or a shared network. The QR code encodes the address the presentation is opened from, so open the presentation from the same public address.

### A) Laptop + free tunnel (recommended, no accounts needed)

```bash
pnpm build
pnpm start
```

In a second terminal ([install cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)):

```bash
cloudflared tunnel --url http://localhost:3000
```

Open the printed `https://….trycloudflare.com` URL on the laptop, log in and present. The in-memory room works perfectly because everything runs in one process.

### B) Vercel

1. Import the repo into Vercel and set `PRESENTER_PASSWORD` in the project's environment variables.
2. Add **Upstash Redis** from the Vercel Marketplace (free tier). It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which the app detects automatically (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` work too). Serverless functions don't share memory, so this step is required. A shared database is fine: every key starts with `e2ee:` and expires within 24 hours. The demo slide shows `store: redis` when it is connected. Any deployment pointed at the same database (e.g. your laptop and Vercel) shares one room.

### C) Same Wi-Fi

`pnpm start -H 0.0.0.0` and open `http://<laptop-ip>:3000` on the laptop. The crypto is pure JavaScript, so it works over plain HTTP. University Wi-Fi often blocks device-to-device traffic, in which case use option A.

You can always override the QR target with `NEXT_PUBLIC_JOIN_URL` (set it before `pnpm build`).

## How the demo's cryptography works (it's real)

- Each phone creates an **X25519** key pair in the browser; the private key never leaves `localStorage`.
- The presenter encrypts the message once with a random **AES-256-GCM** message key, then wraps that key separately for every phone (ephemeral X25519 + **HKDF-SHA256** + AES-GCM). This is hybrid, multi-recipient encryption.
- The envelope is signed with the presenter's **Ed25519** identity key. Phones pin it on first use (TOFU) and show its safety number.
- The server (`/api/room/*`) only stores the ciphertext, nonces, public keys and wrapped keys. It cannot read anything.
- Primitives come from the audited [`@noble`](https://paulmillr.com/noble/) libraries. We didn't roll our own crypto.

## Slides

1. Title · 2. A message is a postcard · 3. Caesar cipher (interactive wheel + brute force) · 4. AES-256, the avalanche effect and keyspace (interactive) · 5. Symmetric vs asymmetric · 6. Diffie–Hellman paint mixing (interactive) · 7. In transit vs end-to-end · 8. How E2EE works · 9. **Live demo** · 10. Double Ratchet · 11. Safety numbers · 12. What E2EE can't do · 13. Why E2EE exists + backdoor debate (live poll) · 14. Apps + action plan · 15. 23 new terms (flip cards) · 16. Thank you

Every slide has "New term" cards with IPA pronunciation and a 🔊 button. The phone page also has a **New terms** tab with definitions and example sentences.
