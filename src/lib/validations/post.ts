import { z } from "zod";

export const postSchema = z.object({
  type: z.enum(["BLOG", "NEWS", "TUTOR_SPOTLIGHT"]),
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(10).max(400),
  content: z.string().trim().min(20),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  authorName: z.string().trim().min(1).max(100),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featuredTutorId: z.string().optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postSchema>;
