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

            recognition.onresult = (event: any) => {
                let validFinals: string[] = [];
                let interimPart = "";

                // Gather all results
                for (let i = 0; i < event.results.length; ++i) {
                    const text = event.results[i][0].transcript.trim();
                    if (!text) continue;

                    if (event.results[i].isFinal) {
                        validFinals.push(text);
                    } else {
                        interimPart += text + " ";
                    }
                }

                // Deduplicate validFinals for Android Chrome continuous bug
                // where results[i] contains results[i-1] as a prefix
                let finalStr = "";
                for (let i = 0; i < validFinals.length; i++) {
                    const curr = validFinals[i];
                    const next = validFinals[i + 1];

                    if (next) {
                        const normCurr = curr.replace(/\s+/g, "");
                        const normNext = next.replace(/\s+/g, "");
                        // If the next chunk completely starts with this chunk, ignore this one
                        if (normNext.startsWith(normCurr)) {
                            continue;
                        }
                    }
                    finalStr += (finalStr ? " " : "") + curr;
                }

                // Clean up interimPart if it contains the final string
                let displayInterim = interimPart.trim();
                if (finalStr && displayInterim) {
                    const normFinal = finalStr.replace(/\s+/g, "");
                    const normInterim = displayInterim.replace(/\s+/g, "");
                    if (normInterim.startsWith(normFinal)) {
                        const finalWords = finalStr.split(/\s+/);
                        const interimWords = displayInterim.split(/\s+/);
                        let matchIdx = 0;
                        while (matchIdx < finalWords.length && matchIdx < interimWords.length) {
                            if (finalWords[matchIdx] === interimWords[matchIdx]) {
                                matchIdx++;
                            } else {
                                break;
                            }
                        }
                        if (matchIdx > 0) {
                            displayInterim = interimWords.slice(matchIdx).join(" ");
                        }
                    }
                }

                setTranscript(finalStr);

                // Only trigger the callback if something meaningful was finalized
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
                className={`w-full min-h-[56px] rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-lg shadow-lg ${isListening
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
                <div className="p-6 bg-gray-50 rounded-[24px] border border-dashed border-gray-300 w-full min-h-[100px] flex flex-col justify-center items-center gap-3 relative overflow-hidden">
                    {isListening && !transcript && !interimTranscript && (
                        <div className="flex flex-col items-center gap-2 opacity-40">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm font-medium">말씀해 주세요</p>
                        </div>
                    )}

                    <div className="text-center space-y-2">
                        {transcript && (
                            <p className="text-gray-800 font-bold text-lg leading-relaxed">
                                {transcript}
                            </p>
                        )}
                        {interimTranscript && (
                            <p className="text-indigo-400 font-bold text-lg animate-pulse">
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
