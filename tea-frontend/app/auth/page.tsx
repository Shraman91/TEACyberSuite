"use client";

import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function AuthPage() {
  const router = useRouter();
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  const handleGoogle = async () => {
    setIsLoading(true);
    setErr(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (e: any) {
      const code = e?.code as string | undefined;
      if (code === "auth/configuration-not-found") {
        setErr(
          "Google sign-in is not enabled in Firebase. Open Firebase Console → Authentication → Sign-in method → Google → Enable, then try again."
        );
      } else if (code === "auth/unauthorized-domain") {
        setErr(
          "This domain is not authorized. Add localhost to Firebase Console → Authentication → Settings → Authorized domains."
        );
      } else {
        setErr(e?.message ?? "Google sign-in failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setErr(null);
    try {
      await signOut(auth);
    } catch (e: any) {
      setErr(e?.message ?? "Sign out failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="w-full max-w-lg border border-purple-500/30 bg-black/60 p-8 md:p-10 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] relative">
        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-tight">
          Authenticate
        </h2>
        <p className="mt-3 text-sm text-purple-200/70 leading-relaxed">
          Sign in with Google to access the TEA playground and encrypted chatrooms.
        </p>

        {err && (
          <div className="mt-6 border border-red-500/40 bg-red-500/10 p-4 rounded-xl text-xs text-red-300 font-mono shadow-inner shadow-red-500/20">
            {err}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {!user ? (
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold uppercase tracking-widest rounded-xl hover:from-fuchsia-500 hover:to-purple-500 shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>
          ) : (
            <>
              <div className="border border-purple-500/30 p-4 bg-black/40 rounded-xl text-sm flex items-center gap-4 shadow-inner">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="h-12 w-12 rounded-full border-2 border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border-2 border-purple-500/50 bg-purple-900/30" />
                )}
                <div className="flex flex-col">
                  <div className="text-white font-bold text-base">{user.displayName ?? "User"}</div>
                  <div className="text-xs text-purple-300/70 font-mono mt-0.5">{user.email ?? user.uid}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3.5 border border-fuchsia-500/50 text-fuchsia-300 font-bold uppercase tracking-widest rounded-xl hover:bg-fuchsia-500/10 transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full py-3.5 border border-red-500/40 text-red-400 font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-[11px] text-purple-300/40 text-center px-4">
          If sign-in fails, ensure your Firebase web config is set in `NEXT_PUBLIC_FIREBASE_*` env vars.
        </div>
      </div>
    </div>
  );
}

