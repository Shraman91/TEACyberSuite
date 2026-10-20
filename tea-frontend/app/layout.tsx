import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import Providers from "./providers";


const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TEA Cipher Suite",
  description: "A cyberpunk playground for the Tiny Encryption Algorithm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${syne.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#090014] text-purple-200">
        <Providers>
          <nav className="border-b border-purple-500/20 bg-black/40 backdrop-blur-md p-4 px-8 flex justify-between items-center z-10 relative shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
            <a href="/" className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 font-bold tracking-wider hover:opacity-80 transition-opacity">
              TEA Cipher Suite
            </a>
            <div className="flex gap-6 text-sm uppercase tracking-widest font-bold">
              <a href="/dashboard" className="text-purple-300/70 hover:text-fuchsia-400 transition-colors">
                Playground
              </a>
              <a href="/chat" className="text-purple-300/70 hover:text-fuchsia-400 transition-colors">
                Encrypted Chat
              </a>
              <a href="/auth" className="text-purple-300/70 hover:text-fuchsia-400 transition-colors">
                Auth
              </a>
            </div>
          </nav>
          <main className="flex-1 relative z-10 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
