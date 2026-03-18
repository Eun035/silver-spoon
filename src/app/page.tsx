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
    Bell,
    Type
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

    // --- [NEW] Alarm & Notification System ---
    const testNotification = useCallback(() => {
        if (!("Notification" in window)) {
            alert("이 브라우저는 알림 기능을 지원하지 않습니다.");
            return;
        }

        const playAlarmSound = () => {
            try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.volume = 0.5;
                audio.play();
            } catch (e) {
                console.error("Audio play failed:", e);
            }
        };

        if (Notification.permission === "granted") {
            playAlarmSound();
            new Notification("🔔 테스트 알림", {
                body: "알림이 정상적으로 작동하고 있습니다!",
                icon: "/icon-192x192.png",
            });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    playAlarmSound();
                    new Notification("✅ 권한 허용 완료", {
                        body: "이제 알림을 받으실 수 있습니다.",
                        icon: "/icon-192x192.png",
                    });
                }
            });
        } else {
            alert("알림 권한이 거부되어 있습니다. 브라우저 설정에서 권한을 허용해 주세요.");
        }
    }, []);

    // 1. Request Notification Permission
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // 2. Background Alarm Monitor
    useEffect(() => {
        if (status !== "authenticated" || !events || events.length === 0) return;

        const checkAlarms = () => {
            const now = new Date();
            
            events.forEach((event: any) => {
                const startTime = new Date(event.start.dateTime || event.start.date);
                if (isNaN(startTime.getTime())) return;

                // Respect event-specific reminders, default to 30 if none
                const eventReminders = event.reminders && event.reminders.length > 0 ? event.reminders : [30];

                eventReminders.forEach((minutes: number) => {
                    const alarmTime = new Date(startTime.getTime() - minutes * 60000);
                    const diff = now.getTime() - alarmTime.getTime();

                    // Key for tracking notified state
                    const alarmKey = `notified-${event.id}-${minutes}`;
                    // Use localStorage for persistence across tab closes/refreshes
                    const alreadyNotified = localStorage.getItem(alarmKey);

                    // If we are within 2 minutes of the alarm time and haven't notified yet
                    if (diff >= 0 && diff < 120000 && !alreadyNotified) {
                        const message = minutes === 0 ? "일정이 지금 시작됩니다!" : `${minutes}분 전입니다.`;
                        
                        // Visual & Audio Notification
                        if ("Notification" in window && Notification.permission === "granted") {
                            try {
                                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                                audio.volume = 0.5;
                                audio.play();
                            } catch (e) {}

                            new Notification(`📅 [${event.summary}] 일정 알림`, {
                                body: `${message}${event.location ? `\n장소: ${event.location}` : ""}`,
                                icon: "/icon-192x192.png",
                                tag: event.id + minutes,
                                requireInteraction: true,
                            });

                            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
                        } else {
                            alert(`⏰ [알람] ${event.summary}\n${message}`);
                        }
                        
                        localStorage.setItem(alarmKey, "true");
                    }
                });
            });
            
            // Cleanup old notified flags (older than 1 day) to prevent storage bloat
            const oneDayAgo = now.getTime() - 86400000;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith("notified-")) {
                    // Note: We don't store timestamp, so just a simple cleanup for very old ones could be added later
                    // For now, keeping them is safer than premature deletion.
                }
            }
        };

        const interval = setInterval(checkAlarms, 20000); // Check every 20 seconds
        return () => clearInterval(interval);
    }, [events, status]);
    // ------------------------------------------

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

                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/40 backdrop-blur-2xl rounded-[40px] sm:rounded-[60px] shadow-2xl shadow-indigo-100/50 border border-white/60 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-700">
                    {/* Left Side: Visual Hero */}
                    <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-6 sm:p-12 flex flex-col items-center justify-center text-center gap-4 sm:gap-10 overflow-hidden group">
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                        </div>
                        
                        <div className="relative z-10 animate-in slide-in-from-bottom-8 duration-1000">
                            <img 
                                src="/images/hero_login.png" 
                                alt="CAL.AI Hero" 
                                className="w-full max-w-[180px] sm:max-w-[340px] drop-shadow-[0_25px_25px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-700"
                                onError={(e) => {
                                    (e.target as any).src = "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800";
                                }}
                            />
                        </div>

                        <div className="space-y-2 sm:space-y-4 relative z-10 text-white animate-in slide-in-from-bottom-6 duration-1000">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/20">
                                <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-300 fill-yellow-300" />
                                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/90">AI Powered Workspace</span>
                            </div>
                            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight px-4">
                                일정을 말하세요.<br/>나머지는 AI가 할게요.
                            </h2>
                        </div>
                    </div>

                    {/* Right Side: Login Action */}
                    <div className="p-6 lg:p-20 flex flex-col items-center justify-center text-center gap-6 sm:gap-12 bg-white/40">
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-2 sm:gap-4">
                                <div className="bg-indigo-600 p-3 sm:p-5 rounded-[20px] sm:rounded-[32px] shadow-2xl shadow-indigo-200 rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                                    <Calendar className="w-6 h-6 sm:w-12 sm:h-12 text-white" />
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-indigo-200 decoration-8 underline-offset-[-2px]">
                                    CAL.AI
                                </h1>
                            </div>
                            
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-base sm:text-xl font-bold text-slate-600 leading-relaxed px-4">
                                    가장 스마트한 <span className="text-indigo-600">음성 캘린더</span>
                                </p>
                                <p className="text-[10px] sm:text-sm font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed px-4">
                                    목소리 하나로 당신의 소중한 시간을<br/>더 완벽하게 관리해보세요.
                                </p>
                            </div>
                        </div>

                        <div className="w-full space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                            <button
                                onClick={() => signIn("google")}
                                className="group w-full h-14 sm:h-20 bg-slate-900 hover:bg-black text-white rounded-[20px] sm:rounded-[28px] flex items-center justify-center gap-3 sm:gap-5 transition-all active:scale-95 font-black text-sm sm:text-lg shadow-2xl shadow-slate-200"
                            >
                                <div className="bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4 sm:w-6 sm:h-6" alt="Google" />
                                </div>
                                Google 계정으로 시작하기
                            </button>
                            
                            <div className="pt-4 border-t border-slate-100 w-[60%] mx-auto opacity-50" />
                            
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    Safe & Secure Google Authentication
                                </p>
                                <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-[0.4em]">
                                    Powered by Eun035
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isDraftValid = draft && (new Date(draft.startISO) < new Date(draft.endISO));

    return (
        <div className="min-h-screen bg-[#F0F4F8] pb-20">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-indigo-900 tracking-tighter uppercase italic">Cal.AI</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="hidden sm:flex flex-col items-end min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate w-full">Signed in as</span>
                        <span className="text-[11px] sm:text-xs font-bold text-gray-800 truncate max-w-[100px] sm:max-w-[200px]">{session?.user?.name}</span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all active:scale-90 shrink-0"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </nav>

            <main id="app-main-container" className="max-w-2xl mx-auto w-full px-3 sm:px-6 pt-6 sm:pt-12 space-y-6 sm:space-y-12 overflow-x-hidden">
                {/* Input Section */}
                <section className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-8 shadow-2xl shadow-indigo-200/50 border border-white/50">
                    <div className="flex flex-col gap-6 sm:gap-8">
                        {/* Header & Toggle */}
                        <div id="mobile-header-container" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-2.5 bg-indigo-100 rounded-2xl text-indigo-600">
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">일정추가</h2>
                            </div>
                            
                            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-full sm:w-auto">
                                <button
                                    onClick={() => setInputMode("voice")}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${inputMode === "voice" ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    음성
                                </button>
                                <button
                                    onClick={() => setInputMode("text")}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${inputMode === "text" ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    텍스트
                                </button>
                            </div>
                        </div>

                        {/* Diagnostic Tools */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Bell className="w-3 h-3" /> Alarm Diagnostics
                                </span>
                                <p className="text-[10px] font-bold text-slate-500">
                                    알림 상태: {typeof window !== "undefined" && "Notification" in window ? (Notification.permission === "granted" ? "✅ 허용됨" : Notification.permission === "denied" ? "❌ 거부됨" : "❔ 대기 중") : "지원 안 함"}
                                </p>
                            </div>
                            <button 
                                onClick={testNotification}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-[11px] sm:text-[12px] font-black hover:bg-indigo-50 transition-colors shadow-sm active:scale-95"
                            >
                                알람 & 사운드 테스트
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="bg-gray-50/50 p-4 sm:p-6 rounded-[24px] border border-gray-100 flex flex-col gap-4">
                            {inputMode === "voice" ? (
                                <VoiceInput onTranscript={handleVoiceTranscript} />
                            ) : (
                                <TextInput value={rawText} onChange={setRawText} onParse={handleParse} />
                            )}

                            {parseError && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-semibold">{parseError}</p>
                                </div>
                            )}

                            {draft && (
                                <div className="mt-2 flex flex-col gap-6">
                                    <EventPreviewCard draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
                                    <button
                                        onClick={handleSave}
                                        disabled={!isDraftValid || isSaving}
                                        className="w-full h-14 sm:h-16 bg-slate-900 disabled:bg-gray-300 text-white rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-slate-200"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                                                이대로 저장하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>


                {/* List Section */}
                <section className="space-y-4 sm:space-y-6">
                    <div className="flex justify-between items-center px-1 sm:px-2 gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2 min-w-0">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
                            <span className="truncate">다가오는 일정</span>
                        </h2>
                        <button
                            onClick={fetchEvents}
                            disabled={loading}
                            className="p-2.5 sm:p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl sm:rounded-2xl transition-all active:rotate-180 duration-500"
                            title="Refresh"
                        >
                            <RotateCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
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
            </main>
        </div>
    );
}
