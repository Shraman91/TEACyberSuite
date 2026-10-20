import Link from "next/link";
import AutoRedirect from "./ui/auto-redirect";

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <AutoRedirect to="/auth" delayMs={1200} />
      <div className="w-full max-w-4xl border border-purple-500/30 bg-black/60 p-10 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl pointer-events-none"></div>
        <div className="flex flex-col gap-8 relative z-10">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-fuchsia-400 font-bold mb-2">
              CNT Project
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-tight">
              TEA Cipher Suite
            </h2>
            <p className="mt-6 text-base text-purple-200/70 max-w-2xl leading-relaxed">
              Explore the Tiny Encryption Algorithm and use it to create end-to-end encrypted chatrooms.
              You’ll authenticate with Google next.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/auth"
              className="px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold uppercase tracking-widest rounded-xl hover:from-fuchsia-500 hover:to-purple-500 shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all transform hover:-translate-y-1 text-center"
            >
              Continue to Auth
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border border-fuchsia-500/50 text-fuchsia-300 font-bold uppercase tracking-widest rounded-xl hover:bg-fuchsia-500/10 transition-all text-center"
            >
              View Playground
            </Link>
            <Link
              href="/chat"
              className="px-8 py-4 border border-purple-500/50 text-purple-300 font-bold uppercase tracking-widest rounded-xl hover:bg-purple-500/10 transition-all text-center"
            >
              Encrypted Chat
            </Link>
          </div>

          <div className="mt-4 text-[11px] text-purple-300/50 font-mono uppercase tracking-widest bg-black/40 inline-block self-start px-4 py-2 rounded-lg border border-purple-500/20">
            Tip: Chat history is only readable with the correct room key.
          </div>
        </div>
      </div>
    </div>
  );
}
