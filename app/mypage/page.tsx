"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LinkItem } from "../data/links";
import { db, auth, googleProvider } from "../../lib/firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc,
  where,
  setDoc,
  getDoc
} from "firebase/firestore";

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user profile and links
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLinks([]);
        setUsername("");
        return;
      }
      
      try {
        // 1. Fetch User Profile (for username)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || "");
        }

        // 2. Fetch User Links
        const q = query(
          collection(db, "links"), 
          where("uid", "==", user.uid),
          orderBy("createdAt", "asc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedLinks: LinkItem[] = [];
        querySnapshot.forEach((docSnapshot) => {
          fetchedLinks.push({ id: docSnapshot.id, ...docSnapshot.data() } as LinkItem);
        });
        setLinks(fetchedLinks);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setErrorMsg("⚠️ 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchData();
  }, [user]);

  // Auth Actions
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      triggerToast("👋 반갑습니다!");
    } catch (error) {
      console.error("Login failed: ", error);
      triggerToast("⚠️ 로그인에 실패했습니다.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      triggerToast("🔒 로그아웃되었습니다.");
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  // Profile Action
  const handleSaveUsername = async () => {
    if (!user) return;
    if (!username.trim()) {
      triggerToast("⚠️ 사용자 이름을 입력해 주세요.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,15}$/.test(cleanUsername)) {
      triggerToast("⚠️ 3~15자의 영문 소문자, 숫자, -, _만 가능합니다.");
      return;
    }

    try {
      // Check if username is taken by someone else
      const q = query(collection(db, "users"), where("username", "==", cleanUsername));
      const snapshot = await getDocs(q);
      const isTaken = snapshot.docs.some(d => d.id !== user.uid);
      
      if (isTaken) {
        triggerToast("⚠️ 이미 사용 중인 이름입니다.");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        username: cleanUsername,
        displayName: user.displayName,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      triggerToast("✅ 사용자 이름이 설정되었습니다.");
    } catch (error) {
      console.error("Error saving username: ", error);
      triggerToast("⚠️ 저장 중 오류가 발생했습니다.");
    }
  };

  // Validation and Create link action
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("⚠️ 링크 제목을 입력해 주세요.");
      return;
    }
    if (!url.trim()) {
      setErrorMsg("⚠️ 링크 URL을 입력해 주세요.");
      return;
    }

    const normalizedUrl = url.trim();
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    if (!urlPattern.test(normalizedUrl)) {
      setErrorMsg("⚠️ 유효한 URL 형식이 아닙니다.");
      return;
    }

    let finalUrl = normalizedUrl;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      finalUrl = `https://${normalizedUrl}`;
    }

    let detectedIcon: "instagram" | "youtube" | "blog" = "blog";
    const lowerTitle = title.toLowerCase();
    const lowerUrl = finalUrl.toLowerCase();
    if (lowerTitle.includes("instagram") || lowerUrl.includes("instagram.com")) {
      detectedIcon = "instagram";
    } else if (lowerTitle.includes("youtube") || lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      detectedIcon = "youtube";
    }

    try {
      const docRef = await addDoc(collection(db, "links"), {
        uid: user.uid,
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

      setLinks([...links, newLink]);
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

  const handleUpdateLink = async (id: string) => {
    if (!editTitle.trim() || !editUrl.trim()) {
      triggerToast("⚠️ 모든 필드를 입력해 주세요.");
      return;
    }

    let finalUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

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
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#003C71]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[400px] flex flex-col gap-5 items-center relative z-10">
        
        <div className="w-full flex items-center justify-between px-1">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            마이링크 관리자
          </h1>
          
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={handleSignOut}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                로그아웃
              </button>
            )}
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
        </div>

        {isAuthLoading ? (
          <div className="w-full bg-white rounded-[16px] border border-slate-100 p-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <div className="w-full bg-white rounded-[16px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center text-center animate-scale-in">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2">관리자 로그인</h2>
            <p className="text-slate-500 text-xs font-medium mb-8 leading-relaxed">링크를 관리하려면 로그인이 필요합니다.<br/>구글 계정으로 간편하게 시작하세요.</p>
            <button 
              onClick={handleSignIn}
              className="w-full py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.2 1.2-3.08 2.16-5.92 2.16-4.72 0-8.64-3.84-8.64-8.56s3.92-8.56 8.64-8.56c2.56 0 4.44.96 5.84 2.24l2.24-2.24C18.16 1.44 15.44 0 12.48 0 5.68 0 0 5.68 0 12.48s5.68 12.48 12.48 12.48c3.76 0 6.64-1.2 8.88-3.52 2.32-2.32 3.12-5.52 3.12-8.16 0-.8-.08-1.52-.16-2.24h-11.84z"/>
              </svg>
              Google로 시작하기
            </button>
          </div>
        ) : (
          <>
            {/* 👤 PROFILE SETTINGS CARD */}
            <div className="w-full bg-white rounded-[16px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">내 프로필 설정</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">공개 페이지 주소</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">/</span>
                      <input 
                        type="text" 
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full py-2.5 bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleSaveUsername}
                      className="px-4 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
                    >
                      저장
                    </button>
                  </div>
                  <p className="mt-1.5 text-[9px] text-slate-400 font-medium">영문 소문자, 숫자, -, _ 만 사용 가능합니다.</p>
                  {username && (
                    <Link 
                      href={`/${username}`}
                      target="_blank"
                      className="mt-2 inline-flex items-center text-[10px] font-bold text-teal-600 hover:text-teal-700"
                    >
                      내 공개 페이지 보기 ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full bg-white rounded-[16px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">새 링크 추가</h2>
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200/60 rounded-lg flex items-start gap-2 animate-scale-in">
                  <span className="text-[11px] font-bold text-red-700 leading-relaxed">{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">링크 이름</label>
                  <input 
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
                    type="text" 
                    placeholder="예: instagram.com/username"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950/5 focus:border-slate-800 transition-all placeholder:text-slate-300"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
                >
                  링크 추가하기
                </button>
              </form>
            </div>

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
                            >저장</button>
                            <button 
                              onClick={cancelEditing}
                              className="flex-1 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold"
                            >취소</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col gap-1 items-start text-left max-w-[220px]">
                            <span className="text-[12px] font-bold text-slate-700 tracking-wide truncate w-full">{link.title}</span>
                            <span className="text-[9px] font-medium text-slate-400 truncate w-full">{link.url}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditing(link)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-[0.95]" title="수정">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => confirmDelete(link.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-[0.95]" title="삭제">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col items-center text-center animate-scale-in">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4"><svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <h3 className="text-slate-800 font-extrabold text-base mb-2">링크 삭제 확인</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">정말 이 링크를 삭제하시겠습니까?<br/>삭제된 데이터는 복구할 수 없습니다.</p>
            <div className="flex gap-2 w-full">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">취소</button>
              <button onClick={handleDeleteLink} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition-all">삭제하기</button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-6 px-5 py-3 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2 z-50 animate-scale-in">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
