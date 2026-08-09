# HackCanada design system

Shared visual language for the judging platform monorepo (`client/`).

**Source of truth:** the judge desk (`/judging`). Cool grey shell + full-bleed blue departure-board hero (`#0A5FB4`).

## Tokens

Defined in `client/app/design-tokens.css` (readable source) and inlined in `client/app/globals.css` for Turbopack.

| Token | Value | Use |
|-------|-------|-----|
| `--hc-paper` | `#f5f7fa` | Page / shell background |
| `--hc-ink` | `#141210` | Primary text on light surfaces |
| `--hc-muted` | `#5b6470` | Secondary text on shell (≥ 4.5:1) |
| `--hc-faint` | `#66707c` | Tertiary labels on shell (≥ 4.5:1; darkened from `#8a929c` which failed AA) |
| `--hc-border` | `#d5dbe3` | Hairlines, panel edges |
| `--hc-white` | `#ffffff` | Elevated panels |
| `--hc-action` | `#0a5fb4` | Hero fill, links, primary CTAs |
| `--hc-action-hover` | `#084a8f` | Action hover |
| `--hc-live` | `#e11d2e` | Live only |
| `--hc-overtime` | `#d97706` | Overtime only |
| `--hc-on-ink` | `#ffffff` | Text on blue hero |
| `--hc-on-ink-muted` | `#d6e4f5` | Secondary text on hero (≥ 4.5:1) |
| `--hc-on-ink-faint` | `#d6e4f5` | Tertiary on hero |

Also: Fredoka (`--hc-font-display`), Rubik (`--hc-font-body`), spacing `--hc-space-*`, radius `--hc-radius` / `--hc-radius-lg`, shadow `--hc-shadow`.

Tailwind: `bg-hc-paper`, `text-hc-ink`, `font-hc-display`, `rounded-hc`, `shadow-hc`, etc.

Judge desk keeps `--j-*` aliases inside `.judging-shell` pointing at `--hc-*`. Hero uses `--j-action` (blue), not ink.

## Primitives

Import from `@/components/design-system`:

- `AppHeader` / `AppHeaderBack` - portal name, context, right-side status
- `Card` - white panel with border (use for interactive containers only)
- `Button` - `primary` (blue fill), `secondary` (blue link), `outline` (light bordered)
- `PortalNav` - portal link grid

## Adoption status

| Portal | Status |
|--------|--------|
| Judging (`app/judging`) | On shared tokens (source of truth) |
| Portal picker (`app/page.tsx`) | Converted |
| Admin (`app/admin`) | Converted |
| Hacker (`app/hacker`) | Not converted - adopt when ready |
| Sponsor (`app/sponsor`) | Not converted - adopt when ready |
| Volunteer (`app/volunteer`) | Not converted - adopt when ready |

## Rules

1. Cool shell (`#f5f7fa`) + ink text; blue full-bleed hero where wayfinding needs it (judge desk).
2. Blue (`#0A5FB4`) for hero, links, and primary CTAs; red for live; amber for overtime.
3. No em dashes in UI copy.
4. Prefer shared primitives over shadcn default primary for portal chrome.
