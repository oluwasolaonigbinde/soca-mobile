import { supabase } from '@/lib/supabase';

export async function deleteCurrentAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: {},
  });

  if (error) {
    throw new Error(error.message || 'Unable to delete account.');
  }

  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    throw new Error(result?.error || 'Unable to delete account.');
  }

  await supabase.auth.signOut();
}
