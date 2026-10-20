"use client";

import { useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [plaintext, setPlaintext] = useState("");
  const [keyHex, setKeyHex] = useState("00000000000000000000000000000000");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [result, setResult] = useState("");
  const [timeUs, setTimeUs] = useState(0);
  const [rounds, setRounds] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const generateKey = () => {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    setKeyHex(Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setCurrentRound(-1);
    try {
      const endpoint = mode === "encrypt" ? "encrypt" : "decrypt";
      const payload = mode === "encrypt" 
        ? { plaintext, key: keyHex } 
        : { ciphertext: plaintext, key: keyHex };

      const res = await axios.post(`http://localhost:8000/encrypt/${endpoint}`, payload);
      setResult(res.data.result);
      setTimeUs(res.data.time_us);
      setRounds(res.data.rounds);

      // Animate rounds
      for (let i = 0; i < res.data.rounds.length; i++) {
        await new Promise(r => setTimeout(r, 100)); // slightly faster animation
        setCurrentRound(i);
      }
    } catch (e) {
      console.error(e);
      setResult("Error executing algorithm.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row p-4 lg:p-8 gap-8 min-h-[calc(100vh-80px)] bg-[#090014] text-gray-200 font-sans">
      
      {/* Left Panel: Input & Config */}
      <div className="w-full lg:w-1/4 flex flex-col gap-6 relative">
        {/* Glow behind panel */}
        <div className="absolute -inset-1 bg-gradient-to-b from-purple-600 to-fuchsia-600 rounded-3xl blur-xl opacity-20 pointer-events-none"></div>
        
        <div className="relative border border-purple-500/30 p-6 bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col h-full z-10">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-wide">
            Operation Center
          </h2>
          
          <div className="flex-1 flex flex-col gap-5">
            <div className="group">
              <label className="block text-xs uppercase tracking-widest text-purple-300/70 mb-2 group-focus-within:text-fuchsia-400 transition-colors">
                {mode === "encrypt" ? "Plaintext Input" : "Ciphertext (Hex)"}
              </label>
              <textarea 
                className="w-full h-32 bg-black/50 border border-purple-500/40 rounded-xl p-4 text-purple-200 font-mono text-sm focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 transition-all resize-none shadow-inner"
                placeholder={mode === "encrypt" ? "Enter your secret message..." : "Enter hex ciphertext..."}
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
              />
            </div>
            
            <div className="group">
              <label className="block text-xs uppercase tracking-widest text-purple-300/70 mb-2 group-focus-within:text-fuchsia-400 transition-colors">
                128-bit Key (Hex)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-purple-500/40 rounded-xl p-3 text-fuchsia-300 font-mono text-sm focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/50 transition-all shadow-inner"
                  value={keyHex}
                  onChange={(e) => setKeyHex(e.target.value)}
                  maxLength={32}
                />
                <button 
                  onClick={generateKey}
                  title="Generate Random Key"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600/20 hover:bg-fuchsia-500/30 text-fuchsia-300 rounded-lg transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 1 0-9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex bg-black/40 rounded-xl p-1 border border-purple-500/20">
              <button 
                onClick={() => setMode("encrypt")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${mode === 'encrypt' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md' : 'text-purple-400 hover:bg-purple-500/10'}`}
              >
                Encrypt
              </button>
              <button 
                onClick={() => setMode("decrypt")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${mode === 'decrypt' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md' : 'text-purple-400 hover:bg-purple-500/10'}`}
              >
                Decrypt
              </button>
            </div>
          </div>

          <button 
            onClick={handleRun}
            disabled={isRunning || !plaintext}
            className="w-full mt-6 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer transform active:scale-[0.98]"
          >
            {isRunning ? "Processing..." : "Initialize TEA"}
          </button>
        </div>
      </div>

      {/* Center Panel: Visualization */}
      <div className="flex-1 flex flex-col relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 rounded-3xl blur-xl opacity-10 pointer-events-none"></div>
        
        <div className="relative border border-purple-500/30 bg-black/60 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col h-full z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                TEA Engine Visualizer
              </h2>
              <div className="text-sm text-purple-300/60 font-mono mt-1 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
                64-bit Feistel Network · 32 Rounds
              </div>
            </div>
            
            {rounds.length > 0 && (
              <div className="flex gap-2 bg-black/50 p-1 rounded-xl border border-purple-500/20">
                <button
                  onClick={() => setCurrentRound((r) => Math.max(0, r - 1))}
                  className="px-4 py-2 rounded-lg text-purple-300 hover:bg-purple-600/30 hover:text-white uppercase text-xs font-bold transition-all cursor-pointer"
                >
                  &larr; Prev
                </button>
                <div className="px-3 py-2 font-mono text-fuchsia-400 font-bold bg-purple-900/20 rounded-lg">
                  {currentRound >= 0 ? currentRound + 1 : 0} / 32
                </div>
                <button
                  onClick={() => setCurrentRound((r) => Math.min(rounds.length - 1, r + 1))}
                  className="px-4 py-2 rounded-lg text-purple-300 hover:bg-purple-600/30 hover:text-white uppercase text-xs font-bold transition-all cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>

          {rounds.length > 0 ? (
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
              
              {/* Main Visualization View */}
              <div className="flex flex-col">
                <div className="flex-1 bg-black/40 rounded-2xl border border-purple-500/20 p-6 relative overflow-hidden group">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
                  
                  {currentRound >= 0 && (
                    <div className="relative z-10 h-full flex flex-col justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 relative">
                        
                        {/* Connecting lines in background (desktop only) */}
                        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-500/0 via-fuchsia-500/50 to-purple-500/0 -translate-y-1/2 z-0"></div>

                        {/* V0 Box */}
                        <div className="bg-[#0f0518] border border-purple-500/40 rounded-2xl p-6 shadow-lg shadow-purple-900/20 relative z-10 transform transition-transform hover:-translate-y-1 duration-300">
                          <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-900 border border-purple-500/50 rounded-full text-[10px] uppercase tracking-widest text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                            Left Block (V0)
                          </div>
                          <div className="mt-4 text-2xl sm:text-3xl font-mono text-purple-100 break-all text-center tracking-wider">
                            0x{rounds[currentRound].v0}
                          </div>
                        </div>
                        
                        {/* V1 Box */}
                        <div className="bg-[#0f0518] border border-fuchsia-500/40 rounded-2xl p-6 shadow-lg shadow-fuchsia-900/20 relative z-10 transform transition-transform hover:-translate-y-1 duration-300">
                          <div className="absolute -top-3 left-6 px-3 py-1 bg-fuchsia-900 border border-fuchsia-500/50 rounded-full text-[10px] uppercase tracking-widest text-fuchsia-200 font-bold shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                            Right Block (V1)
                          </div>
                          <div className="mt-4 text-2xl sm:text-3xl font-mono text-fuchsia-100 break-all text-center tracking-wider">
                            0x{rounds[currentRound].v1}
                          </div>
                        </div>
                      </div>

                      {/* Sum Box */}
                      <div className="mt-12 md:mt-16 mx-auto w-full max-w-md">
                        <div className="bg-gradient-to-b from-[#180524] to-[#0f0518] border border-purple-400/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative text-center group-hover:border-purple-400/50 transition-colors">
                          <div className="text-xs uppercase tracking-[0.2em] text-purple-300/80 mb-3">Accumulated Sum</div>
                          <div className="font-mono text-white text-xl sm:text-2xl font-bold tracking-widest text-shadow-sm">
                            0x{rounds[currentRound].sum}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline Scrubber */}
                <div className="mt-6 bg-black/40 border border-purple-500/20 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                  <div className="flex justify-between text-xs font-mono text-purple-300 mb-3 uppercase tracking-wider font-bold">
                    <span>Round 1</span>
                    <span>Round 32</span>
                  </div>
                  <div className="relative group">
                    <input
                      type="range"
                      min={0}
                      max={rounds.length - 1}
                      value={Math.max(0, currentRound)}
                      onChange={(e) => setCurrentRound(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(217,70,239,0.8)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                    />
                    {/* Custom progress track */}
                    <div 
                      className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-l-lg pointer-events-none"
                      style={{ width: `${rounds.length > 1 ? (Math.max(0, currentRound) / (rounds.length - 1)) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Rounds List */}
              <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 flex flex-col h-full max-h-[600px] xl:max-h-none">
                <div className="text-xs uppercase tracking-widest text-fuchsia-400 font-bold mb-4 px-2">Execution Log</div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {rounds.map((r, idx) => (
                    <button
                      key={r.round}
                      onClick={() => setCurrentRound(idx)}
                      className={`w-full text-left p-3 rounded-xl border font-mono text-xs transition-all cursor-pointer ${
                        idx === currentRound
                          ? "border-fuchsia-500 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 text-white shadow-[inset_4px_0_0_rgba(217,70,239,1)]"
                          : "border-purple-500/10 bg-black/40 text-purple-200/60 hover:bg-purple-900/30 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`font-bold ${idx === currentRound ? 'text-fuchsia-300' : ''}`}>Round {r.round}</span>
                        <span className="opacity-60 text-[10px]">sum {r.sum.substring(0,4)}...</span>
                      </div>
                      <div className="text-[10px] break-all opacity-70 leading-relaxed">
                        v0: {r.v0}<br/>v1: {r.v1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-purple-500/20 rounded-2xl bg-black/20 text-purple-400/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <div className="text-sm uppercase tracking-[0.2em] font-bold">Awaiting Initialization</div>
              <div className="text-xs mt-2 opacity-60">Enter parameters and run TEA to visualize</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full lg:w-1/4 flex flex-col relative">
        <div className="absolute -inset-1 bg-gradient-to-b from-purple-600 to-fuchsia-600 rounded-3xl blur-xl opacity-20 pointer-events-none"></div>
        
        <div className="relative border border-purple-500/30 p-6 bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col h-full z-10">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-wide">
            Output Stream
          </h2>
          
          <div className="flex-1 flex flex-col">
            <label className="block text-xs uppercase tracking-widest text-purple-300/70 mb-2">
              Result Data
            </label>
            <div className="flex-1 bg-black/50 border border-purple-500/40 rounded-xl p-4 text-fuchsia-300 font-mono text-sm break-all shadow-inner overflow-y-auto min-h-[150px] flex items-start">
              {result ? (
                <span className="animate-pulse-slow">{result}</span>
              ) : (
                <span className="text-purple-500/40 italic">
                  {isRunning ? "Processing blocks..." : "No data received."}
                </span>
              )}
            </div>
          </div>
          
          {timeUs > 0 && (
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/20 rounded-xl flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-purple-300/80 font-bold">Execution Time</span>
              <span className="font-mono text-fuchsia-400 font-bold shadow-fuchsia-400/50 drop-shadow-md">
                {timeUs.toFixed(2)} µs
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 70, 239, 0.6);
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
