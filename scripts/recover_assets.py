"""Recover public dealership images without depending on its production server at runtime."""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = "https://dahmaniautomotive.com/"
ASSETS = Path("assets")
ASSETS.mkdir(exist_ok=True)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "img":
            source = data.get("src") or data.get("data-src")
            if source and not source.startswith("data:"):
                self.images.append({"url": urljoin(ROOT, source), "alt": data.get("alt", "")})
        if tag == "script" and data.get("src"):
            self.scripts.append(urljoin(ROOT, data["src"]))


try:
    html = fetch(ROOT).decode()
except Exception as error:
    print(f"Original dealership could not be reached: {error}")
    raise SystemExit(0)

parser = Images()
parser.feed(html)
print("ORIGINAL PAGE TEXT", re.sub("<[^>]+>", " ", html)[:18000])
for script in parser.scripts[:6]:
    try:
        javascript = fetch(script).decode()
        print("SCRIPT EXCERPT", javascript[:1000])
        for match in re.findall(r'["\'](https?://[^"\'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"\']*)?)["\']', javascript):
            parser.images.append({"url": match, "alt": ""})
        for match in re.findall(r'["\'](/[^"\'\s]+\.(?:jpg|jpeg|png|webp))["\']', javascript):
            parser.images.append({"url": urljoin(ROOT, match), "alt": ""})
    except Exception as error:
        print(f"Could not inspect script {script}: {error}")

manifest = []
seen = set()
for image in parser.images[:90]:
    if image["url"] in seen:
        continue
    seen.add(image["url"])
    suffix = Path(urlparse(image["url"]).path).suffix.lower()
    if suffix not in (".jpg", ".jpeg", ".png", ".webp", ".svg", ".avif"):
        suffix = ".jpg"
    path = ASSETS / f"original-{len(manifest):02d}{suffix}"
    try:
        path.write_bytes(fetch(image["url"]))
        manifest.append({**image, "path": str(path)})
    except Exception as error:
        print(f"Could not recover image {image['url']}: {error}")
if manifest:
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2))
print("RECOVERED IMAGES", json.dumps(manifest))
