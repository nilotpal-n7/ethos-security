import * as z from "zod";

export const signUpSchema = z.object({
    firstName: z
      .string()
      .min(1),
    lastName: z
      .string()
      .min(1),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
})

export type SignUpType = z.infer<typeof signUpSchema>
