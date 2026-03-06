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
    Sparkles,
    Settings,
    Share2
} from "lucide-react";
import Link from "next/link";
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

    const handleShare = async () => {
        const shareData = {
            title: "CAL.AI - 인공지능 캘린더",
            text: "목소리로 일정을 관리하는 가장 스마트한 방법, AI Calendar Assistant를 사용해 보세요!",
            url: window.location.origin,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                alert("앱 링크가 클립보드에 복사되었습니다! 친구들에게 공유해 보세요.");
            }
        } catch (err) {
            console.error("공유하기 실패:", err);
        }
    };

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
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100 flex flex-col items-center text-center gap-8 border border-white">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-xl shadow-indigo-200">
                        <Calendar className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">CAL.AI</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            목소리로 일정을 관리하는<br />가장 스마트한 방법
                        </p>
                    </div>
                    <button
                        onClick={() => signIn("google")}
                        className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 font-bold shadow-lg shadow-gray-200"
                    >
                        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        Google로 시작하기
                    </button>
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
                        onClick={handleShare}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all active:scale-90"
                        title="Share App"
                    >
                        <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <Link
                        href="/settings"
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="p-2 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
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
