"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LinkItem } from "../data/links";
import { db } from "../../lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc 
} from "firebase/firestore";

export default function MyPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Load links from Firestore on mount
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, "links"), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedLinks: LinkItem[] = [];
        querySnapshot.forEach((docSnapshot) => {
          fetchedLinks.push({ id: docSnapshot.id, ...docSnapshot.data() } as LinkItem);
        });
        setLinks(fetchedLinks);
      } catch (error) {
        console.error("Error fetching links: ", error);
        setErrorMsg("⚠️ 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchLinks();
  }, []);

  // Validation and Create link action
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validation - Empty inputs check
    if (!title.trim()) {
      setErrorMsg("⚠️ 링크 제목을 입력해 주세요.");
      return;
    }
    if (!url.trim()) {
      setErrorMsg("⚠️ 링크 URL을 입력해 주세요.");
      return;
    }

    // 2. Validation - URL format check (simple regex for basic domain structure)
    const normalizedUrl = url.trim();
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    if (!urlPattern.test(normalizedUrl)) {
      setErrorMsg("⚠️ 유효한 URL 형식이 아닙니다. (예: example.com 또는 https://example.com)");
      return;
    }

    // Auto-normalize protocol: Prepend https:// if no protocol provided
    let finalUrl = normalizedUrl;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      finalUrl = `https://${normalizedUrl}`;
    }

    // Auto-map icons based on URL/Title contents
    let detectedIcon: "instagram" | "youtube" | "blog" = "blog";
    const lowerTitle = title.toLowerCase();
    const lowerUrl = finalUrl.toLowerCase();
    if (lowerTitle.includes("instagram") || lowerUrl.includes("instagram.com")) {
      detectedIcon = "instagram";
    } else if (lowerTitle.includes("youtube") || lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      detectedIcon = "youtube";
    }

    try {
      // 3. Create link item in Firestore
      const docRef = await addDoc(collection(db, "links"), {
        title: title.trim(),
        url: finalUrl,
        icon: detectedIcon,
        createdAt: new Date().toISOString(),
      });

      const newLink: LinkItem = {
        id: docRef.id,
        title: title.trim(),
        url: finalUrl,
        icon: detectedIcon,
      };

      // 4. Update state
      setLinks([...links, newLink]);

      // 5. Success state cleanup
      setTitle("");
      setUrl("");
      triggerToast("✨ 새 링크가 추가되었습니다!");
    } catch (error) {
      console.error("Error adding link: ", error);
      setErrorMsg("⚠️ 링크를 추가하는 중 오류가 발생했습니다.");
    }
  };

  // Inline Edit Toggle
  const startEditing = (link: LinkItem) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
  };

  // Update Link Action
  const handleUpdateLink = async (id: string) => {
    if (!editTitle.trim() || !editUrl.trim()) {
      triggerToast("⚠️ 모든 필드를 입력해 주세요.");
      return;
    }

    let finalUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    // Auto-map icons based on URL/Title contents
    let detectedIcon: "instagram" | "youtube" | "blog" = "blog";
    const lowerTitle = editTitle.toLowerCase();
    const lowerUrl = finalUrl.toLowerCase();
    if (lowerTitle.includes("instagram") || lowerUrl.includes("instagram.com")) {
      detectedIcon = "instagram";
    } else if (lowerTitle.includes("youtube") || lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      detectedIcon = "youtube";
    }

    try {
      const linkRef = doc(db, "links", id);
      await updateDoc(linkRef, {
        title: editTitle.trim(),
        url: finalUrl,
        icon: detectedIcon,
      });

      setLinks(links.map(link => 
        link.id === id 
          ? { ...link, title: editTitle.trim(), url: finalUrl, icon: detectedIcon } 
          : link
      ));
      
      setEditingId(null);
      triggerToast("✅ 링크가 수정되었습니다.");
    } catch (error) {
      console.error("Error updating link: ", error);
      triggerToast("⚠️ 수정 중 오류가 발생했습니다.");
    }
  };

  // Delete Link Action with confirmation
  const confirmDelete = (id: string) => {
    setLinkToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      await deleteDoc(doc(db, "links", linkToDelete));
      const updated = links.filter((link) => link.id !== linkToDelete);
      setLinks(updated);
      setIsDeleteModalOpen(false);
      setLinkToDelete(null);
      triggerToast("🗑️ 링크가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting link: ", error);
      triggerToast("⚠️ 삭제 중 오류가 발생했습니다.");
    }
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-[#f5f5f5] font-sans relative overflow-hidden select-none">
      
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#003C71]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[400px] flex flex-col gap-5 items-center relative z-10">
        
        {/* Navigation Header */}
        <div className="w-full flex items-center justify-between px-1">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            마이링크 관리자
          </h1>
          
          {/* Back button link to main card view */}
          <Link 
            href="/" 
            className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg px-3 py-1.5 shadow-sm transition-all flex items-center gap-1 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            홈으로
          </Link>
        </div>

        {/* 📝 FORM CARD - Shadcn/ui Alert & Form Aesthetic */}
        <div className="w-full bg-white rounded-[16px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6">
          
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">새 링크 추가</h2>

          {/* Validation Warning Alert (shadcn-like style) */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200/60 rounded-lg flex items-start gap-2 animate-scale-in">
              <span className="text-[11px] font-bold text-red-700 leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddLink} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">링크 이름</label>
              <input 
                id="link-title-input"
                type="text" 
                placeholder="예: 내 인스타그램"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-800 transition-all placeholder:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">링크 URL</label>
              <input 
                id="link-url-input"
                type="text" 
                placeholder="예: instagram.com/username"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-800 transition-all placeholder:text-slate-300"
              />
            </div>

            <button 
              id="add-link-btn"
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
            >
              링크 추가하기
            </button>
          </form>
        </div>

        {/* 📋 CURRENT LINKS MANAGER SECTION */}
        <div className="w-full flex flex-col gap-2.5 mt-1">
          <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">등록된 링크 목록 ({links.length})</h2>
          
          <div className="space-y-2 w-full">
            {links.length === 0 ? (
              <div className="w-full bg-white border border-dashed border-slate-200 rounded-[12px] p-8 text-center text-xs font-bold text-slate-400">
                등록된 링크가 없습니다. 새 링크를 추가해보세요!
              </div>
            ) : (
              links.map((link) => (
                <div 
                  key={link.id}
                  className="w-full bg-white border border-slate-200/60 rounded-[12px] p-4 flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all hover:border-slate-300"
                >
                  {editingId === link.id ? (
                    // INLINE EDIT MODE
                    <div className="w-full space-y-3 p-1">
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 transition-all"
                        placeholder="링크 이름"
                      />
                      <input 
                        type="text" 
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 focus:outline-none focus:border-slate-800 transition-all"
                        placeholder="링크 URL"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateLink(link.id)}
                          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          저장
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="flex-1 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col gap-1 items-start text-left max-w-[220px]">
                        <span className="text-[12px] font-bold text-slate-700 tracking-wide truncate w-full">{link.title}</span>
                        <span className="text-[9px] font-medium text-slate-400 truncate w-full">{link.url}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Inline Edit Button */}
                        <button
                          onClick={() => startEditing(link)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-[0.95]"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => confirmDelete(link.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-[0.95]"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center animate-scale-in">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-extrabold text-base mb-2">링크 삭제 확인</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">정말 이 링크를 삭제하시겠습니까?<br/>삭제된 데이터는 복구할 수 없습니다.</p>
            
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleDeleteLink}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {showToast && (
        <div 
          id="toast-notification"
          className="fixed bottom-6 px-5 py-3 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2 z-50 animate-scale-in"
        >
          <span>{toastMessage}</span>
        </div>
      )}

    </main>
  );
}
