import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "EVIDENTIA — Zero-Trust, Tamper-Evident Digital Evidence Management",
  description:
    "Every Record. Every Handoff. Verifiable. A secure, auditable, Git-inspired platform for registering, verifying, versioning, and transferring digital evidence without overwriting originals.",
  keywords: [
    "digital evidence",
    "forensics",
    "chain of custody",
    "tamper evident",
    "git for evidence",
    "merkle tree",
    "ed25519",
    "judicial audit",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F9F9FA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="flex min-h-screen flex-col bg-[#F9F9FA] text-[#111111] antialiased selection:bg-[#111111] selection:text-[#FFFFFF]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
