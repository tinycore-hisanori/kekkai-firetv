import pathlib
d = pathlib.Path(__file__).parent
order = "head util bgm board td input hudfx draw sprites ofuda tutor map seal final ending tail tv".split()
game = "".join((d / f"n_{n}.js").read_text(encoding="utf-8") for n in order if (d / f"n_{n}.js").exists())
game = game.replace("/*JAPAN*/null", (d / "japan.json").read_text(encoding="utf-8"))
(d / "game.js").write_text(game, encoding="utf-8")
html = (d / "shell.html").read_text(encoding="utf-8")
for k, f in [("/*SPRITES*/", "sprites.js"), ("/*BGM*/", "bgm.js"), ("/*I18N*/", "i18n.js"), ("/*GAME*/", "game.js")]:
    html = html.replace(k, (d / f).read_text(encoding="utf-8"))
import datetime
BUILD = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime("%m%d-%H%M")
VER = (d / "VERSION").read_text().strip()
html = html.replace("v1.1.0 · Fire TV · 2026-10", f"v{VER} · Fire TV · build {BUILD}").replace("build /*BUILD*/", f"v{VER} · build {BUILD}").replace("/*BUILD*/", BUILD)
(d / "kekkai.html").write_text(html, encoding="utf-8")
print("built", VER, BUILD, len(html))
