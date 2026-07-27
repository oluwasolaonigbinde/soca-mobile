-- Enforce challenge open/closed state at the database boundary so direct API
-- calls cannot insert or replace a submission after an admin closes a challenge.

DROP POLICY IF EXISTS challenge_submissions_insert ON public.challenge_submissions;
CREATE POLICY challenge_submissions_insert
  ON public.challenge_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
    AND EXISTS (
      SELECT 1
      FROM public.challenges
      WHERE challenges.id = challenge_submissions.challenge_id
        AND (challenges.starts_at IS NULL OR challenges.starts_at <= now())
        AND (challenges.ends_at IS NULL OR challenges.ends_at > now())
    )
  );

DROP POLICY IF EXISTS challenge_submissions_update ON public.challenge_submissions;
CREATE POLICY challenge_submissions_update
  ON public.challenge_submissions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
    AND EXISTS (
      SELECT 1
      FROM public.challenges
      WHERE challenges.id = challenge_submissions.challenge_id
        AND (challenges.starts_at IS NULL OR challenges.starts_at <= now())
        AND (challenges.ends_at IS NULL OR challenges.ends_at > now())
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'player'
    )
    AND EXISTS (
      SELECT 1
      FROM public.challenges
      WHERE challenges.id = challenge_submissions.challenge_id
        AND (challenges.starts_at IS NULL OR challenges.starts_at <= now())
        AND (challenges.ends_at IS NULL OR challenges.ends_at > now())
    )
  );
