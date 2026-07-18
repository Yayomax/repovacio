import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * El botón de Google solo se habilita si las credenciales OAuth existen.
 * Consulta PASOS-EXTERNOS.md para conseguirlas.
 */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

/**
 * Configuración compatible con Edge (la usa el middleware).
 * Todo lo que toca la base de datos (Prisma, bcrypt) vive en src/auth.ts.
 */
export default {
  providers: googleEnabled ? [Google] : [],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isAdmin = auth?.user?.role === "ADMIN";
      const { pathname } = nextUrl;

      if (pathname.startsWith("/welcome")) return isLoggedIn;

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return Response.redirect(new URL("/welcome", nextUrl));
        return true;
      }

      if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
        return Response.redirect(new URL("/welcome", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role as "USER" | "ADMIN" | undefined) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
