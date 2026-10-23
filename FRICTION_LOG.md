# Friction Log — KEKKAI (Fire TV track)

Amazon Developer Hackathon 2026 "Build, Ship, Shape" · TinyLabo / Tiny Core Inc.
Device: Fire TV Stick · App: Android (Java) full-screen WebView hosting an HTML5 Canvas game.

---

## 1. Remote keys missing in a WebView
| | |
|---|---|
| **Task** | Use Back, Menu, Rewind, Fast-forward and Play/Pause as game controls in an HTML5 game running in a full-screen WebView. |
| **Steps** | Added `keydown` listeners in the page; ran on a Fire TV Stick via ADB; pressed each remote button. |
| **Expected** | All remote keys arrive as `keydown` events, like the D-pad and OK do. |
| **Actual** | D-pad and OK arrived; Back, Menu and all media keys never reached JavaScript. Back also tried to close the app. |
| **Severity** | High — spells and pause were unusable. |
| **Workaround** | Overrode `dispatchKeyEvent` in `MainActivity` and forwarded the keys to the page with `evaluateJavascript("tvKey('…')")`. |
| **Suggestion** | Document this in the Remote Input docs for WebView apps, or provide a WebView setting / JS event that forwards all remote keys. |

## 2. HTML5 canvas performance on device
| | |
|---|---|
| **Task** | Run the browser version of the game on Fire TV at a playable frame rate. |
| **Steps** | Loaded the same HTML used on desktop Chrome into the WebView; played a stage with several minions. |
| **Expected** | Similar smoothness to desktop Chrome (the game is 2D and light). |
| **Actual** | Very low frame rate on device. Causes found by trial and error: canvas `ctx.filter` on every sprite each frame, `shadowBlur` glows, CSS drop-shadow / backdrop blur on animated images, and `devicePixelRatio = 2` at 1080p (4× the pixels). |
| **Severity** | High. |
| **Workaround** | Pre-render filtered sprites once into small canvases, render canvases at 1×, disable `shadowBlur` and CSS blur in a "TV lite" mode, skip unchanged DOM writes. In a 6× CPU-throttled test: ~3 fps → ~40–50 fps. |
| **Suggestion** | Publish a short "HTML5/WebView games on Fire TV" performance guide (recommended canvas resolution, costly features to avoid, how to profile on device with remote DevTools). |

## 3. Flicker that only appears on device
| | |
|---|---|
| **Task** | Show a full-board puzzle mode where every cell is covered by animated lines. |
| **Steps** | Tested in desktop Chrome (smooth), then on Fire TV. |
| **Expected** | Same visual result on device. |
| **Actual** | Visible flicker/shimmer on Fire TV only; could not be reproduced on desktop. |
| **Severity** | Medium. |
| **Workaround** | Removed the animated dash pattern inside lines during that mode and cached the static overlay in an offscreen canvas. Flicker was reduced, but some is still visible on our device. |
| **Suggestion** | Guidance on WebView GPU/compositing limits on Fire TV, or a way to capture GPU frame timing on device. |

## 4. Voice input for a game
| | |
|---|---|
| **Task** | Let players cast spells by voice using the remote's microphone. |
| **Steps** | Read the voice-enabling docs (Media Session, in-app scrolling/selection, Video Skills Kit) and the remote input docs. |
| **Expected** | A way for a third-party app to receive speech or custom voice intents. |
| **Actual** | No mic or free-form speech access for apps. Only fixed Media Session phrases ("Alexa, pause / next…") with 1–2 s latency; in-app voice selection appears to be Cube-only; docs are video-focused and eligibility for games is unclear. |
| **Severity** | Medium — feature dropped. |
| **Workaround** | None. We kept D-pad-only controls because the fixed phrases would have made controls worse. |
| **Suggestion** | A lightweight custom-intent API for apps (register a few phrases), and clarify which voice features apply to games. |

## 5. First-time on-device setup
| | |
|---|---|
| **Task** | Install our own APK on a Fire TV for the first time. |
| **Steps** | Looked for Developer Options in Settings; enabled ADB debugging; found the IP; ran `adb connect`; accepted the prompt; ran from Android Studio. |
| **Expected** | A single, discoverable "developer mode" switch. |
| **Actual** | Developer Options are hidden (click the device name 7 times). ADB debugging, the network IP and the connection prompt are separate steps a web developer won't guess. |
| **Severity** | Low. |
| **Workaround** | Wrote step-by-step instructions for ourselves and for judges (`README_JUDGES.txt`). |
| **Suggestion** | A visible developer-mode toggle, or QR/code-based pairing from the Amazon Developer Console. |

---

# Feature Requests

1. **Deliver all remote keys to WebView content** — *Critical.* Back, Menu and the media keys never reach `keydown` in a full-screen WebView, so every HTML5 game must add native `dispatchKeyEvent` code and a JS bridge. A WebView setting or documented JS event would let web developers ship Fire TV games without writing Java.
2. **Official performance guidance + on-device profiling for HTML5/WebView games** — *Important.* Filters, blur and a 2× canvas made our game crawl on device while desktop Chrome was smooth; animated strokes flickered only on device.
3. **A voice/intent API for third-party games** — *Important.* Games only receive fixed Media Session phrases with 1–2 s latency. Registering a few custom phrases would enable voice + D-pad multimodal play.
4. **A hosted web app path for HTML5 games** — *Nice-to-have.* Publish a web game (URL or zip) directly to Fire TV with remote-key support and a Leanback banner.
5. **Simpler developer setup** — *Nice-to-have.* A one-step developer mode or QR-based pairing from the Developer Console.
