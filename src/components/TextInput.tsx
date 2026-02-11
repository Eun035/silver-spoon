"use client";

import React from "react";

interface TextInputProps {
    value: string;
    onChange: (text: string) => void;
    onParse: () => void;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, onParse }) => {
    return (
        <div className="flex flex-col gap-3 w-full">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="예: 내일 오후 3시 치과 1시간 장소 강남역"
                className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none text-gray-700 bg-white"
            />
            <button
                onClick={onParse}
                disabled={!value.trim()}
                className="w-full min-h-[48px] bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl font-semibold transition-all hover:bg-indigo-700 active:scale-95"
            >
                일정 추출하기
            </button>
        </div>
    );
};

export default TextInput;
