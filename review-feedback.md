# Body Language Micro-Module — Design Review & 3D Exploration

Reviewed: `index.html`, `variant-1-journey.html` … `variant-6-panorama.html`, all 11 PNGs (dimensions verified), against `request.md`.
Method: every file read in full; image aspect ratios measured (`1408×768` / `1376×768` / `2752×1536` / `2816×1536` → 1.79–1.83 : 1); variants 1–6 checked for content drift against the brief line-by-line; variant 7 (new) smoke-tested in headless Chromium at 390×844 and 1280×800 over both `http://` and `file://`.

---

## Headline findings (read this first)

1. **The image-crop regression is back in three variants.** `variant-1-journey.html` boxes every illustration in `aspect-[4/3]` + `object-cover` (9 occurrences, lines 105, 134, 157, 179, 202, 234, 254, 276, 298). A 1.79:1 image forced into a 1.33:1 box with `object-cover` loses ~25% of its width, i.e. the entire left and right callout columns ("Face the speaker", "Avoid crossed arms", "West: Relaxed but attentive", "East: Formal and controlled"). `variant-2-deck.html` (10× `aspect-[16/10]` + `object-cover`, lines 72–197) and `variant-3-fieldguide.html` (7× `aspect-[16/10]`, lines 165–360) crop ~11% of the width, which clips the left-edge callout boxes on Images 2a, 3, 4, 5, 7, 8, 9 (the boxes start ~4% from the edge). Variants 4, 5, 6 are correct (`aspect-[16/9]` + `object-contain`). **Fix: replace with `aspect-[16/9]` + `object-contain` in all three files.** The image containers already have a background colour so the thin letterbox slivers are invisible.
2. **All six variants are fine on content fidelity.** Every bullet from `request.md` appears with its meaning intact in every variant. One phrasing note: variant 6's cover paragraph (line 174) drops "in body language" from "Awareness of cultural differences in body language demonstrates respect" — harmless, but the full sentence is repeated correctly nowhere else in that variant, so restore it.
3. **Image weight is the single biggest mobile-first problem and no variant addresses it.** `Image_1_Posture_and_Confidence.png` is 5.9 MB, `Image_1a` 5.4 MB, `Image_2a` 4.7 MB; the rest are 1.3–1.6 MB each. Total payload ≈ 26 MB per variant on a "micro" module. On a 4G phone that is 15–30 s before the hero appears. Re-export as WebP/AVIF at ≤1600 px wide (expect ~80–150 KB each) and add `width`/`height` attributes to stop layout shift. This is a one-time asset fix that benefits every variant equally.
4. **Tailwind Play CDN in production.** Every page ships the full JIT compiler (~110 KB compressed, plus a runtime compile step that causes a visible unstyled flash on slow phones) and logs a console warning. Fine for design review; not fine for release. Before shipping the chosen variant, compile once with the Tailwind CLI and inline the resulting ~10 KB CSS.

---

## Variant 1 — The Guided Journey (`variant-1-journey.html`)

**Visual polish:** The strongest "calm editorial" tone of the set. Alternating layout, chapter dividers with gold eyebrow, and the sticky progress bar read as one coherent system. The `strong { color: #0D3C61 }` treatment gives bullets a nice scannable rhythm without shouting.

**Bugs / must-fix**
- **Cropped illustrations (all nine).** See headline finding 1. Because this variant's images are the largest on screen, the cropping is the most visible here — the Posture and Formal-vs-Informal images lose their callouts entirely.
- **Heading hierarchy is inverted.** Every section uses `<h2>` for the small eyebrow ("Step 2 · Physical Posture", line 139) and `<h3>` for the actual title ("How You Carry Your Body", line 140). Screen-reader users navigating by heading hear the eyebrow as the section. Swap: eyebrow becomes `<p>`, title becomes `<h2>`. Same issue in the Key Takeaways block (lines 320–321).
- **Step pill is not announced.** `#step-pill` (line 76) changes text on scroll but has no `aria-live`. Add `aria-live="polite"` (or `role="status"`); otherwise it is decorative noise for AT users and could just be `aria-hidden`.

**Mobile-first check:** Genuinely mobile-first — base classes are single-column, `md:` adds the two-column layout. The floating step pill at `bottom-5` overlaps the last few lines of content on short phones because the page has no bottom padding to reserve space for it; add `pb-20` to `<main>` or hide the pill once the footer is in view.

**Interaction:** `reveal` animations respect `prefers-reduced-motion` (line 58) — good. The `animate-bounce` "Scroll to begin" arrow (line 93) does not; wrap it in the same media query. `IntersectionObserver` step detection with `rootMargin: -45%` works but flickers on sections shorter than 10% of the viewport (the chapter dividers are not steps, so fine today).

**Opportunities:** The "Key Takeaways" cards are the one place this variant adds real pedagogical value over the brief. Consider promoting the four takeaways into the step pill as a "Recap" affordance at the end.

---

## Variant 2 — The Interactive Deck (`variant-2-deck.html`)

**Visual polish:** Premium and confident; the navy/gold/teal chapter shift is the best use of colour-as-wayfinding in the set. The `md:` phone-frame chrome on desktop is a nice touch for stakeholder demos.

**Bugs / must-fix**
- **Cropped illustrations (10×, lines 72–197).** `aspect-[16/10]` + `object-cover` clips ~5.5% from each side; the left callout boxes are cut. Switch to `aspect-[16/9]` + `object-contain` (the `bg-navy-card` backdrop already exists, so the letterbox is invisible).
- **Inconsistent counter.** Header says "Card 1 / 9" for the Introduction card (line 273), so the 9 lesson cards are numbered 1–9 with Introduction as card 1 — but the cover copy says "9 lessons" (line 67) and the takeaways card is unnumbered. Either count 9 including Intro (then the cover should say "9 cards") or exclude it and show "Card 1 / 8" for Posture. Right now the number never matches what the learner perceives as a lesson.
- **Keyboard navigation only works when the track is focused.** `track.addEventListener('keydown', …)` (line 299) requires `tabindex="0"` focus on `#track`; on load nothing is focused, so pressing → does nothing until the user clicks the card area. Move the listener to `document` (as variant 6 does) and add Home/End. There is also no on-screen hint that keyboard works.
- **Swipe hint never disappears.** "Swipe to begin" pulses forever on the cover, but there is no equivalent hint on desktop where swiping is unnatural; the prev/next buttons carry it, fine, but say so ("Swipe or tap →").

**Accessibility:** Dots use `role="tab"` inside `role="tablist"` (line 52) but the cards are not `role="tabpanel"` and are not linked via `aria-controls`; this is a half-implemented tabs pattern that will confuse AT. Simpler and honest: make the dots plain buttons with `aria-label` + `aria-current="true"` on the active one. Contrast: `text-ivory/40` sub-captions on `#0A1420` (line 87) is ~3.2:1 — below AA for 12 px text; raise to `/60`.

**Mobile-first check:** Yes. `overflow-y-auto` on each card (line 71) correctly handles short phones where a 16:10 image plus four bullets overflows. The `min-h-[100dvh]` outer wrapper handles iOS toolbars correctly.

**Interaction quality:** `scroll-snap-stop: always` (line 32) is exactly right for a lesson deck — no accidental double-skips. IntersectionObserver at 0.6 threshold is solid.

---

## Variant 3 — The Field Guide (`variant-3-fieldguide.html`)

**Visual polish:** The most distinctive personality. Dashed "paper-card" borders, rotated stamps, and Lora headings sell the travel-journal concept without kitsch. The `underline-swash` highlight on key phrases is elegant.

**Bugs / must-fix**
- **Cropped illustrations (7×, lines 165–360)** — same `aspect-[16/10]` + `object-cover` issue as variant 2. Note the two full-width images (lines 283, 376) are correctly `16/9` but still `object-cover`; switch to `object-contain` for consistency.
- **Tab switching discards scroll position and open-accordion state, and traps content.** Switching to Chapter 2 hides Chapter 1 entirely (`display:none`). A learner who wants to compare "Personal Distance" (Ch.2) with "Physical Distance" (Ch.1) must tab back and forth and re-expand cards each time. Either keep both panels in the DOM and use anchor tabs (jump instead of hide), or persist open state.
- **No keyboard support on the tablist.** `role="tablist"` promises arrow-key navigation between tabs; none is implemented (lines 402–426). Add ←/→ handlers or drop the ARIA tab roles and make them plain buttons.
- **Accordion header uses `<h3>` wrapping a button — good — but chapter headings are `<h2>` and the summary is `<h3>` (line 382)** so the summary reads as a child of "Eye Contact". Make the summary an `<h2>`.
- **Tailwind class `font-700` (line 97) does not exist**; the `<h1>` falls back to Lora's default weight. Use `font-bold`.

**Mobile-first check:** Yes; grid is single-column by default, `md:grid-cols-2`. The sticky tab bar with `-mx-5 px-5` bleed trick (line 126) is correct.

**Interaction:** The `grid-template-rows: 0fr → 1fr` accordion animation (lines 49–60) is the modern, layout-safe way to do this. Well done. Accordion buttons need `prefers-reduced-motion` handling (currently animate regardless).

---

## Variant 4 — The Micro-Workbook (`variant-4-workbook.html`)

**Visual polish:** Friendly and approachable, Nunito headings pair well with the pastel palette, and the progress ring is a strong motivator. This is the only variant with a real "learning loop" (mark → progress → celebration), which matters for a training module.

**Bugs / must-fix**
- **Progress maths is wrong on screen.** The ring label reads "0/9" (line 143) and the copy says "0 of 9 topics complete" (line 147), but `TOPICS` has 7 entries (line 407) and there are 7 "Got it" buttons — the Cultural Awareness card is deliberately non-checkable and the Intro/Takeaways are not cards. The JS writes `doneCount + '/' + TOPICS.length` into the ring so the ring corrects itself to "x/7" on first tick, but the sentence keeps its hard-coded "of 9". Either make it 7 everywhere or (better) add a "Got it" to the Cultural Awareness card and count 8, and update the copy from JS.
- **Part 2 counter starts at "0/4 done" (line 278)** but Part 2 has 3 checkable cards; JS overwrites it to "0/3", so there is a visible flash of wrong numbers before hydration.
- **Undefined Tailwind colour.** `bg-warm-grey` is used on every image button (e.g. line 119) but `warm-grey` is not in this file's `tailwind.config` (lines 15–23); the letterbox background is therefore transparent. Add `'warm-grey': '#E8E5E1'`.
- **Confetti spawns inside `[data-celebration]` which has no `position: relative`**... actually it does via `relative overflow-hidden` (line 160) — fine, but `overflow-hidden` clips the confetti to a 60 px strip, so the effect is barely visible. Either remove `overflow-hidden` or animate within the banner's height.
- **Emoji in heading** ("🎉 Module complete", line 161) renders inconsistently across Android/Windows and is read aloud as "party popper". Use an inline SVG.

**Accessibility:** Good: `aria-pressed` on toggle buttons, `:focus-visible` global rule, real `<button>`s. The "Enlarge" badge text inside the image button duplicates the `aria-label="View larger image"` — pick one. Lightbox: `#lightbox` is always in the DOM with `visibility:hidden`; add `aria-hidden` toggling or `inert` so its close button is not tab-reachable while closed (it isn't visible but is still focusable in some browsers).

**Mobile-first check:** Yes. Cards stack, buttons are full-width `min-h-[44px]`. The sticky progress bar at `top-0` is 56 px tall — acceptable.

**Persistence:** localStorage wrapped in try/catch — good. Key is versioned (`-v1`) — good.

---

## Variant 5 — The Executive Briefing (`variant-5-briefing.html`)

**Visual polish:** The most typographically sophisticated variant. Fraunces with optical sizing, drop cap, watermark numerals, Fig. captions — it reads like a real magazine feature. Images are correctly `16/9` + `object-contain` with a lightbox. This is the reference implementation for the image treatment.

**Bugs / must-fix**
- **Heading hierarchy skips.** Cover `<h1>` → Part I `<h2>` → section titles `<h3>` is fine, but inside each section the eyebrow ("How you carry your body") is a `<p>` and the title is `<h3>` — good — yet the summary section jumps to `<h2>` "Summary" after a run of `<h3>`s, which is correct. However the Part II break's `<h2>` "Cultural Awareness" contains the cultural intro paragraph (lines 328–345) but is *not* listed as a numbered section — the TOC shows it as "—". Fine visually, but the TOC's `01…07` numbering plus two "—" rows means numbers do not match the 9-picture brief, so reviewers comparing to `request.md` will be confused. Consider "Part II" and "Summary" as un-numbered rows styled differently rather than the same dash glyph.
- **"Back to top" link targets `#top` (line 494) but no element has `id="top"`.** Works in Chrome by accident (scrolls to document top on unknown fragment) but not in all browsers. Add `id="top"` to `<body>` or the header.
- **TOC panel `max-height: 32rem` (line 68) is shorter than its content on phones** (9 rows × ~44 px ≈ 400 px plus padding ≈ 32 rem — borderline). Use `max-height: 80vh; overflow-y: auto` to be safe.
- **The pull-quote duplicates a bullet on every section** (e.g. line 187 vs line 205). Editorially intentional, but it is the same sentence twice within 300 px on a phone. Either shorten the bullet list to the remaining items or pick a quote that is *not* in the list (e.g. from the cultural intro paragraph).

**Accessibility:** Best in set: `aria-expanded`/`aria-controls` on TOC toggle, `focus-visible` rings on every image button, lightbox returns focus. `numeral-mark` watermarks are `aria-hidden`? No — they are plain `<span>`s with text "01" etc. (line 179) and will be read aloud. Add `aria-hidden="true"`.

**Mobile-first check:** Yes; grid collapses, TOC is single-column, masthead is a compact 56 px bar.

---

## Variant 6 — The Panorama (`variant-6-panorama.html`)

**Visual polish:** Bold and confident; the 38 vw roman numerals on the dividers are the best single visual moment in the whole project. Space Grotesk carries the oversized type well.

**Bugs / must-fix**
- **Body copy is too small for the ambition.** Bullets are `text-sm` (14 px) on mobile (line 206) inside a panel that gives the text only ~55 dvh minus padding. On a 375 × 667 phone the Facial Expression panel (4 bullets) needs to scroll inside `overflow-y-auto` — which conflicts with the horizontal snap scroller and feels broken (vertical swipe scrolls the text, horizontal swipe pages, and diagonal swipes do neither). Reduce the image to `h-[30dvh]` on mobile and go `text-base` — the text is the lesson; the image is the illustration.
- **`mix-blend-difference` on the HUD (lines 125, 128)** renders the counter as near-invisible grey on the mid-tone `warm-beige` panels and as inverted colours over images. Replace with a solid pill (`bg-black/30 text-white`) or switch text colour per panel from JS.
- **The prev/next arrows sit at `bottom-20` on mobile** (line 135) — directly over the bottom of the image on panels 2–10, obscuring the "Enlarge" badge on the image's right corner. Move them into the dot-nav bar or above the image.
- **Cover paragraph drops "in body language"** (line 174) — restore for fidelity.
- **`prefers-reduced-motion` is not respected** for the smooth `scrollIntoView` or the progress-bar transition. Add a check and use `behavior: 'auto'`.
- **Fallback for `dvh`** is missing; older Android WebView (pre-2023) does not support `100dvh` and the panel height becomes `auto`, breaking the whole layout. Add `height: 100vh` before the `100dvh` line (lines 43, 57).

**Accessibility:** Good: `aria-live` region announcing panel titles, labelled dots, `Home`/`End` support, escape-to-close lightbox. The keyboard hint is `hidden md:flex` (line 128) — correct for phones but a keyboard user on a tablet with a keyboard never sees it; show it whenever a `keydown` is detected instead of by breakpoint.

**Mobile-first check:** Mostly. The layout *is* built mobile-first, but the combination of horizontal snap + nested vertical scroll is the weakest mobile interaction in the set. Consider disabling the nested scroll and instead letting the content flow under the image with the whole panel `overflow-y: auto` and the image `sticky`.

---

## `index.html` (showcase gallery)

- Card grid, palette dots, and scaled iframe previews are clear and useful. Seven cards now (see below).
- **Seven live iframes load ~26 MB of PNGs each on page open** (≈180 MB total) — the gallery is unusable on a phone or hotel Wi-Fi. `loading="lazy"` on the iframes helps only below the fold. Recommend static PNG thumbnails generated once (e.g. with the browse skill's `screenshot`), with the iframe swapped in on hover/focus.
- The `.card:hover .preview-frame img` rule (line 57) targets an `<img>` that does not exist inside `.preview-frame` — dead CSS.
- Variant 2's card description says "card X/9 counter" — matches the variant's inconsistency noted above; update once variant 2 is fixed.
- Note: a `<meta name="robots" content="noindex">` and `<script src="assets/gate.js">` were added by another session while this review was in progress; not reviewed here.

---

## Systemic issues / opportunities

1. **Image cropping** — variants 1, 2, 3 regressed (see headline). Add a one-line rule to the project notes: *every illustration container is `aspect-[16/9]` + `object-contain` with a background colour; never `object-cover`*.
2. **Image weight** — 26 MB per variant. Re-export to WebP ≤1600 px. Add `width`/`height` attributes everywhere.
3. **Tailwind Play CDN** — compile before release.
4. **Heading hierarchy** — variants 1 and 3 use headings for eyebrows/labels. Rule: eyebrows are `<p>`, one `<h1>` per page, section titles are `<h2>`.
5. **Reduced motion** — only variants 1 and 7 honour `prefers-reduced-motion`; add it to 2, 3, 4, 6.
6. **Lightbox pattern** — variants 4, 5, 6 duplicate ~60 lines of identical lightbox JS/CSS. When a winner is chosen, keep one copy; if two variants ship (e.g. Workbook for learners + Briefing for managers), factor into a shared `assets/lightbox.js`.
7. **Content fidelity is excellent across the board** — every bullet from `request.md` is present with its meaning intact in all seven variants. `Image_2_Gestures_and_Meaning.png` (the mislabelled duplicate) is correctly unused everywhere; consider deleting it from `images/` (not done here — the folder was off-limits).
8. **Which variant to ship?** For a *training* module the Workbook (4) is the only one with a completion loop, and the Briefing (5) has the best reading experience and image handling. A pragmatic combination — Briefing typography and image treatment plus Workbook's "Got it" progress — would beat any single variant.

---

## 3D Exploration (three.js)

### Should 3D be bolted onto an existing variant?

I considered the three obvious candidates:

- **A 3D card stack for variant 2 (Deck).** The deck already communicates "a stack of cards" through scroll-snap; adding perspective tilt on the neighbours would be pure decoration. It also fights the `overflow-y-auto` inside each card (a perspective-transformed scroll container has notoriously bad touch behaviour on iOS). Net: cost without learning benefit.
- **Parallax depth for variant 6 (Panorama).** Parallax on a horizontal pager is the classic motion-sickness trigger and directly conflicts with the variant's existing nested-scroll problem. It would make the weakest mobile interaction weaker.
- **A 3D globe for the cultural sections.** Superficially on-topic, but the brief's cultural content is deliberately non-geographic ("general tendencies, not universal rules … preferences vary widely by country"). A spinning globe with East/West pins would *undercut* the brief's central caution by implying a map of who does what. It is the wrong metaphor for this content.

Conclusion: **3D does not improve any of the six as a bolt-on**. In each case it adds distraction, motion risk, and load time to an interaction that is already clean.

### Does 3D fundamentally clash with training-content UX?

Not fundamentally — but only if it obeys three constraints:

1. The instructional text must remain real DOM (selectable, zoomable, screen-reader-navigable, reflowable). Text rendered as 3D geometry or texture is illegible below ~400 px and invisible to AT.
2. The 3D must do the job of *one* existing UI element (here: the image carousel), not sit behind everything as a "WebGL background".
3. Motion must be user-initiated (swipe/arrow), short, and disabled under `prefers-reduced-motion`.

### Recommendation: build a new 3D-first variant — done

**`variant-7-exhibit.html` — "The Exhibit."** The metaphor is a gallery rotunda: the nine illustrations hang as framed exhibit panels on a ring around the viewer; each swipe or arrow-key rotates the ring one station. The 3D scene *is* the image carousel — neighbouring panels are visible at the edges with genuine depth, so the learner always knows where they are and what comes next. The lesson text sits in a plain reading pane (below the scene on phones, beside it on desktop) as ordinary HTML.

What was built, and the mobile decisions behind it:

- **Layout:** `grid-template-rows: 46dvh 1fr` on phones (scene above, scrollable text below), `56% / 44%` columns at `md:`. The reading pane is the same DOM in both modes; nothing is duplicated.
- **Renderer budget:** `setPixelRatio(Math.min(devicePixelRatio, 2))`; MSAA only when DPR < 2; `powerPreference: 'low-power'`; `MeshBasicMaterial` throughout (no lights, no shadows — the "shadow" under each frame is a 256 px radial-gradient sprite). The render loop is **on-demand**: it stops entirely when nothing is animating, when the tab is hidden, and always under reduced-motion.
- **Textures:** the source PNGs are up to 2816 px / 5.9 MB — far too big for a phone GPU. Each image is drawn through an offscreen canvas and downsampled to ≤1280 px before upload, with mipmaps and 4× anisotropy. Loading is progressive: current station ± 1 first, the rest via `requestIdleCallback`. Panels are sized from the **actual** texture aspect, so nothing is ever cropped — the bug that hit variants 1–3 cannot occur here by construction.
- **Camera:** vertical FOV is computed from the panel width and viewport aspect on every resize so the active panel fills the stage in portrait *and* landscape.
- **Touch:** pointer-drag rotates the ring live (1 station per ~60% of stage width) with velocity-based snap; a vertical-vs-horizontal lock hands vertical gestures back to the page. Trackpad horizontal wheel pages too. A "Swipe the gallery to move" hint fades after the first move.
- **Keyboard:** `← → PageUp PageDown Home End` on `document`, matching variant 6, plus a visible `kbd` legend at `md:` and above.
- **Accessibility:** heading hierarchy is one `<h1>` (welcome) then `<h2>` per station; inactive stations are `display:none` (not just faded) so AT sees exactly one; an `aria-live` region announces "Station 3 of 10: Physical Distance"; the canvas is `aria-hidden`; dots are real buttons with labels; `:focus-visible` rings everywhere.
- **Graceful fallback (two layers):**
  1. If `canvas.getContext('webgl')` fails or three.js did not load, the page boots straight into `mode-flat`: all ten stations stacked, images shown as `<img>`, a header explaining why.
  2. **Discovered during testing:** when the file is opened via `file://` (double-click), Chrome treats the local PNGs as cross-origin and refuses them as WebGL textures ("tainted canvas"). The scene would render empty blue frames. The variant now detects this with a `getImageData` probe on first texture, disposes the renderer, and degrades to the same flat layout with an explanatory note. Verified in headless Chromium: `http://` → `mode-3d` with textured panels; `file://` → `mode-flat`, fully readable. **The team should open this variant through a local server** (`python -m http.server` in the folder) to see the 3D.
- **Content:** every bullet from `request.md`, same verified image mapping, footer credit "SIL Micro-Learning Module · Body Language" (controls bar and closing station). `Image_2_Gestures_and_Meaning.png` unused.
- **Dependency:** `three@0.158.0` UMD from jsDelivr, pinned. Note three.js logs a deprecation warning for the UMD build; if the team keeps this variant long-term, switch to the ES-module build via an import map (r160+ has no UMD file).
- **`index.html`:** card 7 added with the same markup pattern (palette dots, live `data-frame` iframe preview, "3D · three.js" badge, "Open full page"). Header copy updated to "Seven … (six 2D, one three.js 3D exploration)".

### Honest assessment of the result

Where it wins: orientation (you can *see* the previous and next exhibit), zero cropping, and a sense of place that the flat variants lack. Text legibility is identical to variant 6 because it is the same kind of DOM pane.

Where it costs: +~600 KB (three.js) and a WebGL context on a battery-powered device; a `file://` limitation that none of the 2D variants have; and a genuine question of whether "walking a gallery" is a better metaphor for *body language* than the Workbook's "practise and tick off". My view: The Exhibit is the best *demo* in the set and a legitimate design direction for premium learner-facing modules, but for an internal training module I would still ship Workbook + Briefing (see systemic point 8) and keep The Exhibit as the showcase piece.
