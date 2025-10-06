import { Types } from 'mongoose';
import 'next-auth'
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface User {
        _id?: Types.ObjectId;
        firstName?: string;
        lastName?: string;
        email?: string;
    }

    interface Session {
        user: {
            _id?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
        } & DefaultSession['user']
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    }
}
