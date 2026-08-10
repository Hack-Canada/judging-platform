# Art prompt spec sheet

Everything here is **blocked on you generating the art** — nothing in the app
authors these. The code already renders CSS fallbacks, so the site is not broken
while these are outstanding; each asset just upgrades a placeholder.

---

## Read this first: why the old art failed

Three separate failures, three different lessons.

### 1. `sponsor-bubble.png` — a failed generation

1920×1341, ~100 KB, and effectively **blank**: near-white with one faint arc. It
backed every bubble on `/sponsors` and `/judges`, so sponsor seats rendered as
dull grey marbles and judge seats were invisible. It was also the source image
for the full-page bubble transition, which meant that transition was 18 copies
of a white rectangle at up to 105% of the viewport — a white haze.

**Resolved in code. Do not regenerate this file.** A soap bubble is a rim, a
refractive tint and two speculars, which is what layered radial-gradients are
good at. It's now `components/ocean/glass-bubble.tsx` — zero bytes, crisp at any
size, and each part animates independently.

### 2. The judge creatures — no fill

All six `judge-*.png` are near-invisible `#e5e5e5` outlines with no colour. On
dark navy they read as ghost scribbles. **These do need regenerating** (spec
below).

### 3. The dive frames — right art, wrong job

The frames themselves are good. The problem is geometry: they're 1536×1024
(aspect 1.50) and a phone hero box is ~390×780 (aspect 0.50). `object-fit:
cover` therefore discards about **two thirds of the width**, which is why the
beaver, reef and seabed never reached a mobile screen. No prompt fixes this —
regenerating at 9:16 would just break desktop instead.

**This is the rule everything below follows:**

> **Crop the texture, position the subject.**

A fixed-aspect painting cannot be a responsive full-bleed background. So:

| Layer | Medium | Can it crop? |
|---|---|---|
| Water fill | CSS gradient | Never — it's a gradient |
| God-rays | CSS | Never |
| Depth texture plate | the existing `dive-*.webp` | Harmless — it's texture now |
| Reef / seabed silhouette | anchored SVG (or new PNG) | Never — anchored, not stretched |
| Props + creatures | transparent sprites, anchored | Never — positioned |

**Therefore: every asset below must be a transparent PNG of one isolated
subject. No baked-in background, no baked-in scene, no ground line, no sky.**
Baked scenes are exactly what caused the crop problem.

---

## Style anchor

**`client/public/ocean/swim-shark.png`.** It is the one asset whose style already
works: flat, saturated colour with confident dark outlines, simple shapes, no
gradient mush, and a genuinely transparent background. Match it.

If your tool accepts a reference image, pass `swim-shark.png` directly. If not,
this describes it:

> Flat vector-style children's-book illustration. Bold uniform dark-navy
> outlines. Saturated flat fills with one soft shadow tone per shape — no
> photorealistic gradients, no airbrush, no 3D render, no gloss. Friendly,
> rounded, slightly chunky proportions. Reads clearly at 120px.

**Palette** (from `lib/sponsors.ts`, keep the whole set coherent):

| Token | Hex | Used for |
|---|---|---|
| Surf | `#b98a5f` | shallowest tier |
| Lagoon | `#4da3ff` | tier 2 |
| Deep | `#00d0c0` | tier 3 |
| Abyss | `#f2b24c` | deepest tier |
| Foam | `#8ee7ff` | highlights |
| Ice | `#d3f9ff` | light text/accents |
| Abyss navy | `#061426` | page background — **outlines must survive on this** |

---

## Universal requirements

Apply to **every** asset below. Most are stated because the previous batch
violated them.

- **Transparent background.** True alpha, not white-matted. Export PNG-24.
- **One isolated subject.** No scene, no horizon, no floor, no bubbles around it.
- **Fill the frame.** Subject occupies ~90% of the canvas; ≤5% padding. The
  previous creatures floated tiny in a big empty canvas, which made them look
  even fainter.
- **Actual fill colour, not just an outline.** This is what killed the last set.
- **Must survive on `#061426`.** Check it against dark navy before shipping. A
  light-grey line on dark navy is invisible.
- **No text, no logos, no watermarks, no drop shadow.** Shadows are applied in
  CSS; a baked one will double up.
- **Square canvas** unless a specific size is given below.

Negative prompt to reuse:

```
photorealistic, 3d render, octane, gradient mesh, airbrushed, glossy,
white background, solid background, background scene, horizon, seafloor,
drop shadow, watermark, text, signature, border, frame
```

---

## Assets

### A. Judge creatures — 6 files (optional)

**Replaces:** the six near-invisible outlines currently at these paths.
**Unblocks:** flip `CREATURE_ART_READY` to `true` in `client/lib/judges.ts` —
that single boolean is the only code change needed.

**Priority dropped.** The panel now lists only confirmed, announced judges, and
a confirmed judge normally comes with a real headshot (`photo`). These creatures
are just the fallback for someone who's been announced but hasn't sent one yet;
without them that judge shows their initials, which already looks deliberate.
Generate these if you want the ocean character, not because anything is broken
without them.

**Size:** 512×512 PNG-24, transparent.
**Framing:** head-and-shoulders "portrait", facing the viewer, centred. These sit
inside a circular glass bubble at ~56% of its diameter, so **keep the silhouette
compact and roughly circular** — long thin subjects will read as slivers.

| File | Subject | Depth | Suggested body colour |
|---|---|---|---|
| `judge-jellyfish.png` | Jellyfish | Surf | translucent pink-violet, `#8ee7ff` rim |
| `judge-seal.png` | Harbour seal | Surf | warm grey-brown, cream muzzle |
| `judge-starfish.png` | Starfish | Lagoon | coral orange, paler underside |
| `judge-shark-side.png` | Shark, 3/4 view | Deep | steel blue-grey, white belly |
| `judge-turtle.png` | Sea turtle | Deep | olive-green shell, gold plate pattern |
| `judge-octopus.png` | Octopus | Abyss | deep magenta-purple, `#f2b24c` suckers |

**Prompt template** — substitute the row:

```
A friendly {SUBJECT} character portrait, head and shoulders, facing forward,
flat vector children's-book illustration style, bold dark navy outlines,
saturated flat {COLOUR} fills with one soft shadow tone, large expressive
friendly eyes, rounded chunky proportions, centred and filling the frame,
fully transparent background, no scene, no shadow, no text
```

They should read as a **set** — same outline weight, same eye style, same level
of detail. Generating all six in one batch/session helps.

---

### B. Reef silhouette strip — don't make this

An earlier version of this file specced a tileable seabed strip to replace an
inline SVG in `dive-scene.tsx`. **Both are gone.**

The SVG seabed was removed because the `dive-*.webp` frames already paint their
own reef and floor. A second seabed anchored to the bottom of the viewport
landed at a different height than the painted one and rendered as a hard black
band slicing across the middle of the scene. Any replacement asset — raster or
vector — would reintroduce exactly that, because the conflict is two seabeds at
two heights, not the medium of the second one.

If the floor ever needs more presence, adjust the frame art itself.

---

### C. Foreground props — 3–5 files (optional)

Small anchored sprites for parallax depth. Each is positioned individually, so
none can crop.

**Size:** 768×768 PNG-24, transparent. Anchored bottom-left / bottom-right.

| File | Subject |
|---|---|
| `prop-kelp-tall.png` | Tall kelp frond, gently curved, olive-green |
| `prop-coral-fan.png` | Sea fan coral, coral-pink to magenta |
| `prop-coral-brain.png` | Rounded brain coral, sandy `#b98a5f` |
| `prop-anemone.png` | Sea anemone, teal `#00d0c0` tentacles |
| `prop-rock.png` | Rounded boulder cluster, dark blue-grey |

```
A single {SUBJECT}, flat vector children's-book illustration, bold dark navy
outlines, saturated flat fills with one soft shadow tone, isolated object
filling the frame, growing from the bottom edge, fully transparent background,
no seafloor, no scene, no other objects, no text
```

---

## Before you ship an asset

1. Open it over a `#061426` swatch. If it disappears, it failed the same way the
   last batch did.
2. Confirm the background is genuinely transparent — not white, not a checker
   pattern baked into the pixels.
3. Scale it to 120px. If it turns to mush, the detail is too fine.
4. Drop it in `client/public/ocean/` at the exact filename above.
5. For the creatures only: set `CREATURE_ART_READY = true` in
   `client/lib/judges.ts`.

---

## Not needed — don't regenerate

- **`sponsor-bubble.png`** — superseded by CSS (`glass-bubble.tsx`).
- **`dive/*-33.webp`, `dive/*-67.webp`** — 10 tween frames, referenced nowhere.
  `STAGES` in `dive-scene.tsx` lists only the 6 keyframes. Safe to delete
  (~900 KB).
- **`dive-0..5-*.webp`** — the 6 keyframes are fine. They're texture plates now,
  so their crop no longer matters.
