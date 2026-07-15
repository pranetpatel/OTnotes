# Security & Privacy Overview

This is a self-assessment of how the OT Notes app handles data and access, written for internal review — **not a compliance certification or HIPAA attestation**. It's meant to give an honest, accurate picture of what protections exist today and where the gaps are, so the practice can decide whether additional controls (or a policy of what data goes into this app vs. Jane) are needed before wider use.

## 1. Supabase security model

The app talks to Supabase using a single **anon (public) API key**, embedded in the client bundle via `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. There is **no Supabase Auth** — the client never logs a user in, so Postgres has no way to know "which staff member" is making a given request (see `services/supabase.ts`, configured with `persistSession: false`).

**Row Level Security (RLS)** is enabled on every table, but every policy is currently `for all using (true) with check (true)` — meaning RLS is switched on (satisfying Supabase's dashboard warnings) but does not actually restrict who can read or write any row. In practice, **any request made with the anon key can read or write any row in any table**, including `staff.pin`.

**What this means concretely:**
- The staff PINs (session sign-in) and OT sign-off flow are **app-level workflow gates**, not database access controls. They stop someone from casually picking the wrong name in the app UI, and they establish "who did this" for the audit trail. They do **not** stop someone who has the anon key (which is, by design, public/embedded in the client) from bypassing the app and reading or writing data directly via the Supabase API.
- The admin PIN (`app_settings.admin_pin`) works the same way — it gates the *app's* admin screen, not the database.
- One deliberate mitigation already in place: the staff list the app fetches for pickers only ever selects `id, name, is_ot, active` — never `pin` — so raw PINs are not sent to the client except during the one-row PIN-verification call itself.

**What real enforcement would require:** Supabase Auth (each staff member logs in with a real session, not just a PIN check against a shared table), plus RLS policies keyed off `auth.uid()` so Postgres itself enforces who can read/write what. This is a meaningfully larger project — user provisioning, login/logout flows, session refresh — and was out of scope for the current round of changes. It's the natural next step if the practice wants database-level (not just app-level) access control.

**Recommendation for now:** treat the anon key as equivalent in sensitivity to "anyone who can install/inspect the app can technically reach the data," and avoid putting any information in this system that would be seriously harmful if it leaked beyond the care team — consistent with using Jane as the permanent, more tightly controlled clinical record.

## 2. Backups

Backup/point-in-time-recovery coverage depends on the Supabase project's plan tier — this should be checked directly in the Supabase dashboard (Project Settings → Backups) rather than assumed. If the current tier doesn't include daily backups or PITR, the cheap stopgap is a periodic manual export (e.g. a scheduled `pg_dump` or the CSV/PDF exports already built into the app) until a tier upgrade is justified by real usage volume.

## 3. User permissions

- **Staff PIN** (new): each staff member has an individual PIN in the `staff` table, confirmed via `StaffIdentityPicker` before a session note can be saved or edited. This establishes *authorship* — whose name appears as "Supervisor" on a note — as an app-level identity check, not a login system.
- **Admin PIN**: a single shared PIN (`app_settings.admin_pin`) gates the Admin tab (student/staff management, goal overrides, schedules, demo data seeding). Anyone with this PIN has full admin capability; it is not per-person.
- **`is_ot` flag**: staff can be marked as an OT. Only staff marked `is_ot = true` appear in the sign-off picker (`edit-assessment.tsx`), so completing a sign-off requires selecting an OT and entering their PIN. Reverting a signed-off note back to draft is further gated behind the separate admin PIN (`isAdmin` check).
- All of the above are **client-enforced**, not database-enforced, per the RLS discussion above. The UI won't let a non-OT staff member appear in the sign-off list, but nothing at the database layer would stop a direct API call from writing `status = 'reviewed'` with an arbitrary `reviewed_by`.

## 4. OpenAI usage

The app calls the OpenAI API directly from the client (raw `fetch`, no SDK) in two places:

- **`services/noteRefinement.ts`** — cleans up raw voice-dictated notes into professional OT note text.
- **`app/(tabs)/admin.tsx`** (`ProgressModal.handleAnalyze`) — generates an AI clinical progress summary from a student's session history.

**What leaves the device:** in both cases, this includes student names, goal/skill selections, and free-text session notes — i.e. clinically relevant information about a minor's therapy progress. This data is sent to OpenAI's API as part of the request.

**Key exposure point:** `EXPO_PUBLIC_OPENAI_API_KEY` is a client-embedded ("public") environment variable, the same exposure class as the Supabase anon key — it ships inside the app bundle and is not a server-side secret.

**Recommendation:** before broader rollout, the practice's privacy officer should explicitly review OpenAI's API data-retention and training-use policy (as it applies to the account/plan in use) for this specific use case — sending identifiable information about minors' therapy sessions to a third-party AI provider. This is a business/compliance decision, not an engineering one, and isn't something this document can resolve on its own. If the answer is "not acceptable as-is," the mitigations are: stripping student names before the API call (referring only by an internal code), or moving these AI features behind a server-side proxy that can apply stricter data handling — both larger changes than what's covered here.

## Summary

| Area | Current state | Enforced at |
|---|---|---|
| Staff identity | Individual PIN per staff member | App only |
| Admin access | Single shared PIN | App only |
| OT sign-off | `is_ot` flag + PIN confirmation | App only |
| Database access | Anon key, RLS enabled but fully open | Not enforced |
| Backups | Depends on Supabase plan tier | Platform (verify tier) |
| AI data flow | Names, goals, notes sent to OpenAI | Needs privacy-officer review |

This is an honest snapshot as of the current codebase, not a guarantee. It should be revisited whenever the app's data handling changes, or before any decision to use it in place of (rather than alongside) Jane for anything beyond daily working notes.
