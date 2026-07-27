-- Permit any authenticated admin to edit any challenge. The application update
-- payload intentionally excludes created_by_admin so original ownership is kept.

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS challenges_update ON public.challenges;
CREATE POLICY challenges_update
  ON public.challenges
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  )
  WITH CHECK (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

COMMENT ON POLICY challenges_update ON public.challenges IS
  'Any authenticated admin may edit or close a challenge; app updates preserve created_by_admin.';
