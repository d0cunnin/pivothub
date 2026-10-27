// Interview practice is sold as one session: paying for the questions
// covers feedback on every answer. interview-questions issues a signed pass;
// interview-feedback accepts it instead of charging per answer.

const SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
// Counter window for answers used; longer than the session so a session
// rarely spans two windows.
const COUNTER_WINDOW_SECONDS = 2 * 24 * 60 * 60;

export interface PracticeSession {
  id: string;
  userId: string;
  maxAnswers: number;
  exp: number;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (s: string): string =>
  atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createPracticeSession(userId: string, maxAnswers: number): Promise<string> {
  const session: PracticeSession = { id: crypto.randomUUID(), userId, maxAnswers, exp: Date.now() + SESSION_TTL_MS };
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload)}`;
}

/** Returns the session if the pass is authentic, unexpired and belongs to userId. */
export async function verifyPracticeSession(token: string | undefined, userId: string): Promise<PracticeSession | null> {
  if (!token || !SECRET) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  if (!timingSafeEqual(signature, await sign(payload))) return null;
  try {
    const session = JSON.parse(fromBase64Url(payload)) as PracticeSession;
    if (session.userId !== userId || typeof session.exp !== 'number' || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Counts one answer against the session. Returns false once the session's
 * answers are used up. Uses the existing throttle_user counter.
 */
// deno-lint-ignore no-explicit-any
export async function useSessionAnswer(supabase: any, session: PracticeSession): Promise<boolean> {
  const { error } = await supabase.rpc('throttle_user', {
    p_user_id: session.userId,
    p_endpoint: `interview-session:${session.id}`,
    p_window_seconds: COUNTER_WINDOW_SECONDS,
    p_max_reqs: session.maxAnswers,
  });
  if (!error) return true;
  if (error.message?.includes('USER_RATE_LIMIT_EXCEEDED')) return false;
  // Counter unavailable: the pass is still authentic and time-limited, so allow.
  console.error('[practice-session] answer counter failed:', error.message);
  return true;
}
