# Series 65 Study Buddy

Dead-simple flashcard app for the NASAA Series 65 (Uniform Investment Adviser Law Exam).
No build, no dependencies, no accounts. Open `index.html` in a browser (or host it on GitHub Pages).

## How to use

1. **Study** tab: read the question, tap the card (or press `space`) to flip, then grade yourself:
   `1` Missed it · `2` Shaky · `3` Knew it. Cards you miss come back sooner and more often.
2. **Weak Areas** tab: your section scores from the score report are pre-filled.
   Sections below the 72.3% passing line get shown more often. Update after each practice exam.
3. **Progress** tab: mastery per section and the cards you keep missing.

Progress is saved in your browser (localStorage). Use the same browser/device to keep it.

## Exam facts baked in

| # | Content area | Questions | Last score |
|---|---|---|---|
| 1 | Economic Factors and Business Information | 20 | 10 (50%) |
| 2 | Investment Vehicle Characteristics | 32 | 24 (75%) |
| 3 | Client Investment Recommendations and Strategies | 39 | 27 (69%) |
| 4 | Laws, Regulations and Guidelines | 39 | 25 (64%) |

130 scored questions (plus 10 unscored pretest). **94 correct (72.3%) passes.** Last attempt: 86. Need 8 more.

## Deck

326 cards in `cards/`, one file per content area, aligned to the NASAA content outline and the
STC Series 65 (44th ed.) chapter topics. Each card is `[topic, question, answer]`.
To add a card, append a line to the matching file.

## Hosting on GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → pick the branch, root folder. Done.
