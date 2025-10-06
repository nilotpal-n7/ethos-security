import { Resend } from "resend"
import VerificationEmail from "@/lib/VerificationEmail"
import { ApiResponse } from "@/types/ApiResponse"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(
    username: string,
    email: string,
    otp: string,
    before: Date,
): Promise<ApiResponse> {
    
    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Verification Code',
            react: VerificationEmail({username, otp, before})
        })
        console.log("Resend response", response)

        return {success: true, message: "Verification email send successfully."}
    } catch (error) {
        console.error("Error sending verification email", error)
        return {success: false, message: "Failed to send verification email"}
    }
}
