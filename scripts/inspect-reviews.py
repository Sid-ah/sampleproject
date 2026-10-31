"""Resolve the supplied public review listing without inventing review content."""
import json
import re
import urllib.request

url = "https://maps.app.goo.gl/HoTCheVWootQvqJZ7?g_st=ic"
request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(request, timeout=40) as response:
        page = response.read().decode("utf-8", errors="replace")
        print("MAPS_RESOLVED_URL", response.url)
        print("MAPS_PAGE_TITLE", re.findall(r"<title>(.*?)</title>", page, re.S)[:1])
        for marker in ["Dahmani", "reviews", "rating", "reviewCount", "aggregateRating"]:
            snippets = [page[max(0, match.start() - 150):match.end() + 300] for match in list(re.finditer(marker, page, re.I))[:8]]
            print("MAPS_PUBLIC_SNIPPETS", marker, json.dumps(snippets))
except Exception as error:
    print(f"Google Maps listing could not be inspected: {error}")
