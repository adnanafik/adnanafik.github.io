#!/usr/bin/env python3
"""Generate Open Graph / Twitter card images for adnankhan.me.

Outputs to assets/:
  - og-home.png                              (1200x630) homepage card
  - og-engineer-who-just-knows.png           (1200x630) article card
  - og-ai-agents-cicd-while-i-sleep.png      (1200x630) article card
  - og-terraform-agent-under-10-min.png      (1200x630) article card
  - apple-touch-icon.png                     (180x180)  iOS home-screen icon
  - favicon-32.png                           (32x32)    legacy-browser favicon

Usage:
    python3 scripts/generate-og-images.py

Fonts (Inter + JetBrains Mono) auto-downloaded to scripts/fonts/ on first run
from FontSource CDN. scripts/fonts/ is gitignored.

To tweak per-article OG copy, edit the ARTICLES list below and re-run.
Each entry supports an optional `og_title` that overrides the full title
on the card (lets you craft a shorter, sharper headline for social).
"""

import io
import os
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


# ------------------------------ config ---------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = REPO_ROOT / "assets"
FONTS_DIR = Path(__file__).resolve().parent / "fonts"

CARD_W, CARD_H = 1200, 630

# Dark base + indigo/purple radial glows — matches site palette (#0a0a0f bg,
# 99/102/241 indigo, 168/85/247 purple). No grid/dots per spec.
BG_COLOR = (10, 10, 15)
TEXT_PRIMARY = (248, 250, 252)  # #f8fafc
TEXT_MUTED = (161, 161, 170)  # #a1a1aa
TEXT_ACCENT = (192, 132, 252)  # #c084fc (purple)
TEXT_DIM = (113, 113, 122)  # #71717a

FONTS = {
    "Inter-Bold.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
    "Inter-Medium.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf",
    "Inter-Regular.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
    "JetBrainsMono-Regular.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf",
}

ARTICLES = [
    {
        "slug": "engineer-who-just-knows",
        "title": 'The engineer who "just knows" is one resignation away. I built the fix.',
        "og_title": 'The engineer who "just knows" is one resignation away',
        "date": "APR 13, 2026",
        "read_time": "3 MIN READ",
    },
    {
        "slug": "ai-agents-cicd-while-i-sleep",
        "title": "I built a team of AI agents that fixes CI/CD failures while I sleep — here's what I learned about the future of DevOps.",
        "og_title": "I built a team of AI agents that fixes CI/CD failures while I sleep",
        "date": "MAR 31, 2026",
        "read_time": "5 MIN READ",
    },
    {
        "slug": "terraform-agent-under-10-min",
        "title": "An autonomous agent that ships validated Terraform PRs in under 10 minutes — 3-5× faster than ChatGPT and Claude.",
        "og_title": "Validated Terraform PRs in under 10 min — 3-5× faster than ChatGPT & Claude",
        "date": "MAR 26, 2026",
        "read_time": "2 MIN READ",
    },
]

PROJECTS = [
    {
        "slug": "ops-pilot",
        "name": "ops-pilot",
        "tagline": "Autonomous CI/CD incident response",
        "language": "PYTHON",
        "license": "MIT",
    },
    {
        "slug": "retro-pilot",
        "name": "retro-pilot",
        "tagline": "Autonomous incident post-mortems",
        "language": "PYTHON",
        "license": "MIT",
    },
]


# ------------------------------ helpers --------------------------------------


def ensure_fonts():
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in FONTS.items():
        dest = FONTS_DIR / name
        if dest.exists():
            continue
        print(f"  downloading {name} ...")
        req = urllib.request.Request(url, headers={"User-Agent": "og-image-generator/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        dest.write_bytes(data)


def load_font(name, size):
    return ImageFont.truetype(str(FONTS_DIR / name), size=size)


def make_background():
    """Dark base with a big soft indigo glow top-center and a purple wash
    top-right. Gaussian-blurred ellipses give a smooth radial falloff without
    needing numpy."""
    img = Image.new("RGB", (CARD_W, CARD_H), BG_COLOR)

    # Glow layer — alpha-composited onto the base.
    glow = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)

    # Indigo glow, centered near top.
    g.ellipse([150, -250, 1050, 550], fill=(99, 102, 241, 90))

    # Purple glow, offset right.
    g.ellipse([700, -180, 1400, 500], fill=(168, 85, 247, 70))

    glow = glow.filter(ImageFilter.GaussianBlur(radius=140))
    img.paste(glow, (0, 0), glow)
    return img


def wrap_title(text, font, draw, max_width, max_lines=2):
    """Wrap title to ≤ max_lines, preferring em-dash / colon as break points.
    Falls back to word-wrap. Truncates with ellipsis on overflow."""
    # Try a natural split on preferred separators first.
    for sep in (" — ", " – ", " -- ", ": ", ". "):
        if sep not in text:
            continue
        idx = text.find(sep)
        before = text[: idx + len(sep.rstrip())]
        after = text[idx + len(sep):]
        if (
            draw.textlength(before, font=font) <= max_width
            and draw.textlength(after, font=font) <= max_width
        ):
            return [before, after]
        if draw.textlength(before, font=font) <= max_width and max_lines >= 2:
            rest = _wrap_by_words(after, font, draw, max_width, max_lines - 1)
            return [before] + rest

    return _wrap_by_words(text, font, draw, max_width, max_lines)


def _wrap_by_words(text, font, draw, max_width, max_lines):
    words = text.split()
    lines, current, i = [], "", 0
    while i < len(words):
        w = words[i]
        candidate = (current + " " + w).strip() if current else w
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
            i += 1
            continue
        if current:
            lines.append(current)
            current = ""
        else:
            lines.append(w)  # single word exceeds width; accept overflow
            i += 1
        if len(lines) >= max_lines:
            current = ""
            break
    if current and len(lines) < max_lines:
        lines.append(current)

    # Ellipsize last line if we still have words remaining.
    words_used = sum(len(l.split()) for l in lines)
    if words_used < len(words) and lines:
        last = lines[-1]
        while last and draw.textlength(last + "…", font=font) > max_width:
            last = last.rsplit(" ", 1)[0] if " " in last else last[:-1]
        lines[-1] = last.rstrip() + "…"
    return lines


def draw_text_center_x(draw, text, y, font, fill):
    w = draw.textlength(text, font=font)
    draw.text(((CARD_W - w) / 2, y), text, font=font, fill=fill)


# ------------------------------ renderers ------------------------------------


def render_home_card(out_path):
    img = make_background()
    draw = ImageDraw.Draw(img)

    # Top-left brand mark
    wordmark_font = load_font("JetBrainsMono-Regular.ttf", 24)
    draw.text((64, 60), "adnankhan.me", font=wordmark_font, fill=TEXT_MUTED)

    # Top-right: small accent dot (indigo)
    dot_r = 10
    draw.ellipse(
        [CARD_W - 64 - dot_r * 2, 64, CARD_W - 64, 64 + dot_r * 2],
        fill=(129, 140, 248),
    )

    # Stack main content centered vertically, left-aligned horizontally
    f_big = load_font("Inter-Bold.ttf", 110)
    f_sub = load_font("Inter-Medium.ttf", 42)
    f_tagline = load_font("Inter-Regular.ttf", 28)

    y = 200
    draw.text((64, y), "Adnan Khan", font=f_big, fill=TEXT_PRIMARY)
    y += 140

    draw.text((64, y), "Agentic AI for DevOps", font=f_sub, fill=TEXT_ACCENT)
    y += 62

    draw.text(
        (64, y),
        "Multi-agent systems that beat the frontier models on real DevOps work.",
        font=f_tagline,
        fill=TEXT_MUTED,
    )

    # Bottom-right: dallas, tx tag
    f_small = load_font("JetBrainsMono-Regular.ttf", 20)
    tag = "DALLAS · REMOTE"
    tw = draw.textlength(tag, font=f_small)
    draw.text(
        (CARD_W - 64 - tw, CARD_H - 64 - 20),
        tag,
        font=f_small,
        fill=TEXT_DIM,
    )

    img.save(out_path, "PNG", optimize=True)
    print(f"  wrote {out_path.relative_to(REPO_ROOT)}")


def render_article_card(config, out_path):
    img = make_background()
    draw = ImageDraw.Draw(img)

    # Top-left brand
    wm = load_font("JetBrainsMono-Regular.ttf", 24)
    draw.text((64, 60), "adnankhan.me", font=wm, fill=TEXT_MUTED)

    # Top-right kicker: WRITING
    kicker = load_font("JetBrainsMono-Regular.ttf", 22)
    kicker_text = "WRITING"
    kw = draw.textlength(kicker_text, font=kicker)
    draw.text((CARD_W - 64 - kw, 60), kicker_text, font=kicker, fill=(165, 180, 252))

    # Title (wrapped) — try 72px first, drop to 64/56 if the wrapper exceeds 2 lines.
    headline = config.get("og_title") or config["title"]
    title_area_w = CARD_W - 64 * 2

    chosen = None
    for size in (76, 68, 60, 52):
        f = load_font("Inter-Bold.ttf", size)
        lines = wrap_title(headline, f, draw, title_area_w, max_lines=2)
        # accept if wrap succeeded without needing ellipsis and fits 2 lines
        if len(lines) <= 2 and not any(l.endswith("…") for l in lines):
            chosen = (f, lines, size)
            break
    if not chosen:
        f = load_font("Inter-Bold.ttf", 52)
        lines = wrap_title(headline, f, draw, title_area_w, max_lines=2)
        chosen = (f, lines, 52)

    f_title, lines, size = chosen
    line_height = int(size * 1.12)

    total_h = line_height * len(lines)
    y = (CARD_H - total_h) // 2 - 20  # slight upward bias
    for line in lines:
        draw.text((64, y), line, font=f_title, fill=TEXT_PRIMARY)
        y += line_height

    # Bottom: date (left) and read time (right)
    meta_font = load_font("JetBrainsMono-Regular.ttf", 22)
    by = CARD_H - 64 - 22
    draw.text((64, by), config["date"], font=meta_font, fill=TEXT_DIM)

    rt = config["read_time"]
    rtw = draw.textlength(rt, font=meta_font)
    draw.text((CARD_W - 64 - rtw, by), rt, font=meta_font, fill=TEXT_DIM)

    img.save(out_path, "PNG", optimize=True)
    print(f"  wrote {out_path.relative_to(REPO_ROOT)}")


def render_project_card(config, out_path):
    img = make_background()
    draw = ImageDraw.Draw(img)

    wm = load_font("JetBrainsMono-Regular.ttf", 24)
    draw.text((64, 60), "adnankhan.me", font=wm, fill=TEXT_MUTED)

    kicker = load_font("JetBrainsMono-Regular.ttf", 22)
    kicker_text = f"OPEN SOURCE · {config['license']}"
    kw = draw.textlength(kicker_text, font=kicker)
    draw.text((CARD_W - 64 - kw, 60), kicker_text, font=kicker, fill=(165, 180, 252))

    # Name — big
    f_name = load_font("Inter-Bold.ttf", 130)
    y_name = 200
    draw.text((64, y_name), config["name"], font=f_name, fill=TEXT_PRIMARY)

    # Tagline
    f_tag = load_font("Inter-Medium.ttf", 40)
    draw.text((64, y_name + 165), config["tagline"], font=f_tag, fill=TEXT_ACCENT)

    # Bottom row: language badge (left), repo hint (right)
    f_small = load_font("JetBrainsMono-Regular.ttf", 22)
    by = CARD_H - 64 - 22
    draw.text((64, by), config["language"], font=f_small, fill=TEXT_DIM)
    repo_hint = "github.com/adnanafik/" + config["slug"]
    rhw = draw.textlength(repo_hint, font=f_small)
    draw.text((CARD_W - 64 - rhw, by), repo_hint, font=f_small, fill=TEXT_DIM)

    img.save(out_path, "PNG", optimize=True)
    print(f"  wrote {out_path.relative_to(REPO_ROOT)}")


def render_app_icon(size, out_path, rounded=True):
    """Dark square with a simple white lightning bolt centered."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Rounded dark background.
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    radius = int(size * 0.22) if rounded else 0
    bg_draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=(15, 15, 24, 255))
    # Subtle inner glow via a big blurred indigo ellipse.
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [(-size * 0.2, -size * 0.4), (size * 1.2, size * 0.9)],
        fill=(99, 102, 241, 140),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.18))
    bg.alpha_composite(glow)

    # Lightning bolt polygon — simple stylized ⚡ in white
    s = size
    bolt = [
        (0.58 * s, 0.10 * s),
        (0.30 * s, 0.52 * s),
        (0.48 * s, 0.52 * s),
        (0.38 * s, 0.90 * s),
        (0.72 * s, 0.44 * s),
        (0.52 * s, 0.44 * s),
        (0.62 * s, 0.10 * s),
    ]
    bolt_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(bolt_img).polygon(bolt, fill=(255, 255, 255, 255))
    bg.alpha_composite(bolt_img)

    img.alpha_composite(bg)
    img.save(out_path, "PNG", optimize=True)
    print(f"  wrote {out_path.relative_to(REPO_ROOT)}")


# ------------------------------ main -----------------------------------------


def main():
    print("Ensuring fonts...")
    ensure_fonts()

    ASSETS_DIR.mkdir(exist_ok=True)

    print("\nRendering homepage card...")
    render_home_card(ASSETS_DIR / "og-home.png")

    print("\nRendering article cards...")
    for article in ARTICLES:
        render_article_card(article, ASSETS_DIR / f"og-{article['slug']}.png")

    print("\nRendering project cards...")
    for project in PROJECTS:
        render_project_card(project, ASSETS_DIR / f"og-{project['slug']}.png")

    print("\nRendering favicon + apple-touch-icon...")
    render_app_icon(180, ASSETS_DIR / "apple-touch-icon.png", rounded=True)
    render_app_icon(32, ASSETS_DIR / "favicon-32.png", rounded=True)

    print("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
