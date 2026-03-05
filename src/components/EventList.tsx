"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, Trash2, Edit2, Check, X } from "lucide-react";

interface Event {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    location?: string;
    htmlLink?: string;
    colorId?: string;
    attendees?: { email: string }[];
}

// Google Calendar Colors Match
const CALENDAR_COLORS = [
    { id: "1", name: "Lavender", bg: "bg-[#7986cb]", border: "border-[#7986cb]" },
    { id: "2", name: "Sage", bg: "bg-[#33b679]", border: "border-[#33b679]" },
    { id: "3", name: "Grape", bg: "bg-[#8e24aa]", border: "border-[#8e24aa]" },
    { id: "4", name: "Flamingo", bg: "bg-[#e67c73]", border: "border-[#e67c73]" },
    { id: "5", name: "Banana", bg: "bg-[#f6c026]", border: "border-[#f6c026]" },
    { id: "6", name: "Tangerine", bg: "bg-[#f5511d]", border: "border-[#f5511d]" },
    { id: "7", name: "Peacock", bg: "bg-[#039be5]", border: "border-[#039be5]" },
    { id: "8", name: "Graphite", bg: "bg-[#616161]", border: "border-[#616161]" },
    { id: "9", name: "Blueberry", bg: "bg-[#3f51b5]", border: "border-[#3f51b5]" },
    { id: "10", name: "Basil", bg: "bg-[#0b8043]", border: "border-[#0b8043]" },
    { id: "11", name: "Tomato", bg: "bg-[#d50000]", border: "border-[#d50000]" },
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

        return date.toLocaleString("ko-KR", {
            month: "long",
            day: "numeric",
            hour: isAllDay ? undefined : "numeric",
            minute: isAllDay ? undefined : "2-digit",
            hour12: true,
        }) + (isAllDay ? " (종일)" : "");
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
                    className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-100 transition-all duration-300"
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                            {editingId === event.id && editData ? (
                                <div className="space-y-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-600 uppercase">일정 수정</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleUpdate(event.id)}
                                                className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditData(null);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">제목</label>
                                        <input
                                            value={editData.title}
                                            onChange={(e) => handleEditChange("title", e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 outline-none font-semibold text-gray-800 focus:border-indigo-400"
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
                                                className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 ml-1">종료</label>
                                            <input
                                                type="datetime-local"
                                                value={formatISOForInput(editData.endISO)}
                                                onChange={(e) => handleEditChange("endISO", e.target.value)}
                                                className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400"
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
                                            className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                    {/* Color ID */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">색상 변경</label>
                                        <div className="flex bg-white border border-gray-100 rounded-xl p-2 overflow-x-auto hide-scrollbar items-center gap-2">
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
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full shrink-0 shadow-inner ${event.colorId
                                            ? CALENDAR_COLORS.find(c => c.id === event.colorId)?.bg
                                            : "bg-indigo-400"
                                        }`} />
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                                        {event.summary}
                                    </h3>
                                </div>
                            )}

                            {editingId !== event.id && (
                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm pl-6">
                                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                                        <div className="p-1 bg-[#F5F7FF] rounded-lg">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span>{formatDate(event)}</span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <div className="p-1 bg-green-50 rounded-lg">
                                                <MapPin className="w-4 h-4 text-green-600" />
                                            </div>
                                            <span className="truncate max-w-[200px]">{event.location}</span>
                                        </div>
                                    )}
                                    {event.attendees && event.attendees.length > 0 && (
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <div className="p-1 bg-amber-50 rounded-lg">
                                                <span className="text-xs font-bold text-amber-600 px-1">
                                                    +{event.attendees.length}명
                                                </span>
                                            </div>
                                            <span className="truncate max-w-[150px] text-xs">
                                                {event.attendees[0].email} {event.attendees.length > 1 ? `외 ${event.attendees.length - 1}명` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {editingId !== event.id && (
                            <div className="flex gap-1">
                                <button
                                    disabled={isProcessing}
                                    onClick={() => startEdit(event)}
                                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
                                    title="수정"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleDelete(event.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                    title="삭제"
                                >
                                    <Trash2 className="w-5 h-5" />
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
