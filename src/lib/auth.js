import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createNotification } from "@/utils/createNotification";
import { encode as encodeJWT, decode as decodeJWT } from "next-auth/jwt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
        rememberMe: {
          label: "Remember Me",
          type: "text",
        },
      },

      async authorize(credentials) {
        try {
          await connectDB();

          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;
          const rememberMe =
            credentials?.rememberMe === "true" ||
            credentials?.rememberMe === true;

          if (!email || !password) {
            throw new Error("Invalid email or password.");
          }

          const user = await User.findOne({ email });

          if (!user) {
            throw new Error("Invalid email or password.");
          }

          if (user.isActive === false) {
            throw new Error("ACCOUNT_DEACTIVATED");
          }

          // Check whether the account is temporarily locked.
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error("ACCOUNT_TEMPORARILY_LOCKED");
          }

          // Reset an expired lockout.
          if (user.lockedUntil && user.lockedUntil <= new Date()) {
            user.failedLoginAttempts = 0;
            user.lockedUntil = null;
            await user.save();
          }

          const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password,
          );

          if (!isPasswordCorrect) {
            console.log("FAILED LOGIN:", user.email);
            console.log("ATTEMPTS BEFORE UPDATE:", user.failedLoginAttempts);
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            user.lastFailedLoginAt = new Date();

            // Lock the account after five failed attempts.
            if (user.failedLoginAttempts === 5) {
              user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

              // Notify active administrators.
              try {
                const admins = await User.find({
                  role: "admin",
                  isActive: true,
                }).select("_id");

                for (const admin of admins) {
                  await createNotification({
                    recipient: admin._id,
                    type: "security_alert",
                    title: "Account Temporarily Locked",
                    message: `Account ${user.email} was temporarily locked after 5 failed login attempts.`,
                    link: "/admin/users",
                    metadata: {
                      userId: user._id,
                      email: user.email,
                      failedAttempts: user.failedLoginAttempts,
                      lockedUntil: user.lockedUntil,
                    },
                    sendEmailNotification: true,
                  });
                }
              } catch (notificationError) {
                console.error(
                  "Security notification error:",
                  notificationError,
                );
              }
            }

            await user.save();

            console.log("ATTEMPTS AFTER UPDATE:", user.failedLoginAttempts);
            console.log("LOCKED UNTIL:", user.lockedUntil);

            throw new Error(
              user.lockedUntil
                ? "ACCOUNT_TEMPORARILY_LOCKED"
                : "Invalid email or password.",
            );
          }

          // Reset failed attempts after successful login.
          user.failedLoginAttempts = 0;
          user.lastFailedLoginAt = null;
          user.lockedUntil = null;
          await user.save();

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            rememberMe,
          };
        } catch (error) {
          console.error("AUTH ERROR:", error.message);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    async encode({ token, secret }) {
      const maxAge = token?.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

      return encodeJWT({
        token,
        secret,
        maxAge,
      });
    },

    async decode({ token, secret }) {
      return decodeJWT({
        token,
        secret,
      });
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.rememberMe = user.rememberMe;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
