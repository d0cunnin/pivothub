# PivotHub analytics (GA4 organic funnel)

Funnel: **visit (source/campaign) -> `sign_up` -> `first_tool_open` -> `first_tool_complete`**, plus `tool_open` / `tool_complete` for repeat use.

Code: `src/lib/analytics.ts` (attribution, consent, events), `src/components/AnalyticsTracker.tsx` (page views + notice).
Nothing is sent until a GA4 Measurement ID is configured.

## Events

| Event | When it fires | Parameters |
|---|---|---|
| `page_view` | Every route change. The first one uses the original landing URL so UTM tags count even after a redirect to sign-in. | `page_location` (only `utm_*` query params kept), `page_path`, `page_title` |
| `sign_up` (GA recommended) | Account successfully created: email sign-up accepted by Supabase (not "email already registered", not errors), or a new Google account on first sign-in. Once per account per browser. | `method` (`email`/`google`), `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content` |
| `tool_open` / `first_tool_open` | A tool page is opened (`/assessit`, `/earnit`, ...). `first_` once per browser. | `tool_category`, campaign params |
| `tool_complete` / `first_tool_complete` | A tool's edge function returned results successfully (the server has charged). `first_` once per browser. | `tool_id` (function name), `tool_category`, `is_first`, campaign params |

Never sent: names, emails, user ids, tokens, or anything typed into tools. Google signals and ad personalization are off.

## Attribution

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` are read on arrival and saved in the browser before any redirect.
- Without UTMs, Facebook/Instagram/TikTok/X/LinkedIn/YouTube/Pinterest referrers and `fbclid`/`ttclid` are recognized. In-app browsers often hide the referrer, so **always tag links**.
- First touch is never overwritten; last touch updates only on a new campaign/referral visit (direct visits keep it).
- On sign-up, the source is saved on the account (`auth.users.raw_user_meta_data -> 'signup_attribution'`), so it survives the email-confirmation step and different devices.

### Link templates

```
https://pivothub.io/?utm_source=facebook&utm_medium=social&utm_campaign=<campaign>&utm_content=<post>
https://pivothub.io/?utm_source=instagram&utm_medium=social&utm_campaign=<campaign>&utm_content=<post>
https://pivothub.io/?utm_source=tiktok&utm_medium=social&utm_campaign=<campaign>&utm_content=<video>
```

Use lowercase, no spaces (use `_`), and never put personal information in UTM values.

## Consent

Notice with **OK / Opt out** is shown once. Analytics cookies are on by default except in the EEA, UK and Switzerland, where they stay off until the visitor clicks OK (Google Consent Mode). Ad storage is always denied.

## Setup

1. Create a GA4 property and a Web data stream for `https://pivothub.io`. Copy the Measurement ID (`G-XXXXXXXXXX`).
2. Set it as `VITE_GA_MEASUREMENT_ID` (or set the fallback in `GA_MEASUREMENT_ID` in `src/lib/analytics.ts`), then publish.
3. In GA Admin > Events, mark `sign_up` and `first_tool_complete` as **key events**.
4. In GA Admin > Custom definitions, add event-scoped dimensions: `tool_category`, `tool_id`, `method`.

## Verify

1. Open `https://pivothub.io/?utm_source=facebook&utm_medium=social&utm_campaign=test` and watch GA **Realtime** (or **DebugView** with the Google Analytics Debugger browser extension).
2. Expect `page_view` with the UTM tags, then `tool_open` when opening a tool page.
3. Create a test account: exactly one `sign_up`. Refresh: still one. Try an already-registered email: none.
4. Run a tool successfully: `tool_complete` (and `first_tool_complete` the first time). A failed run sends nothing.

## Sign-ups by source (Supabase SQL editor)

```sql
-- Sign-ups and confirmed sign-ups by source/campaign since tracking started
select
  coalesce(u.raw_user_meta_data->'signup_attribution'->>'source', '(not recorded)') as source,
  coalesce(u.raw_user_meta_data->'signup_attribution'->>'medium', '') as medium,
  coalesce(u.raw_user_meta_data->'signup_attribution'->>'campaign', '') as campaign,
  count(*) as signups,
  count(u.email_confirmed_at) as confirmed
from auth.users u
where u.created_at >= '2026-10-29'
group by 1, 2, 3
order by signups desc;

-- Of those sign-ups, how many completed at least one charged tool run
select
  coalesce(u.raw_user_meta_data->'signup_attribution'->>'source', '(not recorded)') as source,
  count(distinct u.id) as signups,
  count(distinct l.user_id) as completed_a_tool
from auth.users u
left join public.api_request_log l
  on l.user_id = u.id and l.success and l.credits_charged > 0
where u.created_at >= '2026-10-29'
group by 1
order by signups desc;
```

Compare the first query's `signups` with GA's `sign_up` count for the same dates. GA will be lower when visitors opt out or block analytics; Supabase is the source of truth for account counts.

## Known limitations

- `first_*` events are once per browser, so a user on two devices can send two.
- Email sign-ups count when the account is created; some never confirm their email (see `confirmed` above).
- Ad blockers and opt-outs hide some visits from GA (not from Supabase).
- No historical data exists before tracking was installed.
