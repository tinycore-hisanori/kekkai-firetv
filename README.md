# KEKKAI — Seal the Yokai (Fire TV)

Flow puzzle × tower defense, rebuilt for the **Fire TV remote**.
Draw sacred barriers between talismans with the D-pad, paralyse and herd yokai minions, solve Seal Formation puzzles, and ring Japan with a barrier that closes at Mount Fuji.

## Controls (Fire TV remote)
| Button | Action |
|---|---|
| D-pad | Move the cursor / steer the line while holding a talisman |
| OK | Grab a talisman · release (a half-drawn line is a wall) |
| ◀◀ Rewind | 縛 BIND — freeze every minion for 4 s |
| ▶▶ Fast-forward | 祓 PURGE — purify all minions, heal the gate |
| ☰ Menu | Reset the board (in a Seal Formation: clear lines) |
| Back | Cancel the line being drawn · pause / stage select |

## Repository layout
- `app/` — Android (Java) Fire TV app: full-screen WebView, Leanback banner, forwards Back/Menu/media keys to the game (`MainActivity.java`).
- `app/src/main/assets/kekkai.html` — the built game (single file).
- `web/` — game sources. `python3 web/build.py` concatenates `n_*.js` into `kekkai.html`.
  - `n_tv.js` remote controls, focus navigation, TV performance mode
  - `n_seal.js` telegraphed minion moves + Seal Formation puzzles (procedural, always solvable)
  - `n_map.js` Japan map stage select (coastline: Natural Earth via world-atlas)

## Build & run on Fire TV
1. Fire TV: Settings → My Fire TV → About → click the device name 7× → Developer options → **ADB debugging ON**.
2. `adb connect <FIRE_TV_IP>:5555`
3. Open this folder in Android Studio and **Run**, or `./gradlew installDebug`.

The game also runs in any browser: open `app/src/main/assets/kekkai.html` (add `?tv=1` to try the remote mode with arrow keys / Enter / Esc).

## License
- **Code** (`app/`, `web/*.js`, `web/*.py`, `web/shell.html`): MIT — see `LICENSE`.
- **Art, music and text assets** (yokai illustrations and audio embedded in `web/sprites.js`, `web/bgm.js` and the built HTML): © Tiny Core Inc. (TinyLabo), all rights reserved.
- Map data: Natural Earth (public domain).
