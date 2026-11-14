# Security notes

## Export scope

The original `config.js` was excluded and replaced by an empty `config.example.js`. The original configuration used a Supabase publishable key, not a server secret. A publishable key is intended for browser use, but database permissions still determine what a visitor can access.

This is a static source review, not a complete security audit. The original files and live Supabase project were not modified. Existing Indonesian setup notes were omitted because they describe older flows; the README documents the exported snapshot instead.

## Findings to resolve before production

1. **Profile role escalation:** `echavet_history.sql` allows users to update their own profile row without restricting the `role` column. `schema.sql` also grants broad self-profile access, and those policies can remain when applying the history migration. Because `is_clinical_user()` trusts `profiles.role`, a user may be able to promote themselves. Restrict role changes to trusted administrators at the database level and test direct API requests from Pawrent accounts, including attempts to update or insert privileged roles. Hiding the role field in the interface does not fix this.
2. **Prototype access controls:** some screens use localStorage role flags, hardcoded sample monitoring codes, and browser-held demo data. Enforce identity, ownership, and clinical permissions in database/server policies for every sensitive operation.
3. **Dynamic HTML:** several screens insert data through `innerHTML`. Review all user-controlled values and render them safely before handling real records.
4. **Recovery enumeration:** `pawrent_password_recovery.sql` exposes a function to anonymous users that returns whether an email/phone pair matches. Review the information disclosure and add appropriate abuse controls before enabling it publicly.
5. **Historical SQL:** schema variants overlap and are not a verified deployment sequence. Review existing grants and policies as well as new ones; adding a restrictive policy does not remove older permissive policies.
6. **Video and private data:** never commit camera passwords, signed stream URLs, patient records, contact exports, authentication tokens, or browser storage/session exports. Real cross-device streaming needs authenticated access controls.

## Before pushing

- Inspect `git status` and `git diff --cached`; confirm local configuration is absent.
- Confirm asset ownership and remove any real personal information from source or images.
- Use synthetic data for a public demonstration.
- Keep server-side credentials outside the frontend and repository.
- If credentials have already been published, deleting the current file alone does not remove previous exposure.

Do not post credentials or private clinical information in public GitHub issues.
