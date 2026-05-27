"use client";

import React, { useState, useEffect, useRef } from "react";
import { linksData, LinkItem } from "./data/links";

export default function Home() {
  // State for study timer
  const [timerTime, setTimerTime] = useState(1500); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimerType, setActiveTimerType] = useState<"pomodoro" | "shortBreak">("pomodoro");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // State for message modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ name: string; text: string; date: string }>>([
    { name: "선배", text: "의예과 입학을 축하합니다! 멋진 의사가 되시길 바랍니다.", date: "5분 전" },
    { name: "동기", text: "태인아 25학번 동기 화이팅하자! 🔥", date: "1시간 전" }
  ]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            triggerToast(activeTimerType === "pomodoro" ? "집중 시간이 종료되었습니다! 👏 잠시 쉬어가세요." : "휴식이 종료되었습니다! 다시 집중해볼까요? 📚");
            return activeTimerType === "pomodoro" ? 1500 : 300;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, activeTimerType]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerTime(activeTimerType === "pomodoro" ? 1500 : 300);
  };

  const switchTimerMode = (mode: "pomodoro" | "shortBreak") => {
    setIsTimerRunning(false);
    setActiveTimerType(mode);
    setTimerTime(mode === "pomodoro" ? 1500 : 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toast trigger utility
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("🔗 프로필 링크가 클립보드에 복사되었습니다!");
    }
  };

  // Leave a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMessage.trim()) return;
    
    const newMsg = {
      name: visitorName,
      text: visitorMessage,
      date: "방금 전"
    };

    setMessages([newMsg, ...messages]);
    setVisitorName("");
    setVisitorMessage("");
    setIsModalOpen(false);
    triggerToast("✍️ 응원 메시지가 등록되었습니다!");
  };

  // SVG Icon mapping for link channels
  const renderLinkIcon = (iconType: string) => {
    switch (iconType) {
      case "instagram":
        return (
          <svg className="w-5 h-5 text-slate-600 transition-colors group-hover:text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        );
      case "youtube":
        return (
          <svg className="w-5 h-5 text-slate-600 transition-colors group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
            <polygon fill="currentColor" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
          </svg>
        );
      case "blog":
        return (
          <svg className="w-5 h-5 text-slate-600 transition-colors group-hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        );
    }
  };

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-[#f5f5f5] font-sans relative overflow-hidden select-none">
      
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#003C71]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

      {/* Outer wrapper keeping central alignment and vertical stacking */}
      <div className="w-full max-w-[400px] flex flex-col gap-4 items-center">
        
        {/* Main Profile Card Container */}
        <div 
          id="profile-card"
          className="w-full bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-8 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] relative z-10 animate-scale-in"
        >
          {/* Hanyang University Top Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[16px] bg-gradient-to-r from-[#003C71] via-[#8C7B50] to-[#003C71]" />

          {/* 120px Circular Grey Profile Avatar Frame */}
          <div className="relative group mt-2 mb-6">
            <div className="w-[120px] h-[120px] rounded-full bg-slate-200 border-4 border-slate-50 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.05),0_8px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:bg-slate-300">
              <svg 
                className="w-16 h-16 text-[#003C71]/70 transition-all duration-500 group-hover:text-[#003C71] group-hover:rotate-12"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            
            <div className="absolute inset-0 w-[124px] h-[124px] -m-[2px] rounded-full border border-teal-500/0 group-hover:border-teal-500/20 group-hover:scale-105 transition-all duration-500 pointer-events-none animate-pulse-border" />
          </div>

          {/* User Info Section */}
          <div className="space-y-3 mb-6">
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-800 leading-tight">
              진태인
            </h1>
            
            {/* Hanyang Univ / Major stylized badges */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#003C71]/10 text-[#003C71] border border-[#003C71]/20">
                한양대학교
              </span>
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-500/20">
                의과대학 의예과 25학번
              </span>
            </div>
          </div>

          {/* Bio statement */}
          <p className="text-slate-500 text-[14px] leading-relaxed max-w-[280px] mb-8 font-medium">
            “생명을 향한 소중한 발걸음,<br />
            인류의 건강을 지키는 의사를 꿈꿉니다.”
          </p>

          {/* Pre-med Study Timer */}
          <section 
            id="study-timer-section" 
            className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex flex-col items-center transition-all duration-300 hover:border-slate-200/80"
          >
            <div className="w-full flex items-center justify-between mb-3.5 px-1">
              <span className="text-slate-600 text-xs font-bold tracking-wide flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                의예과 집중 타이머
              </span>
              <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-lg">
                <button 
                  id="timer-mode-pomodoro"
                  onClick={() => switchTimerMode("pomodoro")} 
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${activeTimerType === "pomodoro" ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  집중
                </button>
                <button 
                  id="timer-mode-break"
                  onClick={() => switchTimerMode("shortBreak")} 
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${activeTimerType === "shortBreak" ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  휴식
                </button>
              </div>
            </div>

            <div className="text-[32px] font-black tracking-tight text-slate-800 leading-none mb-3 font-mono">
              {formatTime(timerTime)}
            </div>

            <div className="flex gap-2">
              <button
                id="timer-play-btn"
                onClick={toggleTimer}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 flex items-center gap-1 ${
                  isTimerRunning 
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                {isTimerRunning ? "일시정지" : "집중 시작"}
              </button>
              <button
                id="timer-reset-btn"
                onClick={resetTimer}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                초기화
              </button>
            </div>
          </section>

          {/* Primary Action Buttons */}
          <div className="w-full flex gap-3 mt-1">
            <button 
              id="share-profile-btn"
              onClick={handleCopyLink}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              프로필 공유
            </button>
            
            <button 
              id="open-message-modal-btn"
              onClick={() => setIsModalOpen(true)}
              className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-sm font-bold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              응원 남기기
            </button>
          </div>

          {/* Guestbook Messages Display */}
          <div className="w-full mt-6 pt-5 border-t border-slate-100 flex flex-col items-stretch text-left">
            <span className="text-slate-700 text-[11px] font-extrabold tracking-wide uppercase mb-3">응원 방명록 ({messages.length})</span>
            <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100/50 p-2.5 rounded-lg flex flex-col gap-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[11px] text-[#003C71]">{msg.name}</span>
                    <span className="text-slate-400 text-[9px] font-medium">{msg.date}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-medium leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🔗 LINK DIRECTORY LIST - Styled like a premium Shadcn/ui Component */}
        <section 
          id="links-directory"
          className="w-full flex flex-col gap-2.5 animate-fade-in-up mt-1"
        >
          {linksData.map((link) => (
            <a 
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full bg-white border border-slate-200/60 rounded-[12px] px-5 py-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                {/* Modern Brand Icon Container with subtle animation wrapper */}
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors duration-300">
                  {renderLinkIcon(link.icon)}
                </div>
                
                {/* Title */}
                <span className="text-[13px] font-bold text-slate-700 tracking-wide group-hover:text-slate-900 transition-colors">
                  {link.title}
                </span>
              </div>
              
              {/* Sleek External Link Icon */}
              <div className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </a>
          ))}
        </section>

        {/* Footer Brand info */}
        <div className="mt-8 text-slate-300 text-[9px] font-extrabold tracking-widest uppercase">
          © 2026 TAEIN JIN. ALL RIGHTS RESERVED.
        </div>

      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div 
          id="toast-notification"
          className="fixed bottom-6 px-5 py-3 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2 z-50 animate-scale-in"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Visitor Message Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-extrabold text-base">응원 메시지 남기기</h3>
              <button 
                id="close-message-modal-btn-top"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">작성자 닉네임</label>
                <input 
                  id="visitor-name-input"
                  type="text" 
                  required
                  placeholder="예: 25학번 동기, 선배"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">메시지 내용</label>
                <textarea 
                  id="visitor-message-input"
                  required
                  rows={3}
                  placeholder="따뜻한 격려나 축하 한 마디를 적어주세요."
                  value={visitorMessage}
                  onChange={(e) => setVisitorMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  id="cancel-message-btn"
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  취소
                </button>
                <button 
                  id="submit-message-btn"
                  type="submit" 
                  className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  메시지 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
