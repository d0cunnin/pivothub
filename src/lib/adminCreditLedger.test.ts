import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

const adminId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const awardId = '00000000-0000-4000-8000-000000000003';
let db: PGlite;
const balance = async () => {
  const result = await db.query<{ balance: { remaining: number } }>('SELECT public.refresh_credit_account($1) AS balance', [userId]);
  return result.rows[0].balance.remaining;
};
const grant = async (id = awardId, months = 3, caller = adminId) => db.query(
  'SELECT public.grant_admin_credits($1,$2,$3,$4,$5,$6,$7) AS result',
  [id, caller, userId, 'starter', 40, months, 'Complimentary test award'],
);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TYPE public.app_role AS ENUM ('admin','user');
    CREATE TABLE profiles(id uuid PRIMARY KEY);
    CREATE TABLE user_roles(user_id uuid,role app_role);
    CREATE FUNCTION has_role(uuid,app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=$1 AND role=$2) $$;
    CREATE TABLE subscribers_public(user_id uuid PRIMARY KEY,subscribed boolean DEFAULT false,free_credits_remaining integer DEFAULT 5,free_tier_start_date timestamptz DEFAULT now(),created_at timestamptz DEFAULT now(),free_credit_reset_at timestamptz DEFAULT now(),monthly_ai_requests integer DEFAULT 0,subscription_tier text,subscription_package text,ai_request_limit integer,extra_credits integer,rollover_credits integer,account_status text DEFAULT 'active');
    CREATE TABLE payment_subscriptions(user_id uuid,environment text,entitled_price_id text,paid_period_end timestamptz);
    CREATE TABLE credit_grants(id uuid DEFAULT gen_random_uuid(),user_id uuid,environment text,source_key text,price_id text,issued_at timestamptz,expires_at timestamptz,amount integer,remaining integer,UNIQUE(environment,source_key));
    CREATE TABLE credit_reservations(id uuid,user_id uuid,amount integer,expires_at timestamptz,status text,tool_name text);
    CREATE TABLE admin_audit_log(admin_user_id uuid,target_user_id uuid,action text,details jsonb);
    CREATE TABLE tool_usage_analytics(user_id uuid,tool_name text,credits_used integer);
    CREATE TABLE credit_deduction_log(user_id uuid,endpoint text,credits_deducted integer,request_hash text);
  `);
  await db.exec(readFileSync('drizzle/migrations/0006_complimentary_admin_credit_awards.sql', 'utf8'));
  await db.query('INSERT INTO profiles VALUES ($1)', [userId]);
  await db.query("INSERT INTO user_roles VALUES ($1,'admin')", [adminId]);
  await db.query('INSERT INTO subscribers_public(user_id) VALUES ($1)', [userId]);
}, 30000);
afterAll(async () => { await db?.close(); });

describe.sequential('complimentary credit ledger', () => {
  it('increases a test user balance by exactly 40 credits, not three months at once', async () => {
    const before = await balance();
    await grant();
    expect(await balance()).toBe(before + 40);
    const rows = await db.query('SELECT * FROM credit_grants');
    expect(rows.rows).toHaveLength(1);
  });
  it('expires the monthly grant three calendar months after issuance', async () => {
    const rows = await db.query<{ correct: boolean }>("SELECT expires_at=issued_at+interval '3 months' AS correct FROM credit_grants");
    expect(rows.rows[0].correct).toBe(true);
  });
  it('records admin, user, credits, months and note atomically', async () => {
    const rows = await db.query<{ admin_user_id: string; target_user_id: string; details: Record<string, unknown> }>('SELECT * FROM admin_audit_log');
    expect(rows.rows[0]).toMatchObject({ admin_user_id: adminId, target_user_id: userId, details: { credits: 40, months: 3, note: 'Complimentary test award' } });
  });
  it('makes retries idempotent', async () => {
    const before = await balance();
    await grant();
    expect(await balance()).toBe(before);
    expect((await db.query('SELECT * FROM admin_audit_log')).rows).toHaveLength(1);
  });
  it('does not change subscription status or create payment entitlements', async () => {
    expect((await db.query<{ subscribed: boolean }>('SELECT subscribed FROM subscribers_public')).rows[0].subscribed).toBe(false);
    expect((await db.query('SELECT * FROM payment_subscriptions')).rows).toHaveLength(0);
  });
  it('refuses non-admin grants', async () => {
    await expect(grant('00000000-0000-4000-8000-000000000004', 1, userId)).rejects.toThrow('Admin access required');
  });
  it('issues due installments once, retaining calendar-month expiry', async () => {
    await db.exec("UPDATE admin_credit_awards SET starts_at=now()-interval '1 month'");
    await balance();
    expect((await db.query('SELECT * FROM credit_grants')).rows).toHaveLength(2);
    await balance();
    expect((await db.query('SELECT * FROM credit_grants')).rows).toHaveLength(2);
  });
  it('never includes future credits in balance or consumption', async () => {
    const before = await balance();
    await db.query("INSERT INTO credit_grants(user_id,environment,source_key,issued_at,expires_at,amount,remaining) VALUES ($1,'live','future-test',now()+interval '1 month',now()+interval '4 months',500,500)", [userId]);
    expect(await balance()).toBe(before);
    await db.exec('UPDATE credit_grants SET remaining=0 WHERE issued_at<=now(); UPDATE subscribers_public SET free_credits_remaining=0');
    await db.query("INSERT INTO credit_reservations(id,user_id,amount,expires_at,status) VALUES ($1,$2,1,now()+interval '5 minutes','held')", [awardId, userId]);
    await expect(db.query("SELECT consume_credit_reservation($1,$2,'test')", [userId, awardId])).rejects.toThrow('Reserved credits no longer available');
  });
});