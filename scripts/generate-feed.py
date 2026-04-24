#!/usr/bin/env python3
"""Generate /writing/rss.xml by scanning writing/*/index.html.

Each article page must have a JSON-LD Article schema with these fields:
  - headline          → RSS <title>
  - description       → RSS <description>
  - datePublished     → RSS <pubDate>  (YYYY-MM-DD)
  - mainEntityOfPage.@id → RSS <link> and <guid>

Usage:
    python3 scripts/generate-feed.py

Run after adding or editing a writing post, then commit the updated
rss.xml. No external dependencies — stdlib only.

The script also updates <lastBuildDate> to now (UTC) on every run.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
WRITING_DIR = REPO_ROOT / "writing"
OUTPUT = WRITING_DIR / "rss.xml"

# Feed-level metadata. Edit here if brand voice ever changes.
FEED_TITLE = "Adnan Khan — Writing"
FEED_LINK = "https://adnankhan.me/"
FEED_DESCRIPTION = (
    "Deep-dives on agentic AI systems, platform engineering, "
    "and the future of DevOps by Adnan Khan."
)
FEED_LANGUAGE = "en-US"
FEED_AUTHOR = "adnan@adnankhan.me (Adnan Khan)"
FEED_SELF_URL = "https://adnankhan.me/writing/rss.xml"


def extract_article(html_path):
    """Parse a writing/<slug>/index.html and return a dict of feed-relevant
    metadata, or None if the page has no Article JSON-LD."""
    html = html_path.read_text()
    for m in re.finditer(
        r'<script type="application/ld\+json">(.*?)</script>',
        html,
        re.DOTALL,
    ):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if data.get("@type") != "Article":
            continue

        main = data.get("mainEntityOfPage")
        link = main.get("@id") if isinstance(main, dict) else main
        if not link:
            continue

        pub_raw = data.get("datePublished")
        if not pub_raw:
            continue
        try:
            pub_date = datetime.strptime(pub_raw[:10], "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            continue

        return {
            "title": (data.get("headline") or "").strip(),
            "description": (data.get("description") or "").strip(),
            "link": link,
            "pub_date": pub_date,
        }
    return None


def rfc_822(dt):
    return dt.strftime("%a, %d %b %Y %H:%M:%S GMT")


def render_item(item):
    return f"""    <item>
      <title><![CDATA[{item['title']}]]></title>
      <link>{item['link']}</link>
      <guid isPermaLink="true">{item['link']}</guid>
      <pubDate>{rfc_822(item['pub_date'])}</pubDate>
      <author>{FEED_AUTHOR}</author>
      <description><![CDATA[{item['description']}]]></description>
    </item>"""


def main():
    if not WRITING_DIR.exists():
        print("ERR: writing/ directory not found")
        return 1

    articles = []
    for article_dir in sorted(WRITING_DIR.iterdir()):
        if not article_dir.is_dir():
            continue
        idx = article_dir / "index.html"
        if not idx.exists():
            continue
        md = extract_article(idx)
        if md is None:
            print(f"  skip   {article_dir.name}: no Article JSON-LD found")
            continue
        articles.append(md)
        print(f"  found  {article_dir.name} ({md['pub_date'].date()}): {md['title'][:60]}…")

    if not articles:
        print("No valid articles found.")
        return 1

    articles.sort(key=lambda a: a["pub_date"], reverse=True)

    now = datetime.now(timezone.utc)
    items = "\n\n".join(render_item(a) for a in articles)

    feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{FEED_TITLE}</title>
    <link>{FEED_LINK}</link>
    <description>{FEED_DESCRIPTION}</description>
    <language>{FEED_LANGUAGE}</language>
    <lastBuildDate>{rfc_822(now)}</lastBuildDate>
    <generator>scripts/generate-feed.py</generator>
    <atom:link href="{FEED_SELF_URL}" rel="self" type="application/rss+xml" />

{items}

  </channel>
</rss>
"""
    OUTPUT.write_text(feed)
    print(f"\nWrote {len(articles)} items → {OUTPUT.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
