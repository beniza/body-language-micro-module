"""Build a SCORM 1.2 package of the Tap Through variant for Moodle.

Usage: python scorm/build.py   (from the body-language folder)
Output: dist/body-language-scorm.zip

Images are resized to 1600 px wide and saved as JPEG so the package stays small.
"""
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SCORM = ROOT / "scorm"
OUT = ROOT / "dist"
STAGE = OUT / "stage"
MAX_WIDTH = 1600

page = (ROOT / "variant-9-taps.html").read_text(encoding="utf-8")

# Load the bridge before the module script so window.ModuleTracker exists
page = page.replace("<script>\n(function () {", '<script src="scorm-bridge.js"></script>\n<script>\n(function () {', 1)

if STAGE.exists():
    shutil.rmtree(STAGE)
(STAGE / "images").mkdir(parents=True)

for src in sorted(set(re.findall(r'images/([^"]+\.png)', page))):
    img = Image.open(ROOT / "images" / src).convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    jpg = src[:-4] + ".jpg"
    img.save(STAGE / "images" / jpg, "JPEG", quality=82, optimize=True)
    page = page.replace("images/" + src, "images/" + jpg)

(STAGE / "index.html").write_text(page, encoding="utf-8")
shutil.copy(SCORM / "scorm-bridge.js", STAGE)

# List every file in the manifest so the package is self-describing
files = sorted(p.relative_to(STAGE).as_posix() for p in STAGE.rglob("*") if p.is_file())
manifest = (SCORM / "imsmanifest.xml").read_text(encoding="utf-8")
entries = "\n".join('      <file href="%s"/>' % f for f in files)
manifest = re.sub(r'(<resource [^>]*>)\s*(?:<file [^>]*/>\s*)+', r"\1\n" + entries.replace("\\", "\\\\") + "\n    ", manifest)
(STAGE / "imsmanifest.xml").write_text(manifest, encoding="utf-8")

zip_path = OUT / "body-language-scorm.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for p in sorted(STAGE.rglob("*")):
        if p.is_file():
            z.write(p, p.relative_to(STAGE).as_posix())
shutil.rmtree(STAGE)

print("%s  %.1f MB, %d files" % (zip_path, zip_path.stat().st_size / 1e6, len(files) + 1))
