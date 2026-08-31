import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "./context/UserContext";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Arcade Vault",
  description: "Online gaming platform — play and compete for points",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <div className="av-bg" />
          <div className="av-noise" />
          <Nav />
          <main className="av-main" style={{ position: 'relative', zIndex: 2 }}>{children}</main>
          <footer style={{ borderTop: '1px solid var(--line)', padding: '20px 32px', textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em' }}>
            © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
