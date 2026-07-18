import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protege todo excepto assets estáticos y las rutas internas de la API de auth.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
