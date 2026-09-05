# ContentOps

**Turn one raw transcript into a ranked content queue.**

ContentOps is a local-first creator workflow engine. Paste a podcast, interview, voice note, lecture, or talking-head transcript and it produces ranked clip opportunities, hooks, titles, captions, keyword/SEO signals, source diagnostics, and a publishing plan.

## Why this exists

Creators often already have useful raw material. The expensive part is repeatedly finding the strongest moment, packaging it, and deciding what to publish. ContentOps treats that as an operations problem instead of another blank-page writing problem.

## Working MVP

- Transcript parsing and sentence segmentation
- Deterministic hook scoring using specificity, contrast, numbers, causal language, sentence shape and vocabulary signals
- Non-overlapping clip-window selection
- Local keyword extraction
- Title, hook, caption and hashtag packaging
- Source diagnostics: hook density, specificity, clarity and keyword focus
- Platform-aware publishing queue
- Copyable summary and downloadable JSON
- Runs entirely in the browser, with no API key and no transcript upload

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

You can also open `index.html` directly in most modern browsers.

## Architecture

```text
raw transcript
    ↓
sentence segmentation
    ↓
feature extraction
    ├─ length / question / number signals
    ├─ contrast + causal phrases
    ├─ specificity + power vocabulary
    └─ position / first-person signals
    ↓
hook scoring + overlap suppression
    ↓
clip windows
    ├─ keyword map
    ├─ title + caption packaging
    └─ publishing schedule
    ↓
UI + JSON export
```

The current MVP intentionally uses explainable local heuristics. A later model-assisted layer can rerank candidates or personalize packaging without making the core workflow dependent on an external API.

## Hackathon provenance

This repository was created on **5 September 2026** for the current hackathon build cycle. The application code in `index.html`, `styles.css`, and `app.js` was written after repository creation. AI assistance was used for implementation and should be disclosed in any submission that requires it.

## Submission checklist

- [x] Public source repository
- [x] Working functional prototype
- [x] README and architecture explanation
- [ ] Public deployment
- [ ] Screenshots
- [ ] 2–5 minute demo video
- [ ] Final Devpost project description
- [ ] Official eligibility confirmed for the target hackathon

## Current target

The product is intentionally aligned with creator-workflow hackathons while remaining eligible as an original open-theme submission for age-compatible student events such as FirstCommit.

## License

Copyright © 2026 Satvik. Hackathon prototype; licensing decision pending.
