# FinalGallery data contract

## used tables
- `families` (read): `id`, `name`, `display_name`, `village`, `description_short_ro`, `description_ro`, `description`, `is_private`, `visibility`, `show_members`, `show_photos`, `owner_id`, `created_by`
- `photos` (read/write): `id`, `family_id`, `uploader_id`, `path`, `title_ro`, `title_en`, `caption_ro`, `caption_en`, `year`, `category`, `is_private`, `uploaded_at`
- `profiles` (read): `id`, `is_admin`
- `family_pin_access` (read): `user_id`, `family_id`, `granted_at`, `expires_at`
- rpc `check_family_pin(p_family_id uuid, p_pin text)` (fallback read)
- rpc `grant_family_pin_access(p_family_id uuid, p_pin text)` (main pin grant)

## visibility rules
- visitor: only `is_private = false`
- user with correct pin for a family: can view that family's private photos
- owner family: manage own family media
- admin: full moderation

## notes without SQL changes
- `video extern` is supported in UI and stored as marker in caption: `[VIDEO_EXTERN] <url>`
- documents are represented by `category` containing `Documente`
- no new columns were required

## required sql for production hardening
- run: `sql/finalgallery-security-setup.sql`
- this adds:
  - `pgcrypto` dependency for PIN hashing/check
  - robust `check_family_pin` + `set_family_pin`
  - pin grant table (`family_pin_access`)
  - rpc `grant_family_pin_access`
  - safer `photos` RLS for owner/admin/pin flows

## critical test scenarios
1. visitor opens public family -> sees public materials only
2. visitor opens private family -> pin modal appears before private content
3. correct pin -> private content becomes visible for that family only
4. uploader toggles photo visibility in media modal
5. owner bulk action: `Fa tot public` / `Fa tot privat`
6. admin can add item in archive, non-admin cannot
7. upload photo into family and refresh -> item remains visible
8. archive filters `Toate/Galerie/Documente` return consistent results
