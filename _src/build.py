"""Build the Multi-phase VRM teaching pages from shell.html + <page>.part.html.

Usage: python build.py
  - ../VRM-<STEM>_互動教學.html : single-file pages (everything inline, open directly in a browser)
  - ../_site/                   : static site for Vercel — one page per station,
                                  sharing assets/series.css and assets/common.js
Stations without a .part.html yet show as "準備中" in the nav.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).parent
OUT = SRC.parent
SITE = OUT / "_site"
DCDC = "https://dcdc-topology-series.vercel.app/"
SERIES = [  # (key, number, nav name, zh, single-file stem, site file)
    ("why", "01", "WHY", "為什麼要多相", "01-WHY", "why-multiphase.html"),
    ("ripple", "02", "RIPPLE", "紋波抵消", "02-RIPPLE", "ripple.html"),
    ("stage", "03", "POWER STAGE", "DrMOS／SPS", "03-STAGE", "power-stage.html"),
    ("sense", "04", "CURRENT SENSE", "電流偵測與均流", "04-SENSE", "current-sense.html"),
    ("loadline", "05", "LOAD-LINE", "負載暫態", "05-LOADLINE", "load-line.html"),
    ("shed", "06", "PHASE SHEDDING", "效率與切相", "06-SHED", "phase-shedding.html"),
    ("imvp", "07", "IMVP9 / SVID", "Intel 規範", "07-IMVP", "imvp-svid.html"),
    ("count", "08", "PHASE COUNT", "45W／28W 幾相", "08-COUNT", "phase-count.html"),
    ("layout", "09", "LAYOUT", "佈局與除錯", "09-LAYOUT", "layout.html"),
]


def parse_part(text):
    parts = re.split(r"^<!--#([A-Z0-9_]+)-->\s*$", text, flags=re.M)
    return {parts[i]: parts[i + 1].strip("\n") for i in range(1, len(parts), 2)}


def built(key):
    return (SRC / f"{key}.part.html").exists()


def nav(current, site):
    items = ['<span class="lab">系列 Series</span>']
    if (SRC / "index.part.html").exists():
        home = "<b>HOME</b>系列首頁"
        items.append(f'<span class="cur" aria-current="page">{home}</span>' if current == "home"
                     else f'<a href="{"./" if site else "VRM-00-HOME_互動教學.html"}">{home}</a>')
    for key, no, name, zh, stem, site_file in SERIES:
        inner = f"<b>{no} {name}</b>{zh}"
        if key == current:
            items.append(f'<span class="cur" aria-current="page">{inner}</span>')
        elif not built(key):
            items.append(f'<span class="soon">{inner} · 準備中</span>')
        elif site:
            items.append(f'<a href="{site_file}">{inner}</a>')
        else:
            items.append(f'<a href="VRM-{stem}_互動教學.html">{inner}</a>')
    items.append(f'<a href="{DCDC}buck.html" target="_blank" rel="noopener"><b>↗ BUCK</b>前置：同步降壓</a>')
    return "".join(items)


def squeeze(text):
    return "\n".join(line.strip() for line in text.splitlines() if line.strip()) + "\n"


def fill(template, fields):
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", lambda m: fields.get(m.group(1), ""), template)


def to_site(page):
    """Swap the inline shared CSS / helper script for assets/* and wrap in a full document."""
    head, body = page.split('<div class="wrap">', 1)
    head = re.sub(r"<style>.*?</style>", '<link rel="stylesheet" href="assets/series.css">', head, count=1, flags=re.S)
    head = re.sub(r"<style>\s*</style>", "", head)
    first = re.search(r"<script>.*?</script>", body, flags=re.S)
    body = body[:first.start()] + '<script src="assets/common.js"></script>' + body[first.end():]
    return ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n<div class="wrap">' + body + "</body>\n</html>\n")


def single(page):
    """Single-file version: a full document too, so it opens cleanly from disk."""
    head, body = page.split('<div class="wrap">', 1)
    return ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n<div class="wrap">' + body + "</body>\n</html>\n")


def main():
    shell = (SRC / "shell.html").read_text(encoding="utf-8-sig")
    reset = "html{color-scheme:light dark}body{margin:0}img{max-width:100%}[hidden]{display:none!important}\n"
    css = reset + (SRC / "series.css").read_text(encoding="utf-8-sig") + (SRC / "vrm.css").read_text(encoding="utf-8-sig")
    common = (SRC / "common.js").read_text(encoding="utf-8-sig")
    (SITE / "assets").mkdir(parents=True, exist_ok=True)
    (SITE / "assets" / "series.css").write_text(squeeze(css), encoding="utf-8")
    (SITE / "assets" / "common.js").write_text(squeeze(common), encoding="utf-8")

    for key, no, _, _, stem, site_file in SERIES:
        part = SRC / f"{key}.part.html"
        if not part.exists():
            continue
        fields = parse_part(part.read_text(encoding="utf-8-sig"))
        fields.update(CSS=css, COMMON=common, EYEBROW=f"Multi-phase VRM Series · {no}")
        fields["NAV"] = nav(key, site=False)
        page = fill(shell, fields)
        left = re.findall(r"\{\{[A-Z0-9_]+\}\}", page.replace(common, "").replace(css, ""))
        if left:
            raise SystemExit(f"{part.name}: unfilled {left}")
        (OUT / f"VRM-{stem}_互動教學.html").write_text(single(page), encoding="utf-8")
        fields["NAV"] = nav(key, site=True)
        (SITE / site_file).write_text(squeeze(to_site(fill(shell, fields))), encoding="utf-8")
        print("wrote", f"VRM-{stem}_互動教學.html", "and _site/" + site_file)

    home = SRC / "index.part.html"
    if home.exists():
        built_map = {f: f"VRM-{stem}_互動教學.html" for key, _, _, _, stem, f in SERIES if built(key)}
        fields = parse_part(home.read_text(encoding="utf-8-sig"))
        fields["SCRIPT"] = fields["SCRIPT"].replace("__BUILT__", json.dumps(built_map, ensure_ascii=False))
        fields.update(CSS=css, COMMON=common, EYEBROW="Multi-phase VRM Series · HOME")
        fields["NAV"] = nav("home", site=False)
        (OUT / "VRM-00-HOME_互動教學.html").write_text(single(fill(shell, fields)), encoding="utf-8")
        fields["NAV"] = nav("home", site=True)
        (SITE / "index.html").write_text(squeeze(to_site(fill(shell, fields))), encoding="utf-8")
        print("wrote VRM-00-HOME_互動教學.html and _site/index.html")


if __name__ == "__main__":
    main()
