"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    LogOut,
    RotateCcw,
    Calendar,
    MessageSquare,
    Mic,
    AlertCircle,
    Save,
    Sparkles
} from "lucide-react";
import EventList from "@/components/EventList";
import VoiceInput from "@/components/VoiceInput";
import TextInput from "@/components/TextInput";
import EventPreviewCard from "@/components/EventPreviewCard";
import { parseToDraft, EventDraft } from "@/services/nlpParser";

export default function Home() {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New states for Sprint 3
    const [inputMode, setInputMode] = useState<"text" | "voice">("voice");
    const [rawText, setRawText] = useState("");
    const [draft, setDraft] = useState<EventDraft | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchEvents = useCallback(async () => {
        if (status !== "authenticated") return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/calendar/list");
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "일정을 불러오지 못했습니다.");
            setEvents(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleParse = useCallback(() => {
        if (!rawText.trim()) return;
        const { draft: newDraft, error } = parseToDraft(rawText);
        if (error) {
            setParseError(error);
            setDraft(null);
        } else if (newDraft) {
            setDraft(newDraft);
            setParseError(null);
        }
    }, [rawText]);

    const handleVoiceTranscript = useCallback((text: string) => {
        setRawText(text);
        const { draft, error } = parseToDraft(text);
        if (draft) setDraft(draft);
        if (error) setParseError(error);
    }, []);

    const handleSave = async () => {
        if (!draft) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/calendar/create", {
                method: "POST",
                body: JSON.stringify({ draft }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            alert("캘린더에 저장했어요! ✅");
            setRawText("");
            setDraft(null);
            fetchEvents();
        } catch (err: any) {
            alert(err.message || "저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-indigo-600 font-bold animate-pulse">CAL.AI 준비 중...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden p-6">
                {/* Background Decorations */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px] animate-pulse" />

                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/40 backdrop-blur-2xl rounded-[60px] shadow-2xl shadow-indigo-100/50 border border-white/60 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-700">
                    {/* Left Side: Visual Hero */}
                    <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-12 flex flex-col items-center justify-center text-center gap-10 overflow-hidden group">
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                        </div>
                        
                        <div className="relative z-10 animate-in slide-in-from-bottom-8 duration-1000">
                            <img 
                                src="/images/hero_login.png" 
                                alt="CAL.AI Hero" 
                                className="w-full max-w-[340px] drop-shadow-[0_25px_25px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-700"
                                onError={(e) => {
                                    (e.target as any).src = "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800";
                                }}
                            />
                        </div>

                        <div className="space-y-4 relative z-10 text-white animate-in slide-in-from-bottom-6 duration-1000">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">AI Powered Workspace</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight leading-tight">
                                일정을 말하세요.<br/>나머지는 AI가 할게요.
                            </h2>
                        </div>
                    </div>

                    {/* Right Side: Login Action */}
                    <div className="p-12 lg:p-20 flex flex-col items-center justify-center text-center gap-12 bg-white/40">
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-indigo-600 p-5 rounded-[32px] shadow-2xl shadow-indigo-200 rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                                    <Calendar className="w-12 h-12 text-white" />
                                </div>
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-indigo-200 decoration-8 underline-offset-[-2px]">
                                    CAL.AI
                                </h1>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-xl font-bold text-slate-600 leading-relaxed">
                                    가장 스마트한 <span className="text-indigo-600">음성 캘린더</span>
                                </p>
                                <p className="text-sm font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                    목소리 하나로 당신의 소중한 시간을<br/>더 완벽하게 관리해보세요.
                                </p>
                            </div>
                        </div>

                        <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                            <button
                                onClick={() => signIn("google")}
                                className="group w-full h-20 bg-slate-900 hover:bg-black text-white rounded-[28px] flex items-center justify-center gap-5 transition-all active:scale-95 font-black text-lg shadow-2xl shadow-slate-200"
                            >
                                <div className="bg-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                    <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                                </div>
                                Google 계정으로 시작하기
                            </button>
                            
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                Safe & Secure Google Authentication
                            </p>
                        </div>

                        {/* Footer Link */}
                        <div className="absolute bottom-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">
                            Powered by Eun035
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isDraftValid = draft && new Date(draft.startISO) < new Date(draft.endISO);

    return (
        <main className="min-h-screen bg-[#F0F4F8] pb-20">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-indigo-900 tracking-tighter uppercase italic">Cal.AI</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden xs:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</span>
                        <span className="text-xs font-bold text-gray-800">{session?.user?.name}</span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                        title="Sign Out"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 pt-8 space-y-10">
                {/* Input Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-1 md:px-2 gap-1 sm:gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 whitespace-nowrap tracking-tight">
                                일정추가
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400 font-medium hidden md:block md:ml-2 mb-[-2px] whitespace-nowrap shrink-0">
                                말하거나 적어주세요
                            </p>
                        </div>
                        <div className="flex bg-gray-100 p-1.5 sm:p-2 rounded-2xl shrink-0 items-center">
                            <button
                                onClick={() => setInputMode("voice")}
                                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 h-full ${inputMode === "voice" ? "bg-white text-indigo-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                                음성
                            </button>
                            <button
                                onClick={() => setInputMode("text")}
                                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-1.5 h-full ${inputMode === "text" ? "bg-white text-indigo-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                텍스트
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-8 rounded-[32px] shadow-xl shadow-indigo-100/50 border border-white flex flex-col gap-6">
                        {inputMode === "voice" ? (
                            <VoiceInput onTranscript={handleVoiceTranscript} />
                        ) : (
                            <TextInput value={rawText} onChange={setRawText} onParse={handleParse} />
                        )}

                        {parseError && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-semibold">{parseError}</p>
                            </div>
                        )}

                        {draft && (
                            <div className="mt-4 flex flex-col gap-6">
                                <EventPreviewCard draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
                                <button
                                    onClick={handleSave}
                                    disabled={!isDraftValid || isSaving}
                                    className="w-full h-16 bg-black disabled:bg-gray-300 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-200"
                                >
                                    {isSaving ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-6 h-6" />
                                            이대로 저장하기
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* List Section */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                            다가오는 일정
                        </h2>
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all active:rotate-180 duration-500"
                            title="Refresh"
                        >
                            <RotateCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {error ? (
                        <div className="bg-red-50 text-red-600 p-6 rounded-[32px] flex flex-col items-center gap-4 text-center border border-red-100">
                            <AlertCircle className="w-10 h-10" />
                            <div className="space-y-1">
                                <p className="font-black">문제가 발생했습니다</p>
                                <p className="text-sm font-bold opacity-80">{error}</p>
                            </div>
                            <button
                                onClick={fetchEvents}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : loading && events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-indigo-600 font-black animate-pulse tracking-wide uppercase">이벤트 동기화 중...</p>
                        </div>
                    ) : (
                        <EventList events={events} onChanged={fetchEvents} />
                    )}
                </section>
            </div>
        </main>
    );
}
