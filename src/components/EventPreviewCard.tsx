"use client";

import React, { useState, useEffect } from "react";
import { EventDraft } from "@/services/nlpParser";
import { Clock, MapPin, Calendar, CheckCircle2, AlertCircle, Bell, Users, Palette, Map, Plus, X, Sparkles } from "lucide-react";

// Google Calendar Colors
const CALENDAR_COLORS = [
    { id: "1", name: "Lavender", bg: "bg-[#7986cb]" },
    { id: "2", name: "Sage", bg: "bg-[#33b679]" },
    { id: "3", name: "Grape", bg: "bg-[#8e24aa]" },
    { id: "4", name: "Flamingo", bg: "bg-[#e67c73]" },
    { id: "5", name: "Banana", bg: "bg-[#f6c026]" },
    { id: "6", name: "Tangerine", bg: "bg-[#f5511d]" },
    { id: "7", name: "Peacock", bg: "bg-[#039be5]" },
    { id: "8", name: "Graphite", bg: "bg-[#616161]" },
    { id: "9", name: "Blueberry", bg: "bg-[#3f51b5]" },
    { id: "10", name: "Basil", bg: "bg-[#0b8043]" },
    { id: "11", name: "Tomato", bg: "bg-[#d50000]" },
];

interface EventPreviewCardProps {
    draft: EventDraft;
    onChange: (patch: Partial<EventDraft>) => void;
}

const EventPreviewCard: React.FC<EventPreviewCardProps> = ({ draft, onChange }) => {
    const isInvalid = new Date(draft.startISO) >= new Date(draft.endISO);
    const [newAttendee, setNewAttendee] = useState("");
    const [conflicts, setConflicts] = useState<{ title: string }[]>([]);

    useEffect(() => {
        if (!draft.startISO || !draft.endISO || isInvalid) {
            setConflicts([]);
            return;
        }

        const checkConflict = async () => {
            try {
                const res = await fetch("/api/calendar/check-conflict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ startISO: draft.startISO, endISO: draft.endISO }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setConflicts(data.conflicts || []);
                }
            } catch (err) {
                console.error("Conflict check failed", err);
            }
        };

        // Debounce for 500ms
        const timer = setTimeout(checkConflict, 500);
        return () => clearTimeout(timer);
    }, [draft.startISO, draft.endISO, isInvalid]);

    const formatISOForInput = (iso: string) => {
        const date = new Date(iso);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
    };

    const handleDateChange = (field: "startISO" | "endISO", value: string) => {
        const date = new Date(value);
        onChange({ [field]: date.toISOString() });
    };

    return (
        <div className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-xl shadow-indigo-100/50 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-1">
                <CheckCircle2 className="w-6 h-6" />
                <span>일정을 확인해 주세요</span>
            </div>

            {conflicts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 text-yellow-800 text-sm animate-in fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">이 시간에 진행 중인 다른 일정이 있습니다.</p>
                        <ul className="list-disc list-inside space-y-0.5 text-yellow-700 font-medium mb-1">
                            {conflicts.map((c, i) => (
                                <li key={i}>{c.title}</li>
                            ))}
                        </ul>
                        <p className="text-xs text-yellow-600">이대로 저장 버튼을 누르면 일정이 겹친 상태로 캘린더에 곧바로 등록됩니다.</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">제목</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Start Time */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">시작 시간</label>
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="datetime-local"
                                value={formatISOForInput(draft.startISO)}
                                onChange={(e) => handleDateChange("startISO", e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                            />
                        </div>
                        {/* Duration Presets */}
                        <div className="flex flex-wrap gap-2 ml-1">
                            {[60, 90, 120, 240].map((mins) => (
                                <button
                                    key={mins}
                                    type="button"
                                    onClick={() => {
                                        const start = new Date(draft.startISO);
                                        const end = new Date(start.getTime() + mins * 60000);
                                        onChange({ endISO: end.toISOString() });
                                    }}
                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    +{mins >= 60 ? (mins % 60 === 0 ? `${mins / 60}시간` : `${Math.floor(mins / 60)}시간 30분`) : `${mins}분`}
                                </button>
                            ))}
                            <span className="text-[10px] text-gray-400 self-center font-medium ml-1">시작 시간 기준</span>
                        </div>
                    </div>
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">종료 시간</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="datetime-local"
                            value={formatISOForInput(draft.endISO)}
                            onChange={(e) => handleDateChange("endISO", e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all font-medium ${isInvalid ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-100 focus:bg-white focus:border-indigo-400"
                                }`}
                        />
                    </div>
                    {isInvalid && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            종료 시간이 시작 시간보다 늦어야 해요.
                        </p>
                    )}
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">장소 (선택)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={draft.location || ""}
                                onChange={(e) => onChange({ location: e.target.value })}
                                placeholder="장소 없음"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                            />
                        </div>
                        {draft.location && (
                            <a
                                href={`https://map.naver.com/v5/search/${encodeURIComponent(draft.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors tooltip"
                                title="Naver 지도로 검색"
                            >
                                <Map className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Attendees */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">참석자 (선택)</label>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={newAttendee}
                                onChange={(e) => setNewAttendee(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newAttendee.includes('@')) {
                                        e.preventDefault();
                                        const current = draft.attendees || [];
                                        if (!current.some(a => a.email === newAttendee)) {
                                            onChange({ attendees: [...current, { email: newAttendee }] });
                                        }
                                        setNewAttendee("");
                                    }
                                }}
                                placeholder="이메일 입력 후 Enter"
                                className="w-full bg-transparent outline-none font-medium placeholder:text-gray-400 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (newAttendee.includes('@')) {
                                        const current = draft.attendees || [];
                                        if (!current.some(a => a.email === newAttendee)) {
                                            onChange({ attendees: [...current, { email: newAttendee }] });
                                        }
                                        setNewAttendee("");
                                    }
                                }}
                                className="p-1 rounded bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {(draft.attendees && draft.attendees.length > 0) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                {draft.attendees.map((attendee, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                                        {attendee.email}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = draft.attendees || [];
                                                onChange({ attendees: current.filter(a => a.email !== attendee.email) });
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Reminders */}
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-500 ml-1">알림 <span className="text-xs font-medium text-gray-400 tracking-tighter">(다중선택가능)</span></label>
                    <div className="flex flex-wrap gap-2 ml-1">
                        <button
                            type="button"
                            onClick={() => onChange({ reminders: [] })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${(!draft.reminders || draft.reminders.length === 0) ? "bg-indigo-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                            <Bell className="w-3 h-3" /> 없음
                        </button>
                        {[
                            { label: "정시", value: 0 },
                            { label: "10분 전", value: 10 },
                            { label: "30분 전", value: 30 },
                            { label: "1시간 전", value: 60 },
                            { label: "1일 전", value: 1440 },
                        ].map((option) => {
                            const isSelected = draft.reminders?.includes(option.value);
                            return (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => {
                                        const currentReminders = draft.reminders || [];
                                        let newReminders;
                                        if (isSelected) {
                                            newReminders = currentReminders.filter((r) => r !== option.value);
                                        } else {
                                            newReminders = [...currentReminders, option.value].sort((a, b) => a - b);
                                        }
                                        onChange({ reminders: newReminders });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${isSelected ? "bg-indigo-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Minimized AI Tags Section */}
                {draft.colorId && (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-indigo-400 mr-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> AI 색상 지정
                        </span>

                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700">
                            <Palette className="w-3.5 h-3.5 text-gray-400" />
                            <div className={`w-3 h-3 rounded-full ${CALENDAR_COLORS.find(c => c.id === draft.colorId)?.bg || 'bg-gray-300'}`} />
                            {CALENDAR_COLORS.find(c => c.id === draft.colorId)?.name}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventPreviewCard;
