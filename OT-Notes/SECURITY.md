# Security & Privacy Overview

This document describes how the OT Notes app protects data and controls access, as of the current build. It's written for Tina and the practice as a plain-language summary of what's in place — not a formal compliance certification (e.g. HIPAA attestation), but an accurate picture of the real protections behind the app.

## 1. Login & identity

Every staff member signs in with their own **email and password** (Supabase Auth) — there are no shared PINs and no generic logins. A session is tied to that individual for as long as they're signed in, and every action taken in the app (creating a note, signing off an assessment, editing a student) is attributable to that person's real account, not just a name picked from a list.

## 2. Database access is enforced by the database itself

The app's data lives in Supabase (Postgres), and access is controlled by **Row Level Security (RLS) policies that run inside the database** — not just checks in the app's UI. Concretely:

- Every table requires a signed-in, active staff session to read anything at all.
- Only staff flagged as **admin** can create/edit/delete students, staff records, schedules, or app settings.
- Signing off an assessment (marking it "reviewed") is enforced by a database trigger that only allows it if the signed-in user is flagged as an **OT** — this can't be bypassed by editing the app or calling the API directly, because Postgres itself checks it.
- Reverting a signed-off note back to draft requires an **admin** account, enforced the same way.
- The public API key embedded in the app (`anon` key) has had all direct table write access revoked — it's only used to reach the sign-in endpoint. Once signed in, every request is scoped to that person's actual permissions.

In short: what a staff member can see and do is determined by their real account and role, checked on the server, every time — not by what the app's UI happens to show them.

## 3. Roles

- **Staff**: can view students, schedules, and assessments, and can create/edit their own session notes.
- **OT** (`is_ot`): the subset of staff who can formally sign off an assessment. Signing off requires re-entering that OT's password at the moment of sign-off, so a supervisor's own login session is never silently swapped.
- **Admin** (`is_admin`): manages students, staff accounts, schedules, and can revert a signed-off note back to draft. Admin accounts are created and password-reset through a locked-down server-side function, not a client-side call.

## 4. Backups

Backup and point-in-time-recovery coverage depends on the Supabase project's plan tier — worth confirming directly in the Supabase dashboard (Project Settings → Backups) as usage grows.

## 5. AI-assisted note writing (OpenAI)

Two features send session data to OpenAI's API to help with writing:

- Cleaning up raw voice-dictated notes into professional OT note text.
- Generating an AI-assisted progress summary from a student's session history.

This means student names, goals, and session note text are sent to OpenAI as part of generating these features. This is a standard use of a third-party AI API, comparable to how many clinical and note-taking tools use AI assistance today. As with any third-party service handling client information, it's worth the practice's privacy officer confirming OpenAI's data-retention terms fit the practice's policies before relying on this for broader use.

## Summary

| Area | Current state | Enforced at |
|---|---|---|
| Staff identity | Individual login (email + password) | Database (Supabase Auth) |
| Admin access | `is_admin` role on staff account | Database (RLS) |
| OT sign-off | `is_ot` role + password re-entry | Database (RLS + trigger) |
| Database access | Per-role RLS policies, anon writes revoked | Database |
| Backups | Depends on Supabase plan tier | Platform (verify tier) |
| AI-assisted notes | Names, goals, notes sent to OpenAI | Third-party (OpenAI policy) |

This reflects the app as it stands today. It should be revisited if the app's data handling changes significantly, or before any decision to expand its role relative to Jane.
