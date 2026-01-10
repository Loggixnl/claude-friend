import { z } from "zod";

// Standalone password schema for password reset
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["talker", "listener"], {
      message: "Please select a role",
    }),
    languageCode: z.string().min(2, "Please select a language"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const callRequestSchema = z.object({
  listenerId: z.string().uuid("Invalid listener ID"),
  description: z
    .string()
    .min(100, "Description must be at least 100 characters")
    .max(2000, "Description must be at most 2000 characters"),
});

export type CallRequestFormData = z.infer<typeof callRequestSchema>;

export const ratingSchema = z.object({
  callSessionId: z.string().uuid("Invalid session ID"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

export type RatingFormData = z.infer<typeof ratingSchema>;

export const misconductReportSchema = z.object({
  callSessionId: z.string().uuid("Invalid session ID"),
  reportedId: z.string().uuid("Invalid user ID"),
  category: z.enum(["harassment", "hate", "sexual_content", "scam", "other"], {
    message: "Please select a category",
  }),
  note: z
    .string()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .nullable(),
});

export type MisconductReportFormData = z.infer<typeof misconductReportSchema>;

export const updatePresenceSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export type UpdatePresenceFormData = z.infer<typeof updatePresenceSchema>;
