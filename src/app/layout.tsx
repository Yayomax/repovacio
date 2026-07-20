import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { appName } from "@/lib/brand";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover habilita env(safe-area-inset-*) en iPhone
  viewportFit: "cover",
  themeColor: "#060606",
};

export const metadata: Metadata = {
  title: {
    default: `${appName} — Portal de acceso`,
    template: `%s · ${appName}`,
  },
  description:
    "Base white-label de autenticación y gestión de usuarios: Docker, PostgreSQL, Auth.js y diseño minimalista en blanco y negro.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
