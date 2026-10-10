"""Generate Android launcher icons from the existing MegaMarto website logo.
Run from client/: py -m pip install Pillow && py scripts/make_android_icons.py
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "MegaMarto Fresh Grocery Delivery Logo.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
if not SOURCE.exists():
    raise SystemExit(f"Logo missing: {SOURCE}")
logo = Image.open(SOURCE).convert("RGBA")
bbox = logo.getbbox()
if bbox:
    logo = logo.crop(bbox)
sizes = {"mdpi":48, "hdpi":72, "xhdpi":96, "xxhdpi":144, "xxxhdpi":192}
for density, size in sizes.items():
    directory = RES / f"mipmap-{density}"
    directory.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", (size, size), "#ffffff")
    art = ImageOps.contain(logo, (round(size * .84), round(size * .84)), Image.Resampling.LANCZOS)
    image.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    image.convert("RGB").save(directory / "ic_launcher.png", optimize=True)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    rounded = image.copy()
    rounded.putalpha(mask)
    rounded.save(directory / "ic_launcher_round.png", optimize=True)
print("MegaMarto logo icons generated. Rebuild Android app in Android Studio.")
