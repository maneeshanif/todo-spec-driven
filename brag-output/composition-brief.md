# Hyperframes Composition Brief: TaskWhisper

## Objective
Create a short launch-style brag video for TaskWhisper, an AI to-do app you talk to in plain English.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 42.6 seconds (revision 2, see brag-plan.md "Revision 2")

## Source Material
- Project root: `C:\code\todo-spec-driven`
- Primary files read: `frontend/app/page.tsx`, `frontend/app/globals.css`, `frontend/app/layout.tsx`, `frontend/app/chat/page.tsx`, `README.md`
- Product name: TaskWhisper®
- Tagline / strongest claim: "Just Whisper It, Done."; "Elevate Your Workflow"
- Key UI or visual moment to recreate: the dark intro curtain with gold corner brackets, the cream hero "Elevate Your Workflow", and the chat flow (add a task, task list, mark complete)
- Copy that must appear verbatim:
  - Productivity, but make it couture.
  - Elevate Your Workflow
  - AI-powered task management through natural conversation
  - Add a task to buy groceries
  - Mark task 1 as complete
  - Just Whisper It, Done.

## Creative Direction
- Tone preset: polished
- Creative direction: luxury fashion campaign for a to-do list
- Interpretation: Slow, confident reveals, generous type, sharp corners (radius 0). The humor is a checkbox played as haute couture with a completely straight face.
- Angle: The site dresses a to-do list as a luxury house. The video plays that straight, then shows the app really doing the mundane thing.
- Hook: black curtain, gold corner brackets draw in, `TASKWHISPER®`, then "Productivity, but make it couture."
- Outro / punchline: "Just Whisper It, Done." over the TaskWhisper® wordmark, then a still beat.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Any real user data (all tasks are fictional)

## Visual Identity
- Background: `#f8f5f0` (cream), `#f0ebe3` (alt cream), `#0a0a0a` (intro curtain)
- Text: `#1a1a1a`, muted `#666666`, border `#e5dfd5`
- Accent: `#a08339` (gold dark), `#c9a962` (gold), `#8b2635` (deep red, small accents only)
- Display font: light high-contrast serif (site uses generic `serif`; Cormorant Garamond is the stand-in)
- Body font: Geist Sans for UI mockups; tracked caps (0.3-0.4em) for labels
- Visual references from the project: gold corner brackets, blurred gold and red orbs, sharp-cornered cards, thin gold rules

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.2s — black curtain, brackets, wordmark, "Productivity, but make it couture."
2. Reveal — 3.8s — curtain lifts to cream hero "Elevate Your Workflow" plus subtitle
3. Whisper it — 5.5s — chat: message types, `add_task` chip, reply "Done. Added: Buy groceries."
4. The list — 4.9s — three task cards arrive one by one with priority badges, then "Mark task 1 as complete" and the gold check
5. Punchline — 3.6s — "Just Whisper It, Done." and wordmark, fade out

## Audio
- Audio role: warm bed with sparse professional accents
- Audio arc: hush, then a soft lift at the curtain, typing ticks and chimes in the middle, one calm tone on the outro, then a fade
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: volume 2.2 (measured; the mixer normalizes to peak, so 0.25 was inaudible), fade in 1s, fade out 1.6s; result -17.6 LUFS
- Music cue guidance: bundled preset `vol-12` (109.96 BPM). Strong cues to lock: 9.29s (chip), 13.11s (first card), 17.47s (outro). Beat grid for cards: 13.11, 13.64, 14.20. Preset path: `brag/0.4.0/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
- Audio-reactive treatment: none (tone is restrained)
- Audio-coupled moments:
  - Scene 3 typing — randomized keypress ticks per character
  - Scene 3 chip — soft drop chime at 9.29s
  - Scene 4 cards — soft card slide per card; a bong on the gold check
  - Scene 5 wordmark — one calm bong on 17.47s
- SFX selection guidance: match motion; polished tone means 2-3 very subtle accents plus typing; low HF-risk files
- Chosen SFX (copied to `composition/assets/sfx/`): `keyboard/keypress-001..008.wav`, `interface/drop_001.ogg`, `interface/bong_001.ogg`, `impact/impactSoft_medium_001.ogg`, `casino/card-slide-1.ogg`
- Audio files: already in `composition/assets/`

## Hyperframes Instructions
Use the current Hyperframes conventions (`npx hyperframes docs`). /brag is its own workflow, so no generic promo workflow.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render (hold floors from the plan).
- Keep the video at 21 seconds.
- Include the planned music and SFX layer.
- Lock 1-3 major moments to strong cues within about 0.15s; snap card entrances to beats within about 0.10s.
- Use local assets. Run `hyperframes check` before render.
