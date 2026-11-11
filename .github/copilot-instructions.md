# Hayat AI project rules

Stack: React (Vite) and Tailwind in `/client`. Node and Express with sqlite3 in `/server` (CommonJS). Document AI uses Gemini through `/server/services/ai.js` (`generateWithFallback` and `parseModelJson`). Chat can use xKiro through the same service with `AI_CHAT_PROVIDER=xkiro`; Gemini remains the default and fallback. xKiro health-data transmission requires explicit `XKIRO_ALLOW_HEALTH_DATA=true` after privacy review. Model names are set in `.env` (`AI_MODEL_PRIMARY`, `AI_MODEL_FALLBACK`, `XKIRO_MODEL_PRIMARY`). `server.js` sets dns ipv4first at the very top.

## Standing rules for every change
- Mobile-first responsive: side menu on desktop, bottom tab bar on phones, touch targets at least 44px, viewport meta tag.
- All visible text comes from `/client/src/locales` (en, ar, hi, ml). Arabic right-to-left must work. New ar, hi and ml text is listed in `/client/src/locales/TO_VERIFY.md`.
- No AI keys in frontend code. Fake data only, never real patient data. Never print, log or commit .env files, tokens or passwords.
- Authentication: all routes use `req.userId` from `requireAuth`. Never read the X-User-Id header.
- The AI never decides danger warnings or statuses. Range comparison and the dangerous-value rule are plain code (`valueChecker.js` and `clinicalRules.js`, with a server copy). Compare only against the range printed on the report. Say "outside the range on your report", never "you have X". End with "Discuss this with your doctor." or "Ask your pharmacist."
- The review step (editable values, user confirms) always comes before any explanation.
- Chat safety order: emergency check, support check, then the AI, then the output guard in `chatGuards.js`. The AI never writes place names, addresses, phones or hours; places come from `/api/facilities`. The navigator may only choose from the fixed specialties list and never names a condition.
- Never invent facts about UAE laws, drug information or facilities. Mark unknowns "TO VERIFY".
- Inputs and text must stay visible (`bg-white text-gray-900`).
- Do not run synthetic route tests unless asked. Run the client build once at the end of a task and stop.
- Never run git push, never add a git remote, and never read or print .env contents.

## Status
Done: Stages 1 to 12 (including login security, family sharing and Access Log, Referral Tracker, Clinic Path, polish and PWA), N1 (chat-first navigation and new Home), N2 (places in chat), N4 (Health Records: healthMetrics table, /api/records, /records page). Pending: N3 Healthcare Navigator (status to confirm), N5 healthcare groups page (links only).

## Known open items
- Danger thresholds and the no-printed-range rule need clinician review.
- Arabic, Hindi and Malayalam text and the emergency, support and red-flag word lists need native-speaker review.
- Medicine list source title and date are TO VERIFY. Drug descriptions come from the AI and are labelled "to verify".
- Hospital group names and websites are TO VERIFY.
- The free Gemini tier is for fake data only.
