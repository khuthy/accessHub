import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["FAN", "MODEL"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  previewUrl: z.string().url().optional().or(z.literal("")),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  mediaType: z.enum(["IMAGE", "VIDEO", "GALLERY"]).default("IMAGE"),
  tokenCost: z.number().int().min(0).max(9999),
  isPublished: z.boolean().default(false),
});

export const profileSchema = z.object({
  displayName: z.string().min(1).max(60),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  tokenPrice: z.number().int().min(0).max(9999),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
