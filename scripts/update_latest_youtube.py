\
#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

CHANNEL_ID = "UChS6zppV9QlFM6htTZJ-GoA"

# YouTube's generated playlist IDs:
# UULF... = regular long-form videos
# UULV... = live streams / archived live streams
CHANNEL_SUFFIX = CHANNEL_ID[2:]
VIDEO_PLAYLIST_ID = f"UULF{CHANNEL_SUFFIX}"
LIVE_PLAYLIST_ID = f"UULV{CHANNEL_SUFFIX}"

ATOM = "http://www.w3.org/2005/Atom"
YT = "http://www.youtube.com/xml/schemas/2015"

EMBED_RE = re.compile(
    r'https://www\.youtube\.com/embed/[A-Za-z0-9_-]{11}'
)


@dataclass(frozen=True)
class Entry:
    video_id: str
    published: datetime
    source: str


def fetch_latest(playlist_id: str, source: str) -> Entry | None:
    url = (
        "https://www.youtube.com/feeds/videos.xml"
        f"?playlist_id={playlist_id}"
    )
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 YANAGI-Backgammon-GitHub-Pages"
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        xml_data = response.read()

    root = ET.fromstring(xml_data)
    entry = root.find(f"{{{ATOM}}}entry")
    if entry is None:
        return None

    video_id = entry.findtext(f"{{{YT}}}videoId")
    published_text = entry.findtext(f"{{{ATOM}}}published")
    if not video_id or not published_text:
        return None

    published = datetime.fromisoformat(
        published_text.replace("Z", "+00:00")
    )
    return Entry(
        video_id=video_id.strip(),
        published=published,
        source=source,
    )


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: update_latest_youtube.py <index.html>")
        return 2

    index_path = Path(sys.argv[1])
    html = index_path.read_text(encoding="utf-8")

    candidates: list[Entry] = []

    sources = [
        (VIDEO_PLAYLIST_ID, "video"),
        (LIVE_PLAYLIST_ID, "live"),
    ]

    for playlist_id, source in sources:
        try:
            entry = fetch_latest(playlist_id, source)
            if entry is not None:
                candidates.append(entry)
                print(
                    f"{source}: {entry.video_id} "
                    f"({entry.published.isoformat()})"
                )
        except Exception as exc:
            # If normal-video retrieval fails, live-only can still win.
            # If all retrieval fails, keep the fallback video already in HTML.
            print(f"warning: could not fetch {source}: {exc}")

    if not candidates:
        print("No feed result; keeping fallback YouTube video in HTML.")
        return 0

    latest = max(candidates, key=lambda item: item.published)
    replacement = f"https://www.youtube.com/embed/{latest.video_id}"

    updated_html, count = EMBED_RE.subn(replacement, html, count=1)
    if count == 0:
        print("warning: YouTube embed URL was not found; no change made.")
        return 0

    index_path.write_text(updated_html, encoding="utf-8")
    print(
        f"Selected latest {latest.source}: "
        f"{latest.video_id} ({latest.published.isoformat()})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
