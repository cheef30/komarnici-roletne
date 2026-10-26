# Pravi jedan mali varijabilni WOFF2 od punog Archivo fonta:
# samo znakovi koje sajt koristi (latinica + č ć š ž đ, navodnici, €, ²),
# osa debljine 400-820 i osa širine 75-100 (zbijeni naslovi).
#
#   python -m pip install fonttools brotli
#   python scripts/build-font.py
#
# Izvor: scripts/font-src/Archivo[wdth,wght].ttf (Google Fonts, OFL).

from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

root = Path(__file__).resolve().parent.parent
src = root / "scripts" / "font-src" / "Archivo[wdth,wght].ttf"
out = root / "assets" / "fonts" / "archivo-var.woff2"

font = TTFont(src)
font = instancer.instantiateVariableFont(font, {"wght": (400, 820), "wdth": (75, 100)})

unicodes = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x0106, 0x0107, 0x010C, 0x010D, 0x0110, 0x0111, 0x0160, 0x0161, 0x017D, 0x017E,  # Ć ć Č č Đ đ Š š Ž ž
    0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2026, 0x2039, 0x203A,          # navodnici, …
    0x20AC, 0x2122, 0x2212, 0x2192, 0x00B2,                                          # € ™ − → ²
]
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case"]
options.name_IDs = ["*"]
options.notdef_outline = True
sub = subset.Subsetter(options)
sub.populate(unicodes=unicodes)
sub.subset(font)
font.flavor = "woff2"
font.save(out)
print(out.name, round(out.stat().st_size / 1024, 1), "KB")
