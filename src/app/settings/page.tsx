"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldAlert, Globe, ExternalLink, Calendar } from "lucide-react";

export default function SettingsPage() {
    return (
        <main className="min-h-screen bg-[#F0F4F8] pb-20">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center shadow-sm gap-4">
                <Link
                    href="/"
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-xl">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">설정 & 배포 가이드</h1>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
                <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-xl shadow-indigo-100/50 border border-white">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">🚀 프로젝트 공개 전환 설정</h2>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                        현재 이 앱은 테스트 모드로 실행 중이라 개발자 본인(테스트 계정)만 로그인할 수 있습니다.
                        <strong>다른 사람이나 일반 구글 계정 사용자가 이 앱을 사용하도록 하려면 아래의 절차를 따라야 합니다.</strong>
                    </p>

                    <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl h-fit">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 text-lg">1. Google Cloud OAuth 승인 받기 (가장 중요)</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    현재 캘린더 읽기/쓰기 권한(민감한 권한)을 요구하기 때문에 구글의 심사를 받아야 합니다.
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-1 mt-2">
                                    <li><a href="https://console.cloud.google.com/" target="_blank" className="text-indigo-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> 접속</li>
                                    <li>[API 및 서비스] &gt; [OAuth 동의 화면] 이동</li>
                                    <li>게시 상태를 <strong>프로덕션으로 푸시(게시)</strong> 클릭</li>
                                    <li>앱 동작 원리를 촬영한 유튜브 시연 영상 제출</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="bg-white text-gray-700 p-3 rounded-xl shadow-sm h-fit">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 text-lg">2. 개인정보처리방침 (Privacy Policy)</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    위 1번의 승인을 받기 위해서나 앱 스토어에 출시하기 위해 반드시 앱의 영문/국문 개인정보처리방침 웹페이지 URL이 필요합니다.
                                </p>
                                <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded-lg inline-block">
                                    💡 팁: Notion(노션)으로 권한 사용 목적과 정보 파기 내용을 적은 뒤 퍼블릭 링크를 만들어 제출하세요.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100/50">
                            <div className="bg-green-100 text-green-600 p-3 rounded-xl h-fit">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-gray-900 text-lg">3. Android 앱 변환 (TWA)</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    일반 대중이 폰에서 구글 플레이 스토어를 통해 다운받게 하려면 웹을 앱으로 패키징해야 합니다. (로컬 코드에는 <code>manifest.json</code>과 아이콘 설정이 완료되어 있습니다.)
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-1 mt-2">
                                    <li><a href="https://www.pwabuilder.com/" target="_blank" className="text-green-600 hover:underline inline-flex items-center gap-1">PWABuilder <ExternalLink className="w-3 h-3" /></a> 웹사이트 접속</li>
                                    <li>배포된 Vercel 도메인 URL 입력</li>
                                    <li>안드로이드 패키지 파일(AAB) 추출 후 구글 플레이 콘솔에 업로드</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            메인 화면으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
