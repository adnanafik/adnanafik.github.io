#!/usr/bin/env python3
"""Refresh GitHub star counts embedded in project pages.

Finds HTML elements with a `data-gh-repo="<owner>/<name>"` attribute on any
page under projects/, fetches the current star count from the GitHub REST
API, and replaces the element's inner text with the number.

Run this manually whenever you want the displayed count refreshed:

    python3 scripts/update-project-stats.py

Then commit + push. Intentionally not on every deploy — the GitHub API
has a 60 req/hr limit for unauthenticated calls, and a slightly stale
star count is not worth rate-limit headaches.

Exit codes: 0 = all good, 1 = at least one repo failed to fetch.
"""

import json
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = REPO_ROOT / "projects"
API_BASE = "https://api.github.com/repos"


def fetch_stars(repo):
    req = urllib.request.Request(
        f"{API_BASE}/{repo}",
        headers={
            "User-Agent": "adnankhan-site-build/1.0",
            "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.load(r)
    return int(data["stargazers_count"])


def update_file(path):
    """Rewrite any <tag data-gh-repo="..."> ... </tag> whose body is a bare
    integer. Also updates a companion data-gh-updated timestamp if present."""
    src = path.read_text()
    pattern = re.compile(
        r'(<([a-z0-9]+)\b[^>]*\bdata-gh-repo="([^"]+)"[^>]*>)'
        r"([^<]*)"
        r"(</\2>)",
        re.IGNORECASE,
    )

    failures = []
    changed = False
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def replace(m):
        nonlocal changed
        open_tag, tag_name, repo, _inner, close_tag = m.groups()
        try:
            count = fetch_stars(repo)
        except Exception as e:
            failures.append((repo, str(e)))
            return m.group(0)
        # If the tag has a data-gh-updated attribute, refresh it too.
        new_open = re.sub(
            r'data-gh-updated="[^"]*"',
            f'data-gh-updated="{now}"',
            open_tag,
        )
        new_block = f"{new_open}{count}{close_tag}"
        if new_block != m.group(0):
            changed = True
        return new_block

    new_src = pattern.sub(replace, src)
    if changed:
        path.write_text(new_src)
        print(f"  updated {path.relative_to(REPO_ROOT)}")
    else:
        print(f"  no-op   {path.relative_to(REPO_ROOT)}")
    return failures


def main():
    if not PROJECTS_DIR.exists():
        print("No projects/ directory; nothing to do.")
        return 0

    html_files = sorted(PROJECTS_DIR.rglob("index.html"))
    if not html_files:
        print("No projects/*/index.html files found.")
        return 0

    all_failures = []
    for f in html_files:
        all_failures.extend(update_file(f))

    if all_failures:
        print("\nSome repos failed to fetch:")
        for repo, err in all_failures:
            print(f"  {repo}: {err}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
