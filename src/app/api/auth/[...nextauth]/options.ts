// app/api/auth/[...nextauth]/options.ts

import dbConnect from "@/server/db";
import UserModel from "@/models/user";
import bcrypt from "bcryptjs";
import { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import QRTokenModel from "@/models/qrToken";

type CredentialsType = {
  email?: string;
  password?: string;
  code?: string;
  tokenId?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        code: { label: 'Code', type: 'text' },
        tokenId: { label: 'Token ID', type: 'text' }
      },
      async authorize(credentials): Promise<User> {
        await dbConnect();
        console.log("🛂 Authorize called with:", credentials);

        if (!credentials) {
          throw new Error("Missing credentials");
        }

        const { email, password, code, tokenId } = credentials as CredentialsType;

        // QR login logic (userId + tokenId)
        if (tokenId && !email && !password && !code) {
          console.log("🔍 Handling QR login with tokenId:", tokenId);
          const token = await QRTokenModel.findOne({_id: tokenId})

          if (!token) {
            throw new Error("QR token is invalid");
          } 
          
          if(token.expiry < new Date()) {
            await QRTokenModel.deleteOne({_id: tokenId})
            throw new Error("QR token has expired");
          }

          if (token.status === 'pending') {
            throw new Error("QR token is not approved");
          }

          const user = await UserModel.findById(token.userId).lean();
          if (!user) {
            await QRTokenModel.deleteOne({_id: tokenId})
            throw new Error("User not found");
          }

          await QRTokenModel.deleteOne({_id: tokenId})
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, verifyCode: __, verifyCodeExpiry: ___, ...safeUser } = user;
          return safeUser as User;
        }

        // 🔐 Normal Login (Email + Password + Code)
        const user = await UserModel.findOne({ email }).lean();
        if (!user) throw new Error("User not found");

        const isPasswordCorrect = await bcrypt.compare(password!, user.password);
        const isCodeCorrect = code === user.verifyCode;
        const isCodeExpired = new Date(user.verifyCodeExpiry) < new Date();

        if (!isPasswordCorrect) throw new Error("Incorrect password.");
        if (!isCodeCorrect) throw new Error("Verification code mismatch.");
        if (isCodeExpired) throw new Error("Code has expired.");

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, verifyCode: __, verifyCodeExpiry: ___, ...safeUser } = user;
        return safeUser as User;
      }
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT, user?: User }) {
      if (user) {
        token._id = user._id?.toString();
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token) {
        session.user._id = token._id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.email = token.email;
      }
      return session;
    }
  },

  pages: {
    signIn: '/sign-in',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
