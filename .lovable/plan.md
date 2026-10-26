# Redeploy all edge functions after the GitHub changes

The code you just put into GitHub only goes live in the app once it's deployed, so this plan redeploys everything.

## Steps
1. Get the latest list of functions, including any new ones from the GitHub changes.
2. Redeploy every edge function in one batch.
3. Look at the latest build and deploy logs for any errors. Fix any that come up from the new code.
4. Send one test request to Create It to check that the newly deployed version responds.
5. Tell you which functions deployed, and list any that failed and why.

## Technical details
- Deploy every directory under `supabase/functions/` except `_shared`, using `supabase--deploy_edge_functions`.
- Check `/tmp/observability/build-errors.log` and the edge function logs for `generate-create-it-blueprint`.
