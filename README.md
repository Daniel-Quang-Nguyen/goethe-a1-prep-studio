# 🇩🇪 Goethe A1 German Studio — Start Deutsch 1 Exam Suite

A complete, self-contained interactive preparation studio and master reference library for the **Goethe-Zertifikat A1: Start Deutsch 1** examination.

---

## 📁 Project Structure

```text
goethe_a1_prep_studio/
├── index.html                   # Primary interactive application (Open directly in browser)
├── goethe_a1_complete_guide.md  # Master 4,200+ line reference manual & study guide
├── inline_quiz_widget.html      # Lightweight inline practice widget
└── README.md                    # Project documentation and guide
```

---

## 🚀 How to Run

1. **Direct Browser Launch (Zero Installation Required)**:
   - Double-click **`index.html`** in your file manager.
   - It will open immediately in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave).
   - Everything runs 100% locally and offline (no local server or database required).

2. **Run with a Local Dev Server (Optional)**:
   ```bash
   npx serve .
   # or with Python:
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## ✨ Features & Modules Included

### 1. 🎯 Interactive Practice Studio (`index.html`)
- **210 Calibrated Goethe A1 Questions**:
  - Covers all essential A1 prepositions (Accusative, Dative, Two-Way *Wechselpräpositionen*, Temporal, Local).
  - 12 core grammar domains: Nominative/Accusative/Dative cases, verb conjugations, modal verbs, separable verbs, negation (*nicht* vs *kein*), possessive articles, questions (*Ja/Nein* & *W-Fragen*), imperatives.
- **Concise Architectural Feedback Cards**:
  - Immediate `✓ Correct` / `✗ Incorrect` status indicator.
  - Large serif target sentence with the correct German token highlighted.
  - English translation of the full context.
  - Semantic chip breakdown (`[German token | English meaning]`).
  - Targeted Goethe A1 Exam Tips and grammar rules.
- **5 Guided Study Paths**:
  - 🌟 **All-Round Practice** (Full 210 bank)
  - 🗣️ **Speaking & Listening Focus** (70 high-yield conversational prompts)
  - 📝 **Reading & Writing Focus** (60 formal & notice comprehension prompts)
  - 📍 **Prepositions Deep Dive** (80 case & direction drills)
  - ⚡ **Verbs & Sentence Order** (80 conjugation & bracket structure drills)
- **🧩 Sentence Builder (Verb-Second V2 Rule)**:
  - 20 authentic Goethe A1 sentence puzzles. Click tiles in sequence to build correct German sentences with immediate position feedback.
- **🏷️ Noun Gender Drill (Der / Die / Das)**:
  - 52 essential Goethe A1 nouns with instant classification and suffix recognition clues (*-ung*, *-chen*, *-er*, *-heit*).
- **🃏 250 Everyday Sayings Flashcards**:
  - Complete 250-phrase A1 deck with flip animations, example sentences, and search filters.
- **📖 Built-in Reference Library (Cheatsheet)**:
  - Accessible directly inside the app with one click on the **Study Guide** button.
  - Full preposition matrix, verb conjugation tables, modal verb bracket syntax, and case declensions.
- **🌓 Architectural Theme Switcher**:
  - Instant toggle between **Light Theme** (warm studio linen `#f7f6f2` with crisp white cards) and **Dark Theme** (deep matte obsidian `#141312` with bronze accents `#c48b59`).
  - Fully persistent and crash-safe across local `file:///` and browser environments.

---

### 2. 📖 Master Reference Guide (`goethe_a1_complete_guide.md`)
- Over 4,200 lines of exhaustive study material:
  - Complete 250 everyday sayings categorized by situational themes (Greetings, Shopping, Restaurant, Directions, Work, Health, Travel).
  - Exhaustive preposition breakdown: Accusative prepositions (*bis, durch, für, gegen, ohne, um*), Dative prepositions (*aus, bei, mit, nach, seit, von, zu*), and Two-Way prepositions (*an, auf, hinter, in, neben, über, unter, vor, zwischen*).
  - Irregular verbs conjugation tables and *Perfekt* participle reference.
  - Goethe A1 exam strategies for *Hören* (Listening), *Lesen* (Reading), *Schreiben* (Writing), and *Sprechen* (Speaking).

---

### 3. 📱 Inline Quiz Widget (`inline_quiz_widget.html`)
- Compact, lightweight standalone widget suitable for embedding or quick drills on mobile and desktop viewports.

---

## 📌 Recommended Antigravity Workspace Setup

To make this folder your active workspace in Antigravity:
1. Open Antigravity.
2. Select **Open Folder** or **Set Active Workspace**.
3. Choose:
   ```text
   C:\Users\ADMIN\.gemini\antigravity\scratch\goethe_a1_prep_studio
   ```
