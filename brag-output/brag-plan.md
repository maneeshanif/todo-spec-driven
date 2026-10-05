# Brag Plan: TaskWhisper

## What is this app?
TaskWhisper is an AI to-do app where you talk to your task list in plain English ("Add a task to buy groceries") and an agent (OpenAI Agents SDK + Gemini + MCP tools) does it. Its landing page treats a to-do list like a Max Mara fashion house.

## The angle
The site dresses a to-do list as a luxury fashion campaign: gold corner brackets, tracked-out caps, serif italics, an "Enter Experience" curtain, and the headline "Elevate Your Workflow". The video plays that at full straight-faced seriousness, like a perfume ad for buying groceries, then cuts to the real product doing the mundane thing. Luxury framing, mundane task, and the app really working is the whole joke.

## Hook (first 2-3 seconds)
Black curtain, four gold corner brackets draw in, and `TASKWHISPER®` fades up in tracked caps. Then one serif line: **"Productivity, but make it couture."**

## Key moments (the middle)
- The dark intro curtain slides up (as on the real site) to reveal cream and gold **"Elevate Your Workflow"**.
- A message is typed into the chat: *"Add a task to buy groceries"*. A small `add_task` tool-call chip flashes, then the assistant replies "Done. Added: Buy groceries."
- Task cards arrive one by one with priority badges. Then *"Mark task 1 as complete"* is typed and the gold check lands.

## Outro / punchline
Cream card, tiny gold rule, then the tagline from the site: **"Just Whisper It, Done."** and the `TaskWhisper®` wordmark. A held beat of stillness, like the end of a fashion film.

## User flow worth showing
1. Entry: type or say a plain-English request in the chat (`/chat` page, ChatKit UI).
2. Key action: the agent calls a task tool (`add_task`) and confirms.
3. Result: the tasks appear as a list (`list_tasks`). Then "Mark task 1 as complete" and the task shows done.

Sourced from `frontend/app/chat/page.tsx` and the README's natural-language command table. All task data is fictional stand-ins (Buy groceries, Call mom tonight, Finish report). No user data, emails or tokens appear.

## Tone
- Preset: polished
- Creative direction: luxury fashion campaign for a to-do list
- Interpretation: Slow, confident reveals and generous type. The humor comes from playing a checkbox as high fashion with a completely straight face. Only the outro uses a stillness beat. Everything else is snappy fast-in, then hold.

## Format: landscape — 1920x1080
## Duration: 49.2 seconds (revision 3; earlier cuts kept as brag-v1.mp4 and brag-v2.mp4)

## Visual identity (from the project)
- Background: `#f8f5f0` (warm cream); intro curtain `#0a0a0a`; alt cream `#f0ebe3`
- Accent: `#a08339` (gold dark) and `#c9a962` (gold); deep red `#8b2635` for small accents only
- Text: `#1a1a1a`; muted `#666666`; border `#e5dfd5`
- Display font: generic `serif` (light/extralight weight, italic for subtitles). Use a close high-contrast serif stand-in (e.g. Cormorant Garamond) if needed.
- Body font: Geist Sans (Google Fonts) for UI mockups; tracked-caps labels at 0.3-0.4em letter-spacing
- Strongest visual element: the black intro curtain with gold corner brackets and drifting gold and red blurred orbs, then the cream hero with the gold "Workflow". Radius is 0 everywhere (sharp corners).

## Share copy (draft)
I made my to-do list a luxury fashion house. TaskWhisper: you whisper "add groceries" and an AI agent handles it. Just Whisper It, Done.

## Audio direction
- Role: warm bed with sparse, professional accents
- Music: bundled `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (110 BPM), steady and clean, the polished-tone pick. It plays under the formal visuals as a light contrast.
- Music treatment: start at 0s at low volume (about 0.25) and fade in over 1s. Duck slightly under typing. Fade out over the last 1.5s.
- Music cue guidance: preset read (`vol-12`, 109.96 BPM). Strong cues to lock: 9.29s (`add_task` chip pops), 13.11s (first task card lands) and 17.47s (outro card lands). The curtain lift at about 3.27s rides the beat grid (no strong cue there). Beat grid for sequential card reveals: 13.11, 13.64, 14.20 (accents only; the cards stay on screen and are readable).
- Audio-reactive treatment: none
- SFX posture: sparse, motion-matched, restrained
- Audio-coupled moments: soft key ticks while the chat message types; a small chime for the tool-call chip; a soft tick per task card; a gentle "done" tone on the check
- Restraint rule: no risers, whooshes on every cut, or loud hits. It should sound like a boutique, not a trailer.

## Storyboard

### Scene 1 — Hook: the house of TaskWhisper — 3.2s
Black `#0a0a0a`. Gold corner brackets draw in at the four corners, drifting gold and red blurred orbs behind. `TASKWHISPER®` in tracked gold caps fades up, then the serif italic line "Productivity, but make it couture." holds (5 words, at least 1.5s settled).
Sequential/interaction: none
Audio intent: hushed, expectant
Audio-coupled idea: none
Music: warm bed fades in
Transition mood: soft → Scene 2 (curtain slides up)

### Scene 2 — Reveal: Elevate Your Workflow — 3.8s
The black curtain slides up, as in the real app. Cream `#f8f5f0` beneath. Small tracked caps "JUST WHISPER IT, DONE." above the huge extralight serif "Elevate Your / **Workflow**" (Workflow in gold `#a08339`). Then the sub line, "AI-powered task management through natural conversation." Curtain lift rides the 3.27s beat.
Sequential/interaction: none
Audio intent: a lift, quietly grand
Audio-coupled idea: curtain reveal on the 3.27s beat
Music: bed continues
Transition mood: clean → Scene 3

### Scene 3 — Whisper it: add a task — 5.5s
The app's chat screen, sharp-cornered cream and gold. A message types out character by character: "Add a task to buy groceries" (about 1.8s, key ticks). A small chip `add_task` pops in (tool-call indicator), then the assistant bubble replies: "Done. Added: Buy groceries." (holds for at least 1.2s).
Sequential/interaction: yes — simulated typing, then chip, then reply. The reply holds fully visible for at least 1.2s.
Audio intent: intimate, satisfying
Audio-coupled idea: typed text with subtle key ticks, chime on the chip
Music: bed continues, ducked slightly
Transition mood: clean slide → Scene 4

### Scene 4 — The list: tasks, done — 4.9s
The task list view: three sharp-cornered cards arrive one by one with priority badges: "Buy groceries" (High), "Call mom tonight" (Medium), "Finish report" (Low). Each stays in view. Then a compact input types "Mark task 1 as complete" and card 1 gets a gold check and a strikethrough. First card lands on the 13.11s cue, then 13.64 and 14.20.
Sequential/interaction: yes — cards arrive one by one, then a simulated completion. Each card readable at least 0.8s settled; the full set holds at least 1s before the check lands.
Audio intent: quiet rhythm, then resolution
Audio-coupled idea: soft tick per card, gentle done tone on the check
Music: bed continues
Transition mood: soft → Scene 5

### Scene 5 — Punchline: Just Whisper It, Done. — 3.6s
Cream card with a thin gold rule and corner brackets. "Just Whisper It, Done." in large serif (Done. in gold), then `TASKWHISPER®` wordmark below in tracked caps. Lands on the 17.47s strong cue, then a held stillness beat and fade out.
Sequential/interaction: none
Audio intent: calm landing, music resolves
Audio-coupled idea: single soft tone on the wordmark
Music: fade out over the last 1.5s
Transition mood: soft fade out

**Scene durations:** 3.2 + 3.8 + 5.5 + 4.9 + 3.6 = 21.0s
**Music mood for this video:** warm and upbeat, played against formal luxury visuals
**Audio summary:** A quiet warm bed with hush-and-lift, typing ticks and soft chimes, resolving on one calm tone before the fade.


---

## Revision 2 (user feedback)

Feedback: the music was inaudible, and the video skipped the dashboard, the voice flow, recurring tasks and the tech stack.

**Audio fix:** the music sat at 0.25 volume (about -27 LUFS). The mixer also normalizes to the loudest peak, so louder effects pulled the bed down. It is now measured and balanced: bgm 2.2, effects 0.9-2.0, giving -17.6 LUFS integrated with a -1.5 dBFS peak. The bed is audible and the clicks, chimes and cards sit above it.

**New storyboard (42.6s, longer by request):**
1. Hook 0-3.2s: unchanged
2. Reveal 3.2-7.2s: unchanged
3. Dashboard 7.0-13.1s: real nav, "Welcome back", 4 stat cards counting up (Total 12, Completed 5, In Progress 6, Overdue 1), Your Tasks with Filter/Sort. A cursor travels to "Voice Assistant" and clicks it.
4. Voice 12.55-20.2s: cursor clicks the mic, "Listening...", the transcript "Add a task to buy groceries" appears word by word, "Thinking...", an `add_task` chip, then a spoken-reply card "Done. "Buy groceries" added."
5. Recurring and reminders 20.0-28.6s: complete "Weekly review" (weekly). An event trail shows task.completed, Kafka task-events, the Recurring service, then the next occurrence "Due Mon, Oct 13" appears. A reminder toast follows via the Notification service and WebSocket.
6. Stack 28.2-38.05s: the architecture (Next.js, FastAPI, Dapr, Kafka, then the Recurring 8003, Notification 8002, Audit 8004 and WebSocket 8005 services and the four topics), then a "Who does what" grid of 8 techs.
7. Outro 38.05-42.6s: "Just Whisper It, Done." and the wordmark.

**Locked cues (vol-12):** 12.55 voice scene, 17.47 tool chip, 18.56 reply, 22.93 complete click, 25.65 next occurrence, 26.74 reminder, 32.74 stack grid, 38.20 outro line.

All names and tasks are fictional stand-ins. The voice demo is scripted (a simulated tap and speech), not a live recording.


---

## Revision 3 (user feedback)

- **Intro (0-6.5s):** a dark card that says "January 2026", "Built with Spec-Kit Plus" and "A basic project, made just to try a little Kafka, and Kubernetes with Helm." Everything after it is shifted by 6.55s (exactly 12 beats), so the beat locks still land on the grid.
- **Roman Urdu explainers** in the recurring scene: "Recurring matlab: jo task har hafte khud dobara ban jaye." and "Reminder: waqt hote hi app khud yaad dila deti hai." Each has a small English gloss underneath.
- **Audio:** verified that the music is in the file (correlation 0.98 with the source track). The final mix is normalized to -14 LUFS with a -0.7 dBFS peak. `brag-audio-only.mp3` is the soundtrack alone, for testing playback.
