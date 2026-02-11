"use client";

import React from "react";
import { EventDraft } from "@/services/nlpParser";
import { Clock, MapPin, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface EventPreviewCardProps {
    draft: EventDraft;
    onChange: (patch: Partial<EventDraft>) => void;
}

const EventPreviewCard: React.FC<EventPreviewCardProps> = ({ draft, onChange }) => {
    const isInvalid = new Date(draft.startISO) >= new Date(draft.endISO);

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
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="datetime-local"
                            value={formatISOForInput(draft.startISO)}
                            onChange={(e) => handleDateChange("startISO", e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                        />
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
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={draft.location || ""}
                            onChange={(e) => onChange({ location: e.target.value })}
                            placeholder="장소 없음"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPreviewCard;
