"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            if (transcript) onTranscript(transcript);
            setTranscript("");
        } else {
            setTranscript("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    if (!isSupported) {
        return (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>이 브라우저는 음성 인식을 지원하지 않아요. 텍스트 입력을 사용해주세요.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <button
                onClick={toggleListening}
                className={`w-full min-h-[48px] rounded-full flex items-center justify-center gap-2 transition-all font-medium ${isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    }`}
            >
                {isListening ? (
                    <>
                        <MicOff className="w-5 h-5" />
                        <span>듣는 중... (중지)</span>
                    </>
                ) : (
                    <>
                        <Mic className="w-5 h-5" />
                        <span>음성으로 일정 말하기</span>
                    </>
                )}
            </button>
            {isListening && transcript && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 w-full text-center">
                    <p className="text-gray-600 italic">"{transcript}"</p>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
