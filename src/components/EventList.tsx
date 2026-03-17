"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Trash2, Edit2, Check, X, Bell } from "lucide-react";

interface Event {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    location?: string;
    htmlLink?: string;
    colorId?: string;
    attendees?: { email: string }[];
    reminders?: number[];
}

// Google Calendar Colors Match - Reduced for UI compaction
const CALENDAR_COLORS = [
    { id: "1", name: "Lavender", bg: "bg-[#7986cb]", border: "border-[#7986cb]" }, // Blue
    { id: "2", name: "Sage", bg: "bg-[#33b679]", border: "border-[#33b679]" },   // Green
    { id: "3", name: "Grape", bg: "bg-[#8e24aa]", border: "border-[#8e24aa]" },   // Purple
    { id: "4", name: "Flamingo", bg: "bg-[#e67c73]", border: "border-[#e67c73]" }, // Red
    { id: "5", name: "Banana", bg: "bg-[#f6c026]", border: "border-[#f6c026]" },   // Yellow
    { id: "8", name: "Graphite", bg: "bg-[#616161]", border: "border-[#616161]" }, // Gray
];

interface EventListProps {
    events: Event[];
    onChanged: () => void;
}

const EventList: React.FC<EventListProps> = ({ events, onChanged }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{
        title: string;
        startISO: string;
        endISO: string;
        location: string;
        colorId?: string;
        reminders?: number[];
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDelete = async (eventId: string) => {
        if (!confirm("이 일정을 삭제할까요?")) return;
        setIsProcessing(true);
        try {
            const resp = await fetch("/api/calendar/delete", {
                method: "DELETE",
                body: JSON.stringify({ eventId }),
            });
            if (!resp.ok) throw new Error();
            onChanged();
        } catch (error) {
            alert("일정을 삭제하지 못했어요.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdate = async (eventId: string) => {
        if (!editData || !editData.title.trim()) return;
        setIsProcessing(true);
        try {
            const resp = await fetch("/api/calendar/update", {
                method: "PATCH",
                body: JSON.stringify({
                    eventId,
                    patch: {
                        title: editData.title,
                        startISO: editData.startISO,
                        endISO: editData.endISO,
                        location: editData.location,
                        colorId: editData.colorId,
                        reminders: editData.reminders,
                    }
                }),
            });
            if (!resp.ok) throw new Error();
            setEditingId(null);
            setEditData(null);
            onChanged();
        } catch (error) {
            alert("일정을 수정하지 못했어요.");
        } finally {
            setIsProcessing(false);
        }
    };

    const startEdit = (event: Event) => {
        setEditingId(event.id);
        setEditData({
            title: event.summary,
            startISO: event.start.dateTime || new Date(event.start.date!).toISOString(),
            endISO: event.end.dateTime || new Date(event.end.date!).toISOString(),
            location: event.location || "",
            colorId: event.colorId,
            reminders: event.reminders,
        });
    };

    const formatISOForInput = (iso: string) => {
        const date = new Date(iso);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const handleEditChange = (field: string, value: string) => {
        if (!editData) return;
        if (field === "startISO" || field === "endISO") {
            setEditData({ ...editData, [field]: new Date(value).toISOString() });
        } else {
            setEditData({ ...editData, [field]: value });
        }
    };

    const formatDate = (event: Event) => {
        const dateStr = event.start.dateTime || event.start.date;
        if (!dateStr) return "시간 정보 없음";

        const date = new Date(dateStr);
        const isAllDay = !event.start.dateTime;

        const options: Intl.DateTimeFormatOptions = {
            month: "long",
            day: "numeric",
            hour12: true,
        };

        if (!isAllDay) {
            options.hour = "numeric";
            options.minute = "2-digit";
        }

        return date.toLocaleString("ko-KR", options) + (isAllDay ? " (종일)" : "");
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 border border-dashed border-gray-200 rounded-[32px]">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium tracking-tight">다가오는 일정이 없어요.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 w-full">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="group bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-100 transition-all duration-300"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                            {editingId === event.id && editData ? (
                                <div className="space-y-3 bg-indigo-50/50 p-3 sm:p-4 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase">일정 수정</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleUpdate(event.id)}
                                                className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg sm:rounded-xl transition-colors"
                                            >
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditData(null);
                                                }}
                                                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-100 rounded-lg sm:rounded-xl transition-colors"
                                            >
                                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">제목</label>
                                        <input
                                            value={editData.title}
                                            onChange={(e) => handleEditChange("title", e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-xl px-2.5 sm:px-3 py-2 outline-none font-semibold text-gray-800 focus:border-indigo-400 text-sm sm:text-base"
                                        />
                                    </div>

                                    {/* Times */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1">시작</label>
                                            <input
                                                type="datetime-local"
                                                value={formatISOForInput(editData.startISO)}
                                                onChange={(e) => handleEditChange("startISO", e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1">종료</label>
                                            <input
                                                type="datetime-local"
                                                value={formatISOForInput(editData.endISO)}
                                                onChange={(e) => handleEditChange("endISO", e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">장소</label>
                                        <input
                                            value={editData.location}
                                            onChange={(e) => handleEditChange("location", e.target.value)}
                                            placeholder="장소 추가"
                                            className="w-full bg-white border border-gray-100 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                    {/* Color ID */}
                                    <div className="space-y-0.5">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">색상 변경</label>
                                        <div className="flex bg-white border border-gray-100 rounded-xl p-1.5 overflow-x-auto hide-scrollbar items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setEditData({ ...editData, colorId: undefined })}
                                                className={`w-6 h-6 rounded-full border-2 shrink-0 transition-all ${!editData.colorId ? "border-indigo-600 scale-110 shadow" : "border-gray-300 bg-gray-200"
                                                    }`}
                                            />
                                            {CALENDAR_COLORS.map(color => (
                                                <button
                                                    key={color.id}
                                                    type="button"
                                                    onClick={() => setEditData({ ...editData, colorId: color.id })}
                                                    className={`w-6 h-6 rounded-full shrink-0 transition-all ${color.bg} ${editData.colorId === color.id ? "ring-2 ring-offset-1 ring-indigo-600 scale-110 shadow" : "hover:scale-105"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Reminders */}
                                    <div className="space-y-0.5">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">알림 <span className="font-medium tracking-tighter">(다중선택가능)</span></label>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setEditData({ ...editData, reminders: [] })}
                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ${(!editData.reminders || editData.reminders.length === 0) ? "bg-red-500 text-white shadow-sm" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"}`}
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
                                                const isSelected = editData.reminders?.includes(option.value);
                                                return (
                                                    <button
                                                        key={option.label}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentReminders = editData.reminders || [];
                                                            let newReminders;
                                                            if (isSelected) {
                                                                newReminders = currentReminders.filter((r) => r !== option.value);
                                                            } else {
                                                                newReminders = [...currentReminders, option.value].sort((a, b) => a - b);
                                                            }
                                                            setEditData({ ...editData, reminders: newReminders });
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 ${isSelected ? "bg-red-500 text-white shadow-sm" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-inner ${event.colorId
                                        ? CALENDAR_COLORS.find(c => c.id === event.colorId)?.bg
                                        : "bg-indigo-400"
                                        }`} />
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                        {event.summary}
                                    </h3>
                                </div>
                            )}

                            {editingId !== event.id && (
                                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 sm:gap-x-5 gap-y-2 text-xs sm:text-sm pl-4 sm:pl-6 overflow-hidden">
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 font-medium shrink-0 min-w-0">
                                        <div className="p-0.5 sm:p-1 bg-[#F5F7FF] rounded-md sm:rounded-lg shrink-0">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-[11px] sm:text-sm truncate">{formatDate(event)}</span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 font-medium min-w-0">
                                            <div className="p-0.5 sm:p-1 bg-green-50 rounded-md sm:rounded-lg shrink-0">
                                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                            </div>
                                            <span className="truncate text-[11px] sm:text-sm">{event.location}</span>
                                        </div>
                                    )}
                                    {event.attendees && event.attendees.length > 0 && (
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 font-medium min-w-0">
                                            <div className="p-0.5 sm:p-1 bg-amber-50 rounded-md sm:rounded-lg shrink-0">
                                                <span className="text-[10px] sm:text-xs font-bold text-amber-600 px-0.5 sm:px-1">
                                                    +{event.attendees.length}명
                                                </span>
                                            </div>
                                            <span className="truncate text-[10px] sm:text-xs">
                                                {event.attendees[0].email}
                                            </span>
                                        </div>
                                    )}
                                    {event.reminders && event.reminders.length > 0 && (
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 font-medium min-w-0">
                                            <div className="p-0.5 sm:p-1 bg-red-50 rounded-md sm:rounded-lg shrink-0">
                                                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs leading-normal break-words whitespace-normal">
                                                {event.reminders.map(mins => mins === 0 ? "정시" : mins === 1440 ? "1일 전" : mins >= 60 ? `${mins / 60}시간 전` : `${mins}분 전`).join(', ')} 알림
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {editingId !== event.id && (
                            <div className="flex gap-0.5 sm:gap-1 shrink-0">
                                <button
                                    disabled={isProcessing}
                                    onClick={() => startEdit(event)}
                                    className="p-1.5 sm:p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl sm:rounded-2xl transition-all active:scale-90"
                                    title="수정"
                                >
                                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleDelete(event.id)}
                                    className="p-1.5 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all active:scale-90"
                                    title="삭제"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventList;
