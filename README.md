# Coral Dental — website

Static site for Coral Dental (Dr. Mandar Ketkar). Built from the Claude Design handoff in
`Dr. Ketkar Dental Clinic UI-handoff/`. No build step, no dependencies —
open `index.html` or serve the folder.

```bash
python -m http.server 5188
```

## Layout

```
index.html            markup, SEO meta, LocalBusiness JSON-LD, booking dialog
styles/base.css       tokens, reset, header, footer, buttons, dialog
styles/sections.css   hero + services (the two full-height photo sections)
styles/content.css    implants, about, visit
styles/interaction.css  press feedback, pointer capability, material fallbacks
scripts/main.js       tile masks, header height, nav, booking hand-off
scripts/booking-sheet.js  drag-to-dismiss booking sheet on phones
assets/img/*.webp     all imagery, converted from the handoff PNGs
assets/fonts/*.woff2  Open Sauce One, self-hosted (SIL OFL 1.1, see OFL.txt)
```

Nothing loads from a third party except the Google Maps iframe, which is
lazy and below the fold.

## Hero

Rebuilt rather than traced. The prototype's hero was a flat swatch with a
stock chair render floating in dead space and no call to action; this one is a
proper editorial stack — kicker, display type, lede, two CTAs, three proof
chips — with the portrait keyed out and lit.

`hero-doctor.webp` is now a **transparent cut-out**. It shipped with a flat
`#E3DED6` matte baked in, which was invisible against the design's flat panel
but showed as a hard rectangle the moment the panel got a gradient. Keep it
transparent if you re-export it. Stacked, the portrait becomes a cropped photo
band across the top of the panel — see the `--band` variable.

## The one non-obvious bit

Sections 1 and 2 paint a **single** photograph across several rounded tiles, so
each tile's `background-position` has to be derived from its offset inside the
section. `layout()` in `scripts/main.js` does that (ported from the prototype)
and re-runs on resize. Below 900px the tiles stack and no longer form one
canvas, so each falls back to its own crop driven by the `data-mobile-pos` /
`data-mobile-size` attributes on `.mask`.

## Before go-live

Replace the placeholders — search the repo for `PLACEHOLDER`:

| What | Where |
| --- | --- |
| Phone number (`tel:` × 4) | `index.html` header, Call Us, visit, dialog |
| WhatsApp number | `CLINIC_WHATSAPP` in `scripts/main.js` |
| Street address | `index.html` visit section + JSON-LD |
| Email | `index.html` visit section |
| Clinic hours | `index.html` visit section + JSON-LD (currently assumed) |
| Google Maps pin | `index.html` iframe `src` and the directions link |
| Canonical / OG URL | `index.html` `<head>` |

Booking has no backend: the form builds a `wa.me` link with the details
prefilled. Swap the submit handler if a real endpoint appears.

## Added beyond the design file

The handoff stops after the About section. Added, in the same visual language:
a Visit section (address, hours, map, directions), a footer, working
navigation with a mobile menu, and the booking dialog. Everything else matches
the prototype's measurements.
