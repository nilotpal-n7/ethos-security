import { User } from "@/models/user";

export interface ApiResponse {
    success: boolean;
    message: string;
    user?: User;
    users?: Array<User>;
    id?: string;
}
