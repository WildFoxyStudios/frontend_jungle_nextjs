import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  two_factor_code: z.string().optional(),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  invite_code: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const postSchema = z.object({
  content: z.string().max(5000, "Post content is too long"),
  privacy: z.enum(["public", "friends", "only_me"]),
  feeling: z.string().optional(),
  location: z.string().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const profileSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  about: z.string().max(500).optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const groupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters").max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, "Category is required"),
  privacy: z.enum(["public", "private", "secret"]),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  location: z.string().max(200).optional(),
});

export const productSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000),
  price: z.number().positive("Price must be positive"),
  currency: z.string().length(3),
  category: z.string().min(1),
  location: z.string().max(200).optional(),
});

export const jobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1),
  location: z.string().max(200),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  job_type: z.enum(["full_time", "part_time", "contract", "freelance", "internship"]),
});

export const blogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(50, "Blog content must be at least 50 characters"),
  description: z.string().max(300).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(10).optional(),
});

export const pageSchema = z.object({
  name: z.string().min(3, "Page name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, "Category is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
});

export const fundingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  goal_amount: z.number().positive("Goal must be a positive number"),
  currency: z.string().length(3),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
});

export const reportSchema = z.object({
  reason: z.enum(["spam", "harassment", "hate_speech", "nudity", "violence", "false_info", "other"]),
  description: z.string().max(1000).optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const adSchema = z.object({
  name: z.string().min(1, "Ad name is required").max(100),
  audience: z.enum(["all", "male", "female"]),
  budget: z.number().positive("Budget must be positive"),
  post_id: z.number().positive(),
});

export const privacySettingsSchema = z.object({
  who_can_see_posts: z.enum(["everyone", "followers", "nobody"]),
  who_can_message: z.enum(["everyone", "followers", "nobody"]),
  confirm_followers: z.boolean(),
  show_online_status: z.boolean(),
  show_last_seen: z.boolean(),
});

export const imagePresetSchema = z.enum([
  "post",
  "avatar",
  "cover",
  "story",
  "chat",
  "blog",
  "product",
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type GroupInput = z.infer<typeof groupSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type PageInput = z.infer<typeof pageSchema>;
export type FundingInput = z.infer<typeof fundingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdInput = z.infer<typeof adSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
