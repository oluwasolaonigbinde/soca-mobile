import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function readJsonSecret(name: string, key: string) {
  const value = Deno.env.get(name);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, string | undefined>;
    return parsed[key] ?? parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

function getEnvKey() {
  return (
    Deno.env.get('SUPABASE_ANON_KEY') ??
    readJsonSecret('SUPABASE_PUBLISHABLE_KEYS', 'anon') ??
    readJsonSecret('SUPABASE_PUBLISHABLE_KEYS', 'default')
  );
}

function getServiceKey() {
  return (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    readJsonSecret('SUPABASE_SECRET_KEYS', 'service_role') ??
    readJsonSecret('SUPABASE_SECRET_KEYS', 'default')
  );
}

async function listBucketPaths(client: ReturnType<typeof createClient>, bucket: string, prefix: string) {
  const paths: string[] = [];
  const stack = [prefix];

  while (stack.length > 0) {
    const path = stack.pop();
    if (!path) continue;

    const { data, error } = await client.storage.from(bucket).list(path, { limit: 1000 });
    if (error) {
      console.warn(`Unable to list ${bucket}/${path}:`, error.message);
      continue;
    }

    for (const entry of data ?? []) {
      const entryPath = `${path}/${entry.name}`;
      if (entry.id) {
        paths.push(entryPath);
      } else {
        stack.push(entryPath);
      }
    }
  }

  return paths;
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    error?.message?.includes('does not exist') === true ||
    error?.message?.includes('Could not find the table') === true
  );
}

async function deleteRows(
  client: ReturnType<typeof createClient>,
  table: string,
  column: string,
  userId: string,
) {
  const { error } = await client.from(table).delete().eq(column, userId);
  if (error && !isMissingRelationError(error)) {
    throw new Error(`Unable to delete ${table}.${column} rows.`);
  }
}

async function deleteRowsOr(
  client: ReturnType<typeof createClient>,
  table: string,
  filters: string,
) {
  const { error } = await client.from(table).delete().or(filters);
  if (error && !isMissingRelationError(error)) {
    throw new Error(`Unable to delete ${table} rows.`);
  }
}

async function clearUserReference(
  client: ReturnType<typeof createClient>,
  table: string,
  column: string,
  userId: string,
) {
  const { error } = await client.from(table).update({ [column]: null }).eq(column, userId);
  if (error && !isMissingRelationError(error)) {
    throw new Error(`Unable to clear ${table}.${column} references.`);
  }
}

async function deleteUserData(client: ReturnType<typeof createClient>, userId: string) {
  await clearUserReference(client, 'events', 'organizer_id', userId);
  await clearUserReference(client, 'challenges', 'created_by_admin', userId);
  await clearUserReference(client, 'reports', 'reviewed_by', userId);
  await clearUserReference(client, 'profile_achievements', 'created_by_admin', userId);

  await deleteRows(client, 'reports', 'reporter_id', userId);
  await deleteRows(client, 'profile_achievements', 'profile_id', userId);
  await deleteRows(client, 'event_interest', 'user_id', userId);
  await deleteRows(client, 'post_likes', 'user_id', userId);
  await deleteRows(client, 'posts', 'owner_id', userId);
  await deleteRows(client, 'challenge_submissions', 'user_id', userId);
  await deleteRows(client, 'video_likes', 'user_id', userId);
  await deleteRows(client, 'video_views', 'viewer_id', userId);
  await deleteRows(client, 'videos', 'owner_id', userId);
  await deleteRows(client, 'profile_views', 'viewer_id', userId);
  await deleteRows(client, 'profile_views', 'profile_id', userId);
  await deleteRows(client, 'follows', 'follower_id', userId);
  await deleteRows(client, 'follows', 'followee_id', userId);
  await deleteRowsOr(client, 'conversations', `user_a.eq.${userId},user_b.eq.${userId}`);
  await deleteRowsOr(client, 'messages', `sender_id.eq.${userId},recipient_id.eq.${userId}`);
  await deleteRows(client, 'profiles', 'id', userId);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = getEnvKey();
  const serviceKey = getServiceKey();
  const authHeader = request.headers.get('Authorization');
  const jwt = authHeader?.replace(/^Bearer\s+/i, '');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ ok: false, error: 'Deletion function is not configured.' }, 500);
  }

  if (!jwt) {
    return jsonResponse({ ok: false, error: 'Sign in before deleting your account.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(jwt);

  if (userError || !user) {
    return jsonResponse({ ok: false, error: 'Session could not be verified.' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = user.id;
  const buckets = ['avatars', 'videos', 'post-images'];

  for (const bucket of buckets) {
    const paths = await listBucketPaths(adminClient, bucket, userId);
    if (paths.length > 0) {
      const { error } = await adminClient.storage.from(bucket).remove(paths);
      if (error) {
        return jsonResponse({ ok: false, error: `Unable to remove ${bucket} uploads.` }, 500);
      }
    }
  }

  try {
    await deleteUserData(adminClient, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete account data.';
    return jsonResponse({ ok: false, error: message }, 500);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId, true);
  if (deleteError) {
    return jsonResponse({ ok: false, error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true });
});
