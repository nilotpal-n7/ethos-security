import * as z from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email or username is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
  code: z
    .string().length(6, "Code must be of 6 digits"),
});


export type SignInType = z.infer<typeof signInSchema>
