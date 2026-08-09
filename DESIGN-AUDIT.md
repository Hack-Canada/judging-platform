# HackCanada design audit

Read-only survey of portal UI across remote branches. Claims cite file paths and values from code. Gaps marked "not found". Recommendations are labeled separately from evidence.

**Audit date:** 2026-07-12  
**Started on branch:** `aly/judging`  
**Method:** `git fetch --all`, then `git switch --detach origin/<branch>` per portal. Duplicate portal remotes compared by last-commit date; newer tip audited; older noted as ambiguous.

---

## 1. Branch map

### 1.1 All local and remote branches (from `git branch -a` after fetch)

**Local:** `aly-onboarding-old`, `aly/judging`, `development`, `main`, `onboarding`

**Remote:**
- `origin/HEAD` → `origin/main`
- `origin/aly`
- `origin/aly-judging`
- `origin/amy/volunteer-sponsor`
- `origin/dev/amy`
- `origin/dev/linusgao`
- `origin/dev/tenzin`
- `origin/dev/verification`
- `origin/development`
- `origin/linus/hacker`
- `origin/main`
- `origin/onboarding`
- `origin/tenzin/admin`

### 1.2 Base branch

`origin/development` tip: `2026-06-29 15:12:00 -0400` `3bab738` "fix: added skills"

### 1.3 Portal branch ownership (by path presence + naming; tips below)

| Portal | Primary remote audited | Last commit | Alternate (older / ambiguous) | Alternate last commit |
|--------|------------------------|-------------|-------------------------------|------------------------|
| Portal picker + shared shell | `origin/development` | 2026-06-29 | also present on portal branches | — |
| Judging | `origin/aly-judging` | 2026-07-05 `d45bec4` | `origin/aly` 2026-06-23 (older) | 2026-06-23 |
| Sponsor / Volunteer | `origin/amy/volunteer-sponsor` | 2026-07-06 `edc70c7` | `origin/dev/amy` | 2026-06-24 |
| Hacker | `origin/linus/hacker` | 2026-07-11 `9495f8b` | `origin/dev/linusgao` | 2026-06-23 |
| Admin | `origin/tenzin/admin` | 2026-07-04 `a037c1c` | `origin/dev/tenzin` | 2026-06-23 |

### 1.4 Merge status into `origin/development` (evidence: `git merge-base --is-ancestor` + rev-list counts)

| Branch | Fully merged into development? | Commits ahead of development | Commits behind development |
|--------|--------------------------------|------------------------------|----------------------------|
| `origin/aly-judging` | No | 11 | 0 |
| `origin/amy/volunteer-sponsor` | No | 2 | 2 |
| `origin/dev/amy` | No | 360 | 360 |
| `origin/linus/hacker` | No | 8 | 8 |
| `origin/dev/linusgao` | No | 1 | 1 |
| `origin/tenzin/admin` | No | 1 | 1 |
| `origin/dev/tenzin` | No | 360 | 360 |

None of the portal feature branches are fully merged into `origin/development` at audit time.

### 1.5 Duplicate-pair resolution (explicit)

- **Amy:** audited `origin/amy/volunteer-sponsor` (newer). `origin/dev/amy` is older and has a divergent history (360/360 ahead/behind). Ambiguity noted: both may contain volunteer/sponsor work; only the newer tip was fully surveyed.
- **Linus:** audited `origin/linus/hacker` (newer). `origin/dev/linusgao` older / mostly structural.
- **Tenzin:** audited `origin/tenzin/admin` (newer). `origin/dev/tenzin` older / divergent (360/360).

---

## 2. Per-portal findings

_(Sections appended as each detached ref is surveyed.)_


### 2.1 Portal picker + shared shell (origin/development @ `3bab738`)

**Surveyed:** detached `origin/development`. Chat note: findings for development appended.

#### Files
- Route entry: `client/app/page.tsx`
- Root layout: `client/app/layout.tsx`
- Globals: `client/app/globals.css`
- Fonts: `client/lib/fonts.ts`
- Shared stub: `client/components/portal-stub.tsx`
- Stub routes on this tip: `client/app/judging/page.tsx`, `client/app/admin/page.tsx`, `client/app/hacker/page.tsx`, `client/app/sponsor/page.tsx`, `client/app/volunteer/page.tsx` (each returns `PortalStub` only)
- shadcn button: `client/components/ui/button.tsx`

#### Design language
- Background: `bg-primary` on `body` in `client/app/layout.tsx`; `--primary: oklch(0.50 0.17 215)` in `client/app/globals.css` `:root` (hex not found in repo)
- Primary text on shell: `text-primary-foreground`; `--primary-foreground: oklch(0.98 0.01 220)` in `globals.css`
- Accent / link treatment: portal buttons use `variant="secondary"` + `text-primary` (`page.tsx`); `--secondary: oklch(0.967 0.006 220)`; `--secondary-foreground: oklch(0.21 0.015 215)`
- Fonts: body applies `fredoka.className` (`layout.tsx`); Rubik loaded as CSS variable `--font-rubik` only (`fonts.ts`); `@theme` maps `--font-sans: var(--font-rubik)` but body does not apply Rubik class
- Layout type: centered single-column portal picker (no hero, no sidebar) in `page.tsx`
- Border radius: `--radius: 0.625rem` in `globals.css`; buttons use `rounded-md` (`button.tsx`)
- Shadow: button outline variant uses `shadow-xs`; portal picker secondary buttons do not set an explicit shadow class in `page.tsx`

#### Design tokens
- shadcn / Tailwind CSS variables in `client/app/globals.css` (`--primary`, `--secondary`, `--radius`, sidebar tokens, etc.)
- No `--j-*` or `--hc-*` tokens found on this tip
- Hardcoded hex in portal picker: not found
- Tailwind `@theme inline` maps colors to those CSS variables

#### Component library
- shadcn `Button` from `@/components/ui/button`
- `PortalStub` shared across stub portals
- No portal-specific design-system folder found

#### Data / behavior
- Portal picker: static links only; no DB calls found in `page.tsx`
- Stub portals: placeholder UI only

#### Mobile
- `sm:grid-cols-2` on portal grid in `page.tsx`
- No other portal-picker breakpoints found


### 2.2 Judging portal (`origin/aly-judging` @ `d45bec4`)

**Surveyed:** detached `origin/aly-judging`. Chat note: findings for judging appended.

#### Files
- Route: `client/app/judging/page.tsx`
- Layout: `client/app/judging/layout.tsx` (imports `judging.css`, wraps `.judging-shell`)
- Orchestrator: `client/app/judging/judging-portal.tsx`
- Styles: `client/app/judging/judging.css`
- Docs: `client/app/judging/README.md`
- Components (`client/components/judging/`): `judging-header.tsx`, `judging-footer.tsx`, `project-spotlight.tsx`, `location-board.tsx`, `session-timer.tsx`, `session-rail.tsx`, `schedule-dock.tsx`, `live-ribbon.tsx`, `stream-selector.tsx`, `judge-notes-panel.tsx`, `completion-banner.tsx`, `break-banner.tsx`, `action-feedback.tsx`, `loading-shell.tsx`, `judging-error-screen.tsx`, `reset-stream-confirm.tsx`, `skip-reason-picker.tsx`, `sync-status.tsx`
- Lib (`client/lib/judging/`): `get-data.ts`, `offline-queue.ts`, `storage.ts`, `slots.ts`, `streams.ts`, `use-judging-sync.ts`, and others listed under that directory
- Shared root still teal: `client/app/layout.tsx`, `client/app/page.tsx` (portal picker unchanged pattern from development)

#### Design language
- Shell background: `background-color: var(--j-paper)` where `--j-paper: var(--secondary)` (`judging.css`); `--secondary: oklch(0.967 0.006 220)` in `globals.css` (hex not found)
- Shell text: `color: var(--j-ink)` / `--j-ink: var(--foreground)`; `--foreground: oklch(0.147 0.004 49.25)` (`globals.css`)
- Hero: `background: var(--primary)`; `color: var(--primary-foreground)` (`judging.css`); `--primary: oklch(0.50 0.17 215)` (`globals.css`). Hex not found.
- Accent / action: `--j-action: var(--primary)`; CTAs `.j-cta--primary` use `background: var(--primary)` (`judging.css`)
- Live: `--j-live: var(--destructive)`; overtime `--j-overtime: oklch(0.72 0.16 65)` (`judging.css`)
- Font: `font-family: var(--font-fredoka), system-ui, sans-serif` on `.judging-shell` (`judging.css`); root body also `fredoka.className` (`layout.tsx`); `fredoka.variable` + `rubik.variable` on `html` (`layout.tsx`)
- Layout type: full-bleed hero (`.j-hero`) + content grid + fixed footer; schedule panel sticky at `min-width: 1024px` (`judging.css`). Not a sidebar dashboard.
- Radius: inherits shadcn `--radius` / `var(--radius)` usages in places; exact portal-only radius hex/px override: not found as a dedicated judging token
- Shadow: schedule dock / feedback use `box-shadow` in `judging.css` (values present in file; e.g. feedback panel pattern around white cards). Exact multi-line values: see `judging.css` near `.j-schedule-dock` / `.j-action-feedback-inner`

#### Design tokens
- Portal-scoped `--j-*` aliases to shadcn globals (`judging.css`)
- Global shadcn tokens in `client/app/globals.css`
- Hardcoded paper/ink hex palette (`#f5f3ef`, `#141210`): not found on this tip (aliases to oklch shadcn instead)
- `--hc-*`: not found

#### Component library
- Mostly custom judging components under `client/components/judging/`
- Uses shadcn `Drawer` from `@/components/ui/drawer` (`schedule-dock.tsx`)
- Other judging UI largely CSS classes (`.j-*`) rather than shared design-system package (design-system folder: not found on this tip)

#### Data / behavior
- Server load via `getJudgingDataset` in `get-data.ts` from `page.tsx` (Neon/DB when `DATABASE_URL` present; force-dynamic)
- Client state + `localStorage` offline queue (`offline-queue.ts`, `storage.ts`) and sync hooks
- Mock fallback behavior: not re-verified in depth on this tip; README describes real DB path

#### Mobile
- Breakpoints in `judging.css`: `640px`, `768px`, `1024px`, `max-width: 1023px` (mobile padding / hide schedule dock on large screens)
- `sm:` utility classes in several judging components


### 2.3 Sponsor + Volunteer (`origin/amy/volunteer-sponsor` @ `edc70c7`)

**Surveyed:** detached `origin/amy/volunteer-sponsor`. Chat note: findings for Amy sponsor/volunteer appended.

**Ambiguity:** `origin/dev/amy` last commit `2026-06-24` is older; `git ls-tree` on that tip did not list sponsor/volunteer paths in the filtered sample (no matching names returned). Full deep audit of `dev/amy` not performed.

#### Files (Sponsor)
- `client/app/sponsor/page.tsx`, `layout.tsx`
- `client/app/sponsor/components/`: `sponsor-dashboard.tsx`, `sponsor-sidebar.tsx`, `dashboard-header.tsx`, `mobile-nav-trigger.tsx`, `nav-items.ts`, `coming-soon.tsx`
- Subroutes: `check-in/page.tsx`, `schedule/page.tsx`
- Logo: `client/app/hackcanada.png` (imported in layout)

#### Files (Volunteer)
- `client/app/volunteer/page.tsx`, `layout.tsx`
- `client/app/volunteer/components/`: `volunteer-dashboard.tsx`, `volunteer-sidebar.tsx`, `dashboard-header.tsx`, `current-shift-card.tsx`, `upcoming-shifts-list.tsx`, `shift-card.tsx`, `shift-details-dialog.tsx`, `mobile-nav-trigger.tsx`, `nav-items.ts`, `coming-soon.tsx`, `format-shift-time.ts`
- `client/app/volunteer/data/shifts.ts` (`mockShifts`)
- Subroutes: `check-in/page.tsx`, `event-schedule/page.tsx`, `shift-schedule/page.tsx`

#### Design language
- Brand title accent: Tailwind class `text-blue-700` on headers/sidebar brand (e.g. `sponsor/layout.tsx`, `sponsor/components/dashboard-header.tsx`, `volunteer/components/dashboard-header.tsx`). Exact hex for `blue-700`: not found in repo CSS/config (utility class only).
- Content background: `bg-muted/40` (`sponsor-dashboard.tsx`, `volunteer-dashboard.tsx`); `--muted: oklch(0.967 0.006 220)` in `globals.css`
- Body / shell conflict evidence: `layout.tsx` sets `body` class `bg-primary text-primary-foreground`; `globals.css` `@layer base` also sets `body { @apply bg-background text-foreground; }`. `--background: oklch(1 0 0)`; `--primary: oklch(0.50 0.17 215)`.
- Sidebar tokens: `--sidebar: oklch(0.985 0.002 220)` etc. in `globals.css`; components use `@/components/ui/sidebar`
- Fonts: `fredoka.className` on body (`layout.tsx`); Rubik as `--font-rubik` variable only (`html` class in layout on this tip: `rubik.variable` only, no `fredoka.variable` in the read `layout.tsx`)
- Layout type: **sidebar dashboard** (`SidebarProvider` + `SponsorSidebar` / `VolunteerSidebar` + `SidebarInset`)
- Radius: shadcn `--radius: 0.625rem`; cards use `rounded-md` (`shift-card.tsx`)
- Shadow: not found as a custom portal shadow token; shadcn card defaults may apply (exact shadow class on sponsor dashboard: not found)

#### Design tokens
- shadcn CSS variables in `globals.css`
- Hardcoded Tailwind palette class `text-blue-700` (not mapped to `--primary`)
- No `--j-*` / `--hc-*` found under sponsor/volunteer trees

#### Component library
- Heavy shadcn: `sidebar`, `card`, `badge`, `dialog`, `button`
- Portal-local components under `app/sponsor/components` and `app/volunteer/components`
- Icons: `@hugeicons/react` in sidebar

#### Data / behavior
- Sponsor: mostly static / coming-soon placeholder copy; no DB fetch found in `sponsor-dashboard.tsx`
- Volunteer: `mockShifts` from `data/shifts.ts`; client state for selected shift dialog (`volunteer-dashboard.tsx`)

#### Mobile
- Mobile header `md:hidden` with `MobileNavTrigger` (`sponsor/layout.tsx`, `volunteer/layout.tsx`)
- Sidebar collapse via shadcn sidebar hooks


### 2.4 Hacker portal (`origin/linus/hacker` @ `9495f8b`)

**Surveyed:** detached `origin/linus/hacker`. Chat note: findings for hacker appended.

**Ambiguity:** `origin/dev/linusgao` last commit `2026-06-23` is older; not fully audited.

#### Files
- `client/app/hacker/page.tsx`, `layout.tsx`, `SideBar.tsx`, `Navbar.tsx`
- Subroutes: `schedule/`, `food/`, `location/` (`LocationMap.tsx`), `submission/page.tsx`, `projects/` (`projects-hub.tsx`, etc.)
- Lib: `client/lib/projects.ts`, `client/lib/schedule.ts`, `client/lib/db.ts`, `client/lib/queries.ts`
- Root layout/fonts expanded: `client/app/layout.tsx`, `client/lib/fonts.ts`

#### Design language
- Sidebar background: hardcoded `bg-[#0099CC]` (`SideBar.tsx`); white/opacity text `text-white/90`
- Dashboard main (stub home): `bg-[#E3F3FF]` (`page.tsx`); also food page `bg-[#E3F3FF]` (`food/page.tsx`)
- Schedule page: `bg-[#f7f3ea]` text `text-[#3f3850]` muted `text-[#776780]` (`schedule/page.tsx`); Figtree + JetBrains Mono via CSS vars
- Location: `bg-[#eef7ff]`; accent text `text-[#0077a3]`; marker hexes `#38bdf8`, `#22c55e`, `#f59e0b` (`LocationMap.tsx`)
- Submission / projects hub: white content `bg-white`, teal shadcn `bg-primary` headers (`submission/page.tsx`, `projects-hub.tsx`); `--primary: oklch(0.5 0.17 215)` in `globals.css`
- Navbar references `bg-background-color` and `text-neutral-color` (`Navbar.tsx`); definitions for those utility tokens: not found in `globals.css` grep of this tip (classes may be unresolved)
- Fonts: body `fredoka.className`; also loads `figtree`, `jetbrainsMono`, `rubik` variables (`layout.tsx`, `fonts.ts`). Schedule explicitly uses `var(--font-figtree)` and `var(--font-jetbrains-mono)`.
- Layout type: custom sidebar (not shadcn Sidebar) + content; `md:flex-row` shell (`layout.tsx`)
- Radius: `rounded-md` / `rounded-lg` widely; `--radius: 0.625rem` in globals
- Shadow: `shadow-sm`, `shadow-md`, `shadow-[0_8px_16px_rgba(0,0,0,0.05)]` (schedule), `shadow-lg` (location)

#### Design tokens
- Mix of: hardcoded hex in components, Tailwind palette classes (violet/pink/etc. for schedule types), and shadcn `--primary` for submission/projects
- No `--j-*` / `--hc-*` found under hacker tree

#### Component library
- shadcn heavily on submission/projects: `Card`, `Button`, `Badge`, `Tabs`, `Input`, etc.
- Custom `SideBar` / `Navbar` (ad hoc)
- Location uses Three.js / R3F patterns (`LocationMap.tsx`)
- Icons: `lucide-react`

#### Data / behavior
- Submission writes via `getSql` / DB (`submission/page.tsx` imports `@/lib/db`)
- Projects hub loads from `lib/projects.ts` (DB introspection / queries)
- Schedule has substantial client UI (local schedule data path via `lib/schedule.ts`; not fully traced here)
- Home page content is placeholder `hiwww`

#### Mobile
- Layout: column on small screens, row from `md:` (`layout.tsx`, `SideBar.tsx`)
- Many `sm:`, `md:`, `lg:`, `xl:` grids in projects/submission/schedule/location


**Hacker token correction (evidence):** On `origin/linus/hacker`, `client/app/globals.css` `@theme inline` defines `--color-neutral-color: #6b7280`, `--color-background-color: #e6e6e6`, `--color-primary-color: #e60000`, `--color-secondary-color: #f8f9fa`, `--color-tertiary-color: #1a1a1b` (in addition to shadcn tokens).

### 2.5 Admin portal (`origin/tenzin/admin` @ `a037c1c`)

**Surveyed:** detached `origin/tenzin/admin`. Chat note: findings for admin appended.

**Ambiguity:** `origin/dev/tenzin` last commit `2026-06-23` is older / divergent (360/360); not fully audited.

#### Files
- `client/app/admin/page.tsx` (redirects to `/admin/stats`)
- `client/app/admin/layout.tsx`
- `client/app/admin/stats/page.tsx`
- `client/app/admin/schedule/page.tsx`
- Components: `client/components/admin/admin-nav.tsx`, `charts.tsx`, `schedule-manager.tsx`
- Data: `client/lib/queries.ts`, `client/lib/schedule.ts` (imported by pages)

#### Design language
- Portal shell: `bg-background text-foreground` on wrapper (`admin/layout.tsx`); `--background: oklch(1 0 0)`; `--foreground: oklch(0.147 0.004 49.25)` in `globals.css`
- Header: `border-b bg-card` (`admin/layout.tsx`)
- Active nav: `bg-primary text-primary-foreground` (`admin-nav.tsx`); `--primary: oklch(0.50 0.17 215)` (same family as development globals; hex not found)
- Muted text: `text-muted-foreground`
- Warning strip: `border-amber-500/40 bg-amber-500/10` + `text-amber-600` (`schedule-manager.tsx`)
- Font: root body `fredoka.className` (`layout.tsx`); Rubik variable on `html` only
- Layout type: top header + horizontal nav + centered `max-w-6xl` content (not sidebar; not hero)
- Radius: `rounded-md` on nav pills; cards use shadcn Card defaults; `--radius: 0.625rem`
- Shadow: not found as custom admin shadow; Card component defaults apply (exact shadow class in admin pages: not found beyond shadcn Card)

#### Design tokens
- Pure shadcn CSS variables + Tailwind semantic classes
- No `--j-*` / `--hc-*` / `text-blue-700` brand class found under admin
- No hardcoded cyan/paper hex palette found under admin components

#### Component library
- shadcn: `Card`, `Badge`, `Table`, `Button`, etc.
- Custom `AdminNav`, `ScheduleManager`, chart wrappers
- Icons: `lucide-react`

#### Data / behavior
- Stats page: server components calling `getSubmissionStats`, `getTrackCounts`, etc. from `lib/queries` (live DB)
- Schedule page: `getProjects` + `deriveSchedule` + client `ScheduleManager` for draft overrides

#### Mobile
- Stats grid: `sm:grid-cols-2 lg:grid-cols-5` and `lg:grid-cols-2` (`stats/page.tsx`)
- No dedicated mobile nav component found; horizontal `AdminNav` wraps via flex


---

## 3. Cross-portal comparison table

Values are from the audited remote tips above. Hex shown only when present in code; otherwise oklch/class name.

| Portal | Branch tip | Background | Text | Accent | Font | Layout type | Token approach |
|--------|------------|------------|------|--------|------|-------------|----------------|
| Portal picker | `origin/development` | `bg-primary` / `oklch(0.50 0.17 215)` | `text-primary-foreground` / `oklch(0.98 0.01 220)` | `text-primary` on `secondary` buttons | Fredoka (body class) | Centered picker | shadcn CSS vars |
| Judging | `origin/aly-judging` | Shell `var(--secondary)`; hero `var(--primary)` | Shell `var(--foreground)`; hero `var(--primary-foreground)` | `--j-action` ? `--primary` | Fredoka (`.judging-shell` + body) | Full-bleed hero + fixed footer | `--j-*` aliases ? shadcn |
| Sponsor | `origin/amy/volunteer-sponsor` | Content `bg-muted/40`; sidebar `--sidebar` | Brand `text-blue-700`; body muted | `text-blue-700` (not `--primary`) | Fredoka body | Sidebar dashboard | shadcn + Tailwind blue |
| Volunteer | same Amy tip | same as sponsor | same | same | same | Sidebar dashboard | same + mock data |
| Hacker | `origin/linus/hacker` | Sidebar `#0099CC`; home/food `#E3F3FF`; schedule `#f7f3ea`; location `#eef7ff`; submission white | white on sidebar; `#3f3850` on schedule; `neutral-950` on forms | mix: `#0099CC`, `#0077a3`, shadcn `--primary`, schedule type colors | Fredoka body; Figtree + JetBrains on schedule | Custom sidebar shell | hardcoded hex + extra `@theme` colors + shadcn |
| Admin | `origin/tenzin/admin` | `bg-background` (white oklch) | `text-foreground` | Active nav `bg-primary` | Fredoka body | Top nav + content | shadcn only |

---

## 4. Divergence map

### Distinct design languages found (evidence-based)

**Language A � Teal shadcn shell (portal picker + judging tip + admin accents)**  
Shared `--primary: oklch(0.50 0.17 215)` family in `globals.css`, Fredoka on body, shadcn buttons/cards. Portal picker paints the whole viewport teal (`layout.tsx` `bg-primary`). Judging on `aly-judging` remaps `--j-*` onto those same tokens and uses a **teal** `.j-hero` (`background: var(--primary)`), not a black paper hero. Admin keeps white content but uses the same primary for active nav.

**Language B � Light sidebar dashboard + `text-blue-700` brand (Amy sponsor/volunteer)**  
shadcn `SidebarProvider` chrome, `bg-muted/40` content, brand titles via Tailwind `text-blue-700` rather than `text-primary`. Structurally a classic app dashboard, visually cooler/bluer titles than Language A primary.

**Language C � Hardcoded cyan hacker chrome (Linus) with internal page dialects**  
Sidebar `#0099CC` and pale blue `#E3F3FF` content appear on home/food; schedule uses cream `#f7f3ea` + Figtree; submission/projects use white + shadcn primary cards; location uses `#eef7ff` + map marker hexes. Extra theme colors include `--color-primary-color: #e60000` (red) in `globals.css` alongside teal shadcn `--primary`.

### Outliers / conflicts (same concept, different values)

| Concept | Value A | Path | Value B | Path |
|---------|---------|------|---------|------|
| Brand / primary blue-teal | `--primary: oklch(0.50 0.17 215)` | `client/app/globals.css` (development / aly / amy / tenzin tips) | `#0099CC` sidebar | `client/app/hacker/SideBar.tsx` |
| Brand title blue | `text-primary` / oklch primary | picker `page.tsx`, judging CTAs | `text-blue-700` | Amy `dashboard-header.tsx` / sidebars |
| Named primary-color | shadcn `--primary` (teal oklch) | globals | `--color-primary-color: #e60000` | Linus `globals.css` `@theme` |
| Page background | teal `bg-primary` body | root `layout.tsx` on picker branches | white `bg-background` admin shell | `admin/layout.tsx` |
| Page background | `bg-muted/40` Amy content | sponsor/volunteer dashboards | `#E3F3FF` / `#f7f3ea` hacker pages | hacker `page.tsx` / `schedule/page.tsx` |
| Hero treatment | Judging full-bleed `.j-hero` teal | `judging.css` | not found (no hero) on Amy/Admin | � |
| Display font extras | Fredoka only (most tips) | `fonts.ts` | Figtree + JetBrains Mono added | Linus `fonts.ts` / schedule page |
| Sidebar system | shadcn Sidebar (Amy) | `components/ui/sidebar` | custom `SideBar.tsx` (Linus) | `app/hacker/SideBar.tsx` |
| Admin nav pattern | top horizontal tabs | `admin-nav.tsx` | side nav | Amy / Linus |

### Shared-primitive candidates (recur across portals)

- **App / portal header:** judging `JudgingHeader`; Amy `DashboardHeader`; admin header in `admin/layout.tsx`; picker title block in `page.tsx`
- **Nav:** Amy sidebars + `nav-items.ts`; Linus `SideBar` link list; admin `AdminNav`; picker portal grid
- **Card:** Amy `Card` shifts; Linus submission/projects cards; admin `StatCard` / shadcn `Card`
- **Button:** shadcn `Button` on picker, Amy, Linus submission, admin; judging `.j-cta` CSS buttons
- **Coming soon / stub:** `PortalStub`; Amy `coming-soon.tsx`

---

## 5. Unification recommendation

**Recommendation (opinion, not code evidence):** Use **Language A as the shared shell tokens** (shadcn `--primary` teal oklch family + Fredoka), but treat **judging's information architecture** (wayfinding hero + dense in-person desk) as the interaction reference for event-day surfaces. Do **not** silently adopt Amy `text-blue-700` or Linus `#0099CC` as the global primary without an explicit token decision, because those conflict with `--primary` already used by picker/judging/admin.

**Why:** Portal picker + judging + admin already share one `globals.css` primary definition and Fredoka body. Amy and Linus introduce additional blues/cyans and layout systems (shadcn sidebar vs custom sidebar) that require mapping, not merging blindly.

**Rough effort to adopt a shared Language A token layer**

| Portal | Effort | Why |
|--------|--------|-----|
| Portal picker | Low | Already Language A |
| Judging (`aly-judging` tip) | Low�medium | Already on shadcn `--j-*` aliases; layout uniqueness stays |
| Admin | Low | Already shadcn; swap any leftover inconsistencies only |
| Sponsor / Volunteer (Amy) | Medium | Replace `text-blue-700` with tokenized accent; keep sidebar pattern but theme sidebar vars to shared primary |
| Hacker (Linus) | High | Many hardcoded hexes, multiple page dialects, extra fonts, custom sidebar, red `--color-primary-color` conflict |

**Note on local uncommitted work:** This audit surveyed **remote tips only**. Local `aly/judging` stash (not applied during survey) may contain paper/black-hero experiments that are **not** on `origin/aly-judging` `d45bec4` (which uses teal `var(--primary)` hero). Stash restored after audit.

---

## Audit process notes

- Started on: `aly/judging`
- Stash: `stash@{0}: On aly/judging: design-audit-temp-stash` (created with `git stash push -u`)
- Restored with `git switch aly/judging` then `git stash pop` (verified below)
- Application code changes by auditor: none intended; only `DESIGN-AUDIT.md` written
