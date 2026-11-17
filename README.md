# Lentera Senja — Dusk Lantern

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Abdee36/best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Abdee36/best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original 2D canvas arcade game for make.fun's **best-game-01** bounty.
You are Kunang, a little firefly, keeping a dusk garden glowing.

## How to play

- **Goal:** bloom every flower in all 3 gardens before your lantern dies.
- **Collect glowing orbs** to feed your light. The light drains over time;
  quick pickups build a combo that raises each orb's score.
- **Fly over buds** to bloom them. Blooming takes a moment of stillness:
  linger beside a bud until its ring fills. Shadows close in while you
  wait, so every bloom is a small risk. Blooming all flowers clears the
  level with a bonus; the next garden is darker, faster, and fuller of
  shadows.
- **Dodge the shadows.** Three hits end the run. A dash (Space) carries
  you straight through danger for a blink.
- **Charms:** S shields one hit, M pulls orbs toward you, Z slows the
  shadows. Each lasts a few seconds.
- **Win** by clearing garden 3. **Lose** when your hearts or your light
  run out. Restart any time with R.

## Controls

- Move: WASD / arrow keys, or hold the mouse button to steer toward it
- Dash: Space
- Pause: P or Esc (auto-pauses when the tab hides)
- Sound: M (all sound is synthesized in the browser; no audio files)
- Start / restart: Enter, Space, R, or the on-screen buttons

## Run it

```sh
node serve.ts
```

Then open http://127.0.0.1:8080/ in desktop Chrome. The game is plain
static files under `game/` with no build step and no network requests.

## Layout

- `game/index.html` — page shell and canvas
- `game/src/config.js` — tuning numbers and palette
- `game/src/random.js` — seeded generator (deterministic replays)
- `game/src/world.js` — rules, entities, collisions, scoring
- `game/src/render.js` — all drawing: garden, HUD, menus
- `game/src/input.js` — keyboard and mouse, normalized
- `game/src/audio.js` — synthesized Web Audio sounds
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — boot, fixed-step loop, screen flow
- `main.ts` — entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
- `shots.json` — the four screenshot scenes and their seeds

Screenshots in `screenshots/` are real renders of this code in a
browser, one per scene in `shots.json`. The first by name is the cover.

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7f4bzy0t&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
