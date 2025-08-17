import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    debug: process.env.NODE_ENV === "development",

    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("Login attempt by:", credentials);

                if (!credentials?.email || !credentials.password) {
                    throw new Error("Missing credentials");
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user) {
                        console.log("User not found");
                        throw new Error("Invalid email or password");
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isValid) {
                        console.log("Invalid credentials");
                        throw new Error("Invalid email or password");
                    }

                    console.log("Login successful");
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    throw new Error("Authentication failed");
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/signin",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
};
