"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { LinkItem } from "../data/links";
import Link from "next/link";

interface UserProfile {
  username: string;
  displayName: string;
  email?: string;
}

export default function PublicProfile() {
  const params = useParams();
  const username = params.username as string;

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Click Tracking Function
  const handleLinkClick = async (linkId: string) => {
    try {
      const linkRef = doc(db, "links", linkId);
      await updateDoc(linkRef, {
        clicks: increment(1)
      });
    } catch (err) {
      console.error("Error tracking click:", err);
    }
  };

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!username) return;

      try {
        // 1. Find user by username
        const userQuery = query(
          collection(db, "users"), 
          where("username", "==", username.toLowerCase()),
          limit(1)
        );
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          setError("존재하지 않는 사용자입니다.");
          setIsLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data();
        const uid = userSnapshot.docs[0].id;
        setProfile(userData);

        // 2. Fetch user's links
        const linksQuery = query(
          collection(db, "links"),
          where("uid", "==", uid),
          orderBy("createdAt", "asc")
        );
        const linksSnapshot = await getDocs(linksQuery);
        const fetchedLinks: LinkItem[] = [];
        linksSnapshot.forEach((doc) => {
          fetchedLinks.push({ id: doc.id, ...doc.data() } as LinkItem);
        });
        setLinks(fetchedLinks);

      } catch (err) {
        console.error("Error fetching public data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] p-6 text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">404 - {error}</h1>
        <Link href="/" className="text-sm font-bold text-teal-600">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-[#f5f5f5] font-sans relative overflow-hidden select-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#003C71]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[400px] flex flex-col gap-4 items-center relative z-10">
        
        {/* Profile Card */}
        <div className="w-full bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-8 flex flex-col items-center text-center animate-scale-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[16px] bg-gradient-to-r from-[#003C71] via-[#8C7B50] to-[#003C71]" />
          
          <div className="w-[100px] h-[100px] rounded-full bg-slate-200 border-4 border-slate-50 flex items-center justify-center shadow-sm overflow-hidden mb-6">
            <svg className="w-12 h-12 text-[#003C71]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">{profile?.displayName || username}</h1>
          <p className="text-slate-500 text-sm font-medium mb-6">@{username}</p>
          
          {/* Badge for public page */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-500/10 uppercase tracking-tight">
              PUBLIC PROFILE
            </span>
          </div>
        </div>

        {/* Links List */}
        <section className="w-full flex flex-col gap-2.5">
          {links.length === 0 ? (
            <div className="w-full bg-white border border-dashed border-slate-200 rounded-[12px] p-8 text-center text-xs font-bold text-slate-400">
              표시할 링크가 없습니다.
            </div>
          ) : (
            links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="group w-full bg-white border border-slate-200/60 rounded-[12px] px-5 py-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white transition-colors duration-300">
                    {renderLinkIcon(link.icon)}
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {link.title}
                  </span>
                </div>
                <div className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </a>
            ))
          )}
        </section>

        <div className="mt-8 text-slate-300 text-[9px] font-extrabold tracking-widest uppercase">
          © 2026 {profile?.displayName || username}. POWERED BY MYLINK.
        </div>
      </div>
    </main>
  );
}
