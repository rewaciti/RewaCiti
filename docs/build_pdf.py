"""Build the RewaCiti walkthrough PDF from Markdown.

Usage:  python docs/build_pdf.py
Reads:  RewaCiti_Codebase_Walkthrough.md
Writes: RewaCiti_Codebase_Walkthrough_Full.pdf

On first run the required Windows fonts are copied into docs/fonts/
(which is gitignored) so xhtml2pdf can embed them.
"""
from pathlib import Path
import re
import shutil

import markdown
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xhtml2pdf import pisa

BASE = Path(__file__).resolve().parent.parent
FONT_DIR = Path(__file__).resolve().parent / "fonts"
WINDOWS_FONT_DIR = Path(r"C:\Windows\Fonts")
SOURCE = BASE / "RewaCiti_Codebase_Walkthrough.md"
OUTPUT = BASE / "RewaCiti_Codebase_Walkthrough_Full.pdf"

FONTS = {
    "BodyFont": str(FONT_DIR / "arial.ttf"),
    "BodyFontBold": str(FONT_DIR / "arialbd.ttf"),
    "BodyFontItalic": str(FONT_DIR / "ariali.ttf"),
    "BodyFontBoldItalic": str(FONT_DIR / "arialbi.ttf"),
    "MonoFont": str(FONT_DIR / "consola.ttf"),
    "MonoFontBold": str(FONT_DIR / "consolab.ttf"),
    "SymbolFont": str(FONT_DIR / "seguisym.ttf"),
}


def ensure_fonts() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for path in FONTS.values():
        dest = Path(path)
        if dest.exists():
            continue
        src = WINDOWS_FONT_DIR / dest.name
        if not src.exists():
            raise SystemExit(f"Missing font: {src}")
        shutil.copy2(src, dest)


def register_fonts() -> None:
    for name, path in FONTS.items():
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
    pdfmetrics.registerFontFamily(
        "BodyFont",
        normal="BodyFont",
        bold="BodyFontBold",
        italic="BodyFontItalic",
        boldItalic="BodyFontBoldItalic",
    )


FONT_FACES = "\n".join(
    f'@font-face {{ font-family: "{name}"; src: url("file:///{path.replace(chr(92), "/")}"); }}'
    for name, path in FONTS.items()
    if Path(path).exists()
)

CSS = FONT_FACES + """
@page {
  size: A4;
  margin: 16mm 14mm 20mm 14mm;
  @frame footer {
    -pdf-frame-content: page-footer;
    bottom: 8mm;
    margin-left: 14mm;
    margin-right: 14mm;
    height: 6mm;
  }
}

#page-footer {
  font-family: BodyFont;
  font-size: 8pt;
  color: #888888;
  text-align: center;
}

body {
  font-family: BodyFont;
  font-size: 9.3pt;
  line-height: 1.45;
  color: #1f2937;
}

.cover {
  padding-top: 55mm;
  text-align: left;
}
.cover-kicker {
  font-family: BodyFontBold;
  font-size: 9pt;
  letter-spacing: 2pt;
  text-transform: uppercase;
  color: #703BF7;
}
.cover-title {
  font-family: BodyFontBold;
  font-size: 38pt;
  color: #2e1065;
  margin: 4mm 0 0 0;
  border: none;
  padding: 0;
  page-break-before: avoid;
}
.cover-sub {
  font-family: BodyFont;
  font-size: 20pt;
  color: #4c1d95;
  margin-top: 2mm;
}
.cover-line {
  width: 40mm;
  height: 2mm;
  background-color: #703BF7;
  margin: 8mm 0 8mm 0;
}
.cover-desc {
  font-size: 11pt;
  color: #374151;
  line-height: 1.6;
  max-width: 130mm;
}
.cover-meta {
  margin-top: 30mm;
  font-size: 8.5pt;
  color: #6b7280;
}

h1 {
  font-family: BodyFont;
  font-size: 19pt;
  color: #2e1065;
  border-bottom: 2pt solid #703BF7;
  padding-bottom: 3pt;
  margin: 0 0 10pt 0;
  page-break-before: always;
}
h2 {
  font-family: BodyFont;
  font-size: 13pt;
  color: #5b21b6;
  margin: 14pt 0 5pt 0;
  padding-bottom: 2pt;
  border-bottom: 0.6pt solid #ddd6fe;
}
h3 {
  font-family: BodyFont;
  font-size: 10.8pt;
  color: #111827;
  margin: 11pt 0 4pt 0;
}
p { margin: 4pt 0; }
strong { font-family: BodyFontBold; color: #111827; }
em { font-family: BodyFontItalic; }

ul, ol { margin: 4pt 0 4pt 16pt; padding: 0; }
li { margin: 2pt 0; }

a { color: #5b21b6; text-decoration: none; }

code {
  font-family: MonoFont;
  font-size: 7.8pt;
  background-color: #f3f4f6;
  color: #4c1d95;
}

pre {
  font-family: MonoFont;
  font-size: 6.9pt;
  line-height: 1.3;
  background-color: #fafafa;
  border: 0.6pt solid #e5e7eb;
  border-left: 2.5pt solid #703BF7;
  padding: 5pt 6pt;
  margin: 5pt 0 8pt 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 6pt 0 9pt 0;
  font-size: 8pt;
}
th {
  background-color: #ede9fe;
  color: #4c1d95;
  font-family: BodyFontBold;
  border: 0.6pt solid #c4b5fd;
  padding: 3pt 4pt;
  text-align: left;
}
td {
  border: 0.6pt solid #e5e7eb;
  padding: 3pt 4pt;
  vertical-align: top;
}
tr { page-break-inside: avoid; }

blockquote {
  border-left: 2.5pt solid #c4b5fd;
  margin: 6pt 0;
  padding: 2pt 0 2pt 8pt;
  color: #4b5563;
}

hr {
  border: none;
  border-top: 0.6pt solid #ddd6fe;
  margin: 12pt 0;
}

.sym { font-family: SymbolFont; }
"""

COVER = """
<div class="cover">
  <div class="cover-kicker">Technical Documentation</div>
  <div class="cover-title">RewaCiti</div>
  <div class="cover-sub">Codebase Walkthrough</div>
  <div class="cover-line"></div>
  <p class="cover-desc">A complete, up-to-date guide to the RewaCiti React + TypeScript frontend &mdash; every source file, service, store, page, and data flow.</p>
  <p class="cover-meta">Updated November 2026 &middot; 76 source files &middot; React 18 &middot; TypeScript &middot; Vite &middot; Tailwind v4 &middot; Zustand</p>
</div>
<div style="page-break-after: always;"></div>
"""


def build_html(text: str) -> str:
    html = markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "sane_lists", "attr_list", "md_in_html"],
        output_format="html5",
    )

    # Replace glyphs the body font lacks with a symbol-font span.
    for ch in ["★", "☆", "✨", "✓"]:
        html = html.replace(ch, f'<span class="sym">{ch}</span>')

    # Remove the Markdown title block and use the designed cover instead.
    html = re.sub(r"<h1>RewaCiti.*?</h1>\s*", "", html, count=1, flags=re.S)
    html = re.sub(
        r"<p><strong>Updated to match the current source tree\.</strong></p>\s*",
        "",
        html,
        count=1,
    )

    return (
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        "<title>RewaCiti \u2014 Codebase Walkthrough</title>"
        f"<style>{CSS}</style></head><body>{COVER}{html}"
        '<div id="page-footer">RewaCiti Codebase Walkthrough &middot; '
        "<pdf:pagenumber /> / <pdf:pagecount />\n</div>"
        "</body></html>"
    )


def main() -> None:
    ensure_fonts()
    register_fonts()
    text = SOURCE.read_text(encoding="utf-8")
    html = build_html(text)
    (BASE / "docs" / "_walkthrough.html").write_text(html, encoding="utf-8")

    with OUTPUT.open("wb") as pdf_file:
        result = pisa.CreatePDF(html, dest=pdf_file, encoding="utf-8")

    if result.err:
        raise SystemExit(f"PDF build failed with {result.err} error(s)")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
