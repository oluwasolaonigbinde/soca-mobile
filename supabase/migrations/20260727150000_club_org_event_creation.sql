-- Allow authenticated Club and Organization profiles to create only events
-- attributed to their own auth/profile id. Admin event policies remain separate.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_organizer_insert ON public.events;
CREATE POLICY events_organizer_insert
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('club', 'org')
    )
  );

COMMENT ON POLICY events_organizer_insert ON public.events IS
  'Club and Organization accounts may create events only for their own profile.';
