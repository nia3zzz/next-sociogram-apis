import { z } from 'zod';

const userSignup = z.object({
  name: z.string().min(1, 'Name is required.'),
  userName: z.string().min(1, 'Username is required.'),
  email: z.string().email('Invalid email format.'),
  telePhone: z.string().optional().nullable(),
  gender: z.enum(['male', 'female']),
  profilePic: z
    .string()
    .url()
    .min(1, 'Gender is required.')
    .optional()
    .nullable(),
  bio: z.string().optional().nullable(),
  following: z.array(z.string().uuid()).optional().nullable(),
  password: z.string().min(6, 'Password is required of 6 characters.'),
});

const userLogin = z
  .object({
    userName: z.string().optional(),
    email: z.string().optional(),
    telePhone: z.string().optional(),
    password: z.string().min(6, 'Password is required of 6 characters.'),
  })
  .refine((data) => data.userName || data.email || data.telePhone, {
    message: 'At least one field must be provided.',
  });

const updateProfile = z.object({
  name: z.string().min(1, 'Name is required.').optional(),
  userName: z.string().min(1, 'Username is required.').optional(),
  email: z.string().email('Invalid email format.').optional(),
  telePhone: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  profilePic: z.string().url().optional(),
  bio: z.string().optional(),
});

const followUser = z.object({
  id: z.string().min(24, 'Invalid id format.'),
});

const fileSchema = z.object({
  originalname: z.string(),
  mimetype: z
    .string()
    .refine((mimetype) => ['image/png', 'image/jpeg'].includes(mimetype), {
      message: 'Only PNG and JPEG files are allowed.',
    }),
  size: z.number().max(20 * 1024 * 1024, 'File size should not exceed 20MB'),
});

export { userSignup, userLogin, updateProfile, followUser, fileSchema };
