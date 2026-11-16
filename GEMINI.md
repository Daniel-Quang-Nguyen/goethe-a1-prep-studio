# Goethe A1 Studio — Antigravity Project Instructions

## Project Overview
This workspace contains **Goethe A1 German Studio**, a complete interactive preparation suite for the **Goethe-Zertifikat A1: Start Deutsch 1** examination.

## Core File Manifest
- `index.html`: The main single-page application (interactive quiz, sentence builder, gender drill, flashcards, reference cheatsheet).
- `interactive_a1_trainer.html`: Standalone named copy.
- `goethe_a1_complete_guide.md`: Master 4,200+ line reference manual covering all 250 everyday sayings, complete preposition matrices, 12 core grammar domains, and exam tips.
- `inline_quiz_widget.html`: Standalone compact widget for inline practice.

## Architectural Guidelines
1. **CEFR A1 Calibration**:
   - Keep all German practice content strictly at Goethe A1 level.
   - Avoid A2+ structures (no relative clauses, no passive voice, no Konjunktiv II, no complex adjective declensions).
2. **Interface Chrome**:
   - All navigation labels, instructions, buttons, and system text must remain in English so beginner learners can navigate effortlessly.
   - Only learning targets (prompts, options, German sentences, vocabulary) are in German.
3. **UI / UX Style**:
   - Warm neutral architectural canvas (`#f7f6f2` light / `#141312` dark).
   - Crisp card panels with soft borders (`#e7e4dc` light / `#2e2b27` dark).
   - Typography: `Newsreader` editorial serif for sentences; `Plus Jakarta Sans` for UI copy.
   - Feedback presentation: Modular cards (Status line -> Hero sentence -> Semantic chips -> Rule spotlight -> Exam tip).
4. **Theme Controller**:
   - Located in `<head>` using `safeGetStorage` and `safeSetStorage`.
   - Never access `localStorage` directly without try/catch to maintain `file:///` sandbox compatibility.
