// app/layout.tsx
import "./globals.css";
import Navbar from "@/components/Navbar";     // 👈 monta la barra acá
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
        <Navbar /> 
        <Toaster richColors position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
