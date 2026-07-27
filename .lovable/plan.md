# Simba Legal Academy — Overhaul

## 1) Home Page (rewrite kabisa)
Fuata picha iliyoupload:
- **Header**: logo + "Simba Legal Academy / LEARN · RESEARCH · SUBMIT", nav (Home, Individual, Group, Student Registration), CTA (Student Login, Admin).
- **Hero split**: kushoto — badge "Assignment Management System", H1 kubwa "Simba Legal Academy" (gold accent kwa "Academy"), slogan `Learn • Research • Submit • Succeed`, paragraph, buttons (Anza Kujisajili, Individual Assignment). Kulia — hero image ya library + 3 glass cards zinazo-elea (Individual / Group / Registration).
- **Stats bar**: 4 cards (2,500+ Wanafunzi, 8,750+ Assignments, 1,200+ Makundi, 98% Mafanikio) juu ya white rounded surface.
- **Feature strip**: Usalama wa Juu, Rahisi & Haraka, Taarifa Sahihi, Msaada 24/7.
- **Founder section** + footer "Designed & Developed by Viwango Software" (tayari ipo — endelea nayo).

## 2) Registration — ondoa Exam Number na Last Name
Fields mpya: Full Name, Reg Number, Phone, Academic Year, Course.
Reg Number = unique identifier.

## 3) Login — Reg Number pekee
Ingiza Reg Number → dashboard. Recovery: simu → Reg Number.
Update `students.functions.ts` `studentLogin` na `recoverExamNumber` → `recoverRegNumber`.

## 4) Group Assignment — auto-match kwa assignment
Muundo mpya:
- Mwanafunzi anachagua **Assignment (group kind)** + Course + Year + anaingiza Reg Number.
- Mfumo unamweka kwenye assignment hiyo. **Wote walio-join assignment hiyo** kutoka course/year hiyo = wenza wake automatiki (no leader, no manual invite).
- Anaona list ya wenza + hali yao (live/offline via Realtime presence).

## 5) Group Chat (kabla ya submission)
- Realtime chat channel per (assignment_id, course_id, year_id) group.
- Ujumbe unahifadhiwa kwenye table mpya `group_chat_messages`.
- Yeyote aliyetuma **≥1 ujumbe** = "alichangia" (`participated=true`).
- Kabla ya kutuma kazi, UI inaonyesha "Wachangiaji: N" na list ya reg numbers zilizochangia.

## 6) Submission — credit kwa wachangiaji tu
- Mtu yeyote wa group anaweza upload kazi (mara moja kwa group).
- Mfumo unarekodi **wachangiaji wa chat wakati wa submission** kama waliofanya kazi (snapshot ya reg numbers waliochat kabla ya submit).
- Admin panel inaonyesha kwenye group submission: "Waliochangia" (green tick) vs "Hawakuchangia" (gray) — marks zinawaenda waliochangia tu kwenye CSV export.

## 7) Database changes
```sql
-- Ondoa dependency ya exam_number/last_name kwenye login (columns zibaki kwa admin reference)
-- Table mpya:
CREATE TABLE group_chat_messages (
  id uuid PK, assignment_id uuid, course_id uuid, academic_year_id uuid,
  student_id uuid, reg_number text, full_name text, message text, created_at
);
-- Ongeza column kwa group_submissions:
ALTER TABLE group_submissions ADD COLUMN participants jsonb; -- [{student_id, reg_number, full_name}]
-- Enable realtime kwa group_chat_messages
```
Tables za zamani `groups`, `group_members` — sitazifuta (backward compat), lakini mtiririko mpya hautazitumia.

## 8) Files zitakazobadilika
- `src/routes/index.tsx` — home rewrite.
- `src/routes/register.tsx` — ondoa exam/last name.
- `src/routes/login.tsx` — reg number pekee.
- `src/routes/group-assignment.tsx` — auto-match flow + chat panel.
- `src/lib/student.functions.ts` — new login/register/recovery.
- `src/lib/group.functions.ts` — auto-join, chat send/list, submit-with-participants.
- `src/routes/admin.tsx` — group submissions dialog: onyesha participants.
- Migration mpya: `group_chat_messages` + `participants` column + realtime.

## Technical notes
- Chat: Supabase Realtime `postgres_changes` subscription + presence kwa live indicator.
- Reg Number ya login inatafutwa kwenye `students` table; session iko vile vile (`sla_student` cookie).
- Home page — semantic tokens tu (navy/gold tayari zipo kwenye styles.css).
