import { z } from 'zod';

import { isValidBirthYear } from '@/lib/profile';
import type { Profile, UserRole } from '@/types/database';

export const profileFormBaseSchema = z.object({
  display_name: z.string().trim().min(1, 'Display name is required'),
  location: z.string().trim().min(1, 'Location is required'),
  bio: z.string().optional(),
  position: z.string().optional(),
  birth_year: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormBaseSchema>;

export function buildProfileFormSchema(role: UserRole | null | undefined) {
  return profileFormBaseSchema.superRefine((values, context) => {
    if (role !== 'player') {
      return;
    }

    if (!values.position?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Playing position is required',
        path: ['position'],
      });
    }

    const birthYearValue = values.birth_year?.trim();
    if (!birthYearValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Birth year is required',
        path: ['birth_year'],
      });
      return;
    }

    const parsedBirthYear = Number(birthYearValue);
    if (!Number.isInteger(parsedBirthYear) || !isValidBirthYear(parsedBirthYear)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid birth year',
        path: ['birth_year'],
      });
    }
  });
}

export function getProfileFormDefaults(
  profile: Profile | null,
): ProfileFormValues {
  return {
    display_name: profile?.display_name ?? profile?.full_name ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
    position: profile?.position ?? '',
    birth_year: profile?.birth_year ? String(profile.birth_year) : '',
  };
}

export function mapProfileFormValuesToUpdate(values: ProfileFormValues) {
  const trimmedBio = values.bio?.trim();
  const trimmedPosition = values.position?.trim();
  const trimmedBirthYear = values.birth_year?.trim();

  return {
    display_name: values.display_name.trim(),
    location: values.location.trim(),
    bio: trimmedBio ? trimmedBio : null,
    position: trimmedPosition ? trimmedPosition : null,
    birth_year: trimmedBirthYear ? Number(trimmedBirthYear) : null,
  };
}
