# galeriev2 data contract

## used tables
- `families` (read): `id`, `name`, `display_name`, `village`, `description_short_ro`, `description_ro`, `description`, `is_private`, `visibility`, `show_members`, `show_photos`, `owner_id`, `created_by`
- `photos` (read/write): `id`, `family_id`, `uploader_id`, `path`, `title_ro`, `title_en`, `caption_ro`, `caption_en`, `year`, `category`, `is_private`, `uploaded_at`
- `profiles` (read): `id`, `is_admin`
- rpc `check_family_pin(p_family_id uuid, p_pin text)` (read)

## visibility rules
- visitor: only `is_private = false`
- user with correct pin for a family: can view that family's private photos
- owner family: manage own family media
- admin: full moderation

## notes without SQL changes
- `video extern` is supported in UI and stored as marker in caption: `[VIDEO_EXTERN] <url>`
- documents are represented by `category` containing `Documente`
- no new columns were required

## critical test scenarios
1. visitor opens public family -> sees public materials only
2. visitor opens private family -> pin modal appears before private content
3. correct pin -> private content becomes visible for that family only
4. owner toggles photo visibility in media modal
5. owner bulk action: `Fa tot public` / `Fa tot privat`
6. admin can add item in archive, non-admin cannot
7. upload photo into family and refresh -> item remains visible
8. archive filters `Toate/Galerie/Documente` return consistent results
