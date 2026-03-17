"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, AlertCircle, Loader2 } from "lucide-react";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");

    // Refs to keep track of state inside event handlers without re-running useEffect
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef("");
    const onTranscriptRef = useRef(onTranscript);

    // Update the onTranscript ref when the prop changes
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    useEffect(() => {
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setIsSupported(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = "ko-KR";
            recognition.continuous = true;
            recognition.interimResults = true;

            const isAndroid = /Android/i.test(navigator.userAgent);

            recognition.onresult = (event: any) => {
                let finalStr = "";
                let interimPart = "";

                for (let i = 0; i < event.results.length; ++i) {
                    const text = event.results[i][0].transcript.trim();
                    if (!text) continue;

                    if (event.results[i].isFinal) {
                        if (finalStr) {
                            const prevNoSpace = finalStr.replace(/\s+/g, "");
                            const currNoSpace = text.replace(/\s+/g, "");

                            let isCumul = false;

                            // 1. Typo correction overlap check
                            if (currNoSpace.length >= prevNoSpace.length * 0.4) {
                                let matchCount = 0;
                                const checkLen = Math.min(prevNoSpace.length, currNoSpace.length);
                                for (let j = 0; j < checkLen; j++) {
                                    if (prevNoSpace[j] === currNoSpace[j]) matchCount++;
                                }
                                if (matchCount >= checkLen * 0.4) {
                                    isCumul = true;
                                }
                            }

                            // 2. Android absolute assumption 
                            // Android ALWAYS accumulates the phrase in continuous mode.
                            if (isAndroid && currNoSpace.length >= prevNoSpace.length * 0.8) {
                                isCumul = true;
                            }

                            if (isCumul) {
                                finalStr = text; // Completely replace due to cumulative bug
                            } else {
                                finalStr += " " + text;
                            }
                        } else {
                            finalStr = text;
                        }
                    } else {
                        interimPart += text + " ";
                    }
                }

                let displayInterim = interimPart.trim();
                if (finalStr && displayInterim) {
                    const firstWordF = finalStr.split(/\s+/)[0];
                    const firstWordI = displayInterim.split(/\s+/)[0];
                    if (firstWordF === firstWordI) {
                        // Suppress visual stuttering where interim duplicates final on mobile
                        displayInterim = "";
                    }
                }

                setTranscript(finalStr);

                if (finalStr !== transcriptRef.current) {
                    transcriptRef.current = finalStr;
                    onTranscriptRef.current(finalStr);
                }

                setInterimTranscript(displayInterim);
            };

            recognition.onerror = (event: any) => {
                console.error('음성 인식 에러:', event.error);
                if (event.error === 'not-allowed') {
                    alert('마이크 권한을 허용해 주세요.');
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } catch (error) {
            console.error("Speech Recognition initialization failed:", error);
            setIsSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore stop errors on unmount
                }
            }
        };
    }, []); // Run once on mount

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) {
            alert("해당 기기 및 브라우저에서는 음성 인식을 시작할 수 없어요.");
            setIsListening(false);
            return;
        }

        if (isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            setIsListening(false);
            setInterimTranscript("");
        } else {
            // Reset for new recording
            transcriptRef.current = "";
            setTranscript("");
            setInterimTranscript("");
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
                setIsListening(false);
                alert("음성 인식을 시작하지 못했어요. 브라우저 설정(마이크 권한)을 확인해 주세요.");
            }
        }
    }, [isListening]);

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
                className={`w-full min-h-[50px] sm:min-h-[56px] rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all font-bold text-base sm:text-lg shadow-lg ${isListening
                    ? "bg-red-500 text-white shadow-red-100 animate-pulse ring-4 ring-red-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-100"
                    }`}
            >
                {isListening ? (
                    <>
                        <MicOff className="w-6 h-6" />
                        <span>듣고 있어요... (중지)</span>
                    </>
                ) : (
                    <>
                        <Mic className="w-6 h-6" />
                        <span>음성으로 일정 말하기</span>
                    </>
                )}
            </button>

            {(isListening || transcript) && (
                <div className="p-4 sm:p-6 bg-gray-50 rounded-[20px] sm:rounded-[24px] border border-dashed border-gray-300 w-full min-h-[80px] sm:min-h-[100px] flex flex-col justify-center items-center gap-2 sm:gap-3 relative overflow-hidden">
                    {isListening && !transcript && !interimTranscript && (
                        <div className="flex flex-col items-center gap-2 opacity-40">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm font-medium">말씀해 주세요</p>
                        </div>
                    )}

                    <div className="text-center space-y-2 w-full min-w-0">
                        {transcript && (
                            <p className="text-gray-800 font-bold text-base sm:text-lg leading-relaxed break-all px-1">
                                {transcript}
                            </p>
                        )}
                        {interimTranscript && (
                            <p className="text-indigo-400 font-bold text-base sm:text-lg animate-pulse break-all px-1">
                                {interimTranscript}
                            </p>
                        )}
                    </div>

                    {isListening && (
                        <div className="absolute top-3 right-3">
                            <div className="flex gap-1 items-end h-4">
                                <div className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite_0ms]" style={{ height: '60%' }}></div>
                                <div className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite_200ms]" style={{ height: '100%' }}></div>
                                <div className="w-1 bg-red-400 rounded-full animate-[bounce_1s_infinite_400ms]" style={{ height: '70%' }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
