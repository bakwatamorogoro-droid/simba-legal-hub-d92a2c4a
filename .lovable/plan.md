# Group Assignment System + AI-Check Marking

## Scope (Phase 2)

### 1. Database (migration mpya)
Ongeza jedwali kwenye Lovable Cloud:
- `groups` — `name`, `course_id`, `academic_year_id`, `leader_student_id`, `assignment_id` (nullable — group inaweza kutumika kwa assignments nyingi za course/year hiyo, au ni per-assignment. **Naipendekeza per-assignment** ili submission lock iwe rahisi).
- `group_members` — `group_id`, `student_id`, `status` (`pending` / `confirmed` / `declined`), `confirmed_at`.
- `group_submissions` — `group_id`, `assignment_id`, `file_path`, `file_name`, `submitted_at`, `submitted_by_student_id`, `marks`, `remarks`, `ai_score`, `ai_reason`, `marked_at`.
- Ongeza `type` (`individual` | `group`) kwenye `assignments`.
- Ongeza `locked` boolean kwenye `submissions` (individual) — inakuwa true baada ya submit; hairuhusiwi kubadilisha.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE group_members, groups, group_submissions`.

### 2. Student flow — Group Assignment (`/group-assignment`)
- Login sawa na individual (Exam # + Last Name), au tumia session iliyopo.
- **Leader anaunda group**: chagua assignment ya `type = group` (dropdown ikichuja kwa course + year yake), aweke jina la group, aongeze reg numbers za wanachama. Kila mmoja ana-row `pending`.
- **Wanachama wanaona ombi**: kwenye dashboard, "Umealikwa kwenye group X" → Confirm / Decline.
- **Live presence**: Supabase Realtime channel `group:{id}` na `presenceState()` — kila mtu aliye kwenye ukurasa anaonekana kwa green dot. Confirmation status pia inaonyeshwa (Amejoin ✓ / Bado).
- **Submit lock**: Leader pekee anaona kitufe cha Upload, na kinawaka tu wakati **wanachama wote wame-confirm** na **deadline haijapita**. Baada ya submit, group inafungwa (`group_submissions` inaingizwa; UI inaonyesha "Imetumwa" na kuficha upload). Hakuna re-submit.

### 3. Individual submission lock
Baada ya kutuma, mfumo hauruhusu tena kuedit/re-upload (badilisha logic ya sasa ya "replace" iwe "one-shot", `locked=true`).

### 4. AI-check + Marking (individual & group)
- Wakati wa submit (individual au group): server ina-extract text kutoka PDF (pdfjs) au DOCX (mammoth), inaituma kwa **Lovable AI Gateway** (`google/gemini-2.5-flash`, bure) na prompt: "Kadiria asilimia ya uwezekano kuwa maandishi haya yameandikwa na AI, toa `ai_score` (0-100) na `ai_reason` (Kiswahili, sentensi 1-2)". Matokeo yanahifadhiwa kwenye submission.
- **Admin Marking Dialog** (mpya, kwa individual + group):
  - Onyesha AI score + reason juu (badge nyekundu ikiwa >60%).
  - Preview ya kazi (signed URL kwenye `<iframe>` kwa PDF).
  - Fomu: `marks` (0-100), `remarks` (textarea kubwa yenye rich text bullets: Nzuri / Marekebisho / Kosa), tick za haraka ("Copy detected", "Muundo mzuri", "Hoja dhaifu") zinaingiza template kwenye remarks.
  - Save → inarekodi `marked_at`, `marks`, `remarks`.
- Mwanafunzi anaona alama + remarks + AI note kwenye dashboard yake baada ya kumarking. Kazi ya asili (file) inabaki kama ilivyo; annotations zote ni mfumoni (kama ulivyokubaliana kwa "sahihisha ndani ya mfumo").

### 5. Admin panel polish
- Tab mpya **Assignments**: chagua `type` (Individual / Group) wakati wa kuunda.
- Tab mpya **Groups**: orodha ya groups zote, wanachama, status, submission status. Filter by course/year/assignment.
- Submissions view: tabs za Individual / Group, kila row ina AI badge, Marks button, Download button.
- CSV export: kwa group, kila mwanachama anapata row yenye marks sawa + AI score ya group.

## Technical notes
- AI check: `LOVABLE_API_KEY` (tayari ipo). Endpoint `https://ai.gateway.lovable.dev/v1/chat/completions`. Model default `google/gemini-2.5-flash`.
- Text extraction: `pdf-parse` haitegemei Node native — badala yake tumia `pdfjs-dist/legacy/build/pdf.mjs` (Worker-safe) kwa PDF, na `mammoth` kwa DOCX. Kama extraction ikifeli, hifadhi `ai_score = null, ai_reason = "Haikuweza kusomeka"`.
- Realtime presence: hukumbi RLS peke yake ni sawa kwa sababu channel ni per-group; ongeza SELECT policies kwa `group_members` ili kila mtu aone group lake tu. Kwa mfumo huu (bila Supabase Auth ya wanafunzi), tutatumia service-role kwa reads na broadcast presence kwa channel bila DB filter (client-side filter by student session).

## Migration order
1. Migration ya schema + realtime publication + `type` + `locked`.
2. Server functions: `group.functions.ts` (create/confirm/decline/list/submit) + upanuzi wa `student.functions.ts` (individual lock) + upanuzi wa `admin.functions.ts` (mark with AI, list group submissions, CSV).
3. UI: rewrite `src/routes/group-assignment.tsx`, sasisha `src/routes/individual-assignment.tsx` (lock UI + AI badge kwa mwanafunzi), sasisha `src/routes/admin.tsx` (Assignments type=group, Groups tab, marking dialog v2).

## Out of scope (kwa turn hii)
- Kuandika ticks/marks NDANI ya PDF/Word file yenyewe (utakubaliana kuwa remarks ziko mfumoni).
- Notifications za SMS/email (in-app tu).
