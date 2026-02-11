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
        recognition.continuous = false; // 모바일에서는 false가 더 안정적
        recognition.interimResults = false; // 중간 결과 끄기

        recognition.onresult = (event: any) => {
            const lastResult = event.results.length - 1;
            let speechToText = event.results[lastResult][0].transcript;

            // 안드로이드 특화 텍스트 정제
            let cleanText = speechToText.replace(/[.,?!]/g, "").trim();

            console.log('원본:', speechToText);
            console.log('정제됨:', cleanText);

            setTranscript(cleanText);
            onTranscript(cleanText);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('음성 인식 에러:', event.error);
            if (event.error === 'not-allowed') {
                alert('마이크 권한을 허용해 주세요.');
            }
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onTranscript]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
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
