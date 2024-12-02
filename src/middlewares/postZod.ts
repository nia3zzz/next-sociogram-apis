import { z } from 'zod';

const createPost = z.object({
  caption: z
    .string()
    .min(1, 'Caption cannot be empty.')
    .optional()
    .nullable(),
});

export { createPost };
