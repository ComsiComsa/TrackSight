#!/usr/bin/env python3
"""Generate PNG icons from scratch using Pillow, matching the logo.svg design."""

from PIL import Image, ImageDraw
import math

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))

def generate_icon(size):
    # Work at 4x for antialiasing
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Colors
    indigo = (79, 70, 229)
    purple = (124, 58, 237)
    green = (16, 185, 129)
    amber = (245, 158, 11)
    red = (239, 68, 68)
    white = (255, 255, 255)

    # Rounded rect background with gradient approximation
    corner = int(s * 96 / 512)
    # Draw gradient background using horizontal strips
    for y in range(s):
        t = (y + 0) / s  # diagonal approximation
        t2 = t
        color = lerp_color(indigo, purple, t2)
        draw.line([(0, y), (s, y)], fill=color)

    # Create rounded corner mask
    mask = Image.new("L", (s, s), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=corner, fill=255)
    img.putalpha(mask)

    # Re-create draw on composited image
    draw = ImageDraw.Draw(img)

    # Scale helper
    def sc(v):
        return int(v * s / 512)

    # Magnifying glass - outer ring
    cx, cy = sc(230), sc(230)
    r_outer = sc(120)
    ring_w = sc(16)  # half of stroke-width 32

    # Draw thick circle ring
    for t in range(3600):
        angle = math.radians(t / 10)
        for dr in range(-ring_w, ring_w + 1):
            x = int(cx + (r_outer + dr * 0.5) * math.cos(angle))
            y = int(cy + (r_outer + dr * 0.5) * math.sin(angle))
            if 0 <= x < s and 0 <= y < s:
                draw.point((x, y), fill=(*white, 230))

    # Better approach: use ellipse
    img2 = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(img2)

    # Outer circle
    sw = sc(32)
    d2.ellipse([cx - r_outer - sw//2, cy - r_outer - sw//2,
                cx + r_outer + sw//2, cy + r_outer + sw//2],
               fill=(*white, 230))
    # Inner cutout (transparent)
    d2.ellipse([cx - r_outer + sw//2, cy - r_outer + sw//2,
                cx + r_outer - sw//2, cy + r_outer - sw//2],
               fill=(0, 0, 0, 0))

    # Lens fill (subtle)
    r_lens = sc(80)
    lens_img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    lens_draw = ImageDraw.Draw(lens_img)
    lens_draw.ellipse([cx - r_lens, cy - r_lens, cx + r_lens, cy + r_lens],
                      fill=(224, 231, 255, 60))
    img = Image.alpha_composite(img, lens_img)

    # Handle
    handle_img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    handle_draw = ImageDraw.Draw(handle_img)
    hw = sc(18)  # half width
    x1, y1 = sc(320), sc(320)
    x2, y2 = sc(420), sc(420)
    # Draw thick line as polygon
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    nx = -dy / length * hw
    ny = dx / length * hw
    handle_draw.polygon([
        (x1 + nx, y1 + ny), (x1 - nx, y1 - ny),
        (x2 - nx, y2 - ny), (x2 + nx, y2 + ny)
    ], fill=(*white, 230))
    # Round caps
    handle_draw.ellipse([x1 - hw, y1 - hw, x1 + hw, y1 + hw], fill=(*white, 230))
    handle_draw.ellipse([x2 - hw, y2 - hw, x2 + hw, y2 + hw], fill=(*white, 230))
    img = Image.alpha_composite(img, handle_img)

    # Composite ring
    img = Image.alpha_composite(img, img2)

    draw = ImageDraw.Draw(img)

    # Bar chart inside lens
    bars = [
        (sc(180), sc(250), sc(22), sc(40), green),
        (sc(210), sc(220), sc(22), sc(70), amber),
        (sc(240), sc(195), sc(22), sc(95), red),
        (sc(270), sc(235), sc(22), sc(55), green),
    ]
    for bx, by, bw, bh, color in bars:
        rr = sc(4)
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=rr,
                               fill=(*color, 230))

    # Dots on top of bars
    dots = [(sc(191), sc(240)), (sc(221), sc(210)), (sc(251), sc(185)), (sc(281), sc(225))]
    dot_r = sc(4)
    for dx, dy in dots:
        draw.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r],
                     fill=(*white, 180))

    # Connecting line through dots
    for i in range(len(dots) - 1):
        lw = max(1, sc(2))
        draw.line([dots[i], dots[i + 1]], fill=(*white, 128), width=lw)

    # Signal arcs top-right
    arc_center_x, arc_center_y = sc(385), sc(115)
    for i, (radius, alpha) in enumerate([(sc(30), 75), (sc(50), 50), (sc(70), 30)]):
        arc_w = max(1, sc(5))
        bbox = [arc_center_x - radius, arc_center_y - radius,
                arc_center_x + radius, arc_center_y + radius]
        # Draw arc from -45 to 45 degrees (top-right quadrant)
        draw.arc(bbox, start=-135, end=-45, fill=(*white, alpha), width=arc_w)

    # Downscale with high-quality resampling
    img = img.resize((size, size), Image.LANCZOS)
    return img


if __name__ == "__main__":
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

    for size in [16, 48, 128]:
        icon = generate_icon(size)
        path = os.path.join(out_dir, f"icon{size}.png")
        icon.save(path, "PNG")
        print(f"Generated {path} ({size}x{size})")

    # Also generate 512px for store listing
    icon512 = generate_icon(512)
    path512 = os.path.join(out_dir, "icon512.png")
    icon512.save(path512, "PNG")
    print(f"Generated {path512} (512x512)")
