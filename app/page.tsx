"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { linksData, LinkItem } from "./data/links";

export default function Home() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch links from Firestore
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, "links"), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedLinks: LinkItem[] = [];
        querySnapshot.forEach((doc) => {
          fetchedLinks.push({ id: doc.id, ...doc.data() } as LinkItem);
        });
        
        if (fetchedLinks.length === 0) {
          setLinks(linksData);
        } else {
          setLinks(fetchedLinks);
        }
      } catch (error) {
        console.error("Error fetching links: ", error);
        setLinks(linksData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, []);

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

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#1B3A6B]/10 selection:text-[#1B3A6B]">
      {/* Background Accent */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#1B3A6B] z-50" />
      
      <main className="max-w-[1024px] mx-auto px-6 py-16 md:py-24 flex flex-col items-center">
        
        {/* Profile Card Container */}
        <div className="w-full max-w-[480px] bg-white border border-slate-100 shadow-[0_10px_30px_rgba(27,58,107,0.05)] rounded-3xl p-8 md:p-10 flex flex-col items-center transition-all duration-500 hover:shadow-[0_15px_40px_rgba(27,58,107,0.08)]">
          
          {/* Institution Logo */}
          <div className="w-full flex justify-center mb-8">
            <div className="relative h-8 w-48">
              <Image 
                src="/hanyang-logo.png" 
                alt="Hanyang University Logo" 
                fill 
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>

          {/* Profile Image (Initials JT) */}
          <div className="relative mb-8">
            <div className="w-[120px] h-[120px] rounded-full border-2 border-[#1B3A6B] flex items-center justify-center bg-white shadow-inner overflow-hidden">
              <span className="text-[#1B3A6B] text-3xl font-light tracking-widest">JT</span>
            </div>
          </div>

          {/* Identity Section */}
          <div className="text-center space-y-3 mb-10 w-full">
            <h1 className="text-3xl font-bold text-[#1B3A6B] tracking-tight">
              진태인
            </h1>
            <p className="text-[#1B3A6B]/80 font-medium text-sm tracking-wide">
              연구하는 미래 의사과학자
            </p>
            <div className="flex flex-col items-center gap-1 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Affiliation
              </span>
              <span className="text-sm font-semibold text-slate-700">
                Hanyang University College of Medicine
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 gap-3 mb-12">
            <a 
              href="https://instagram.com/taein_terry_05" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#1B3A6B] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#152e55] transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              @taein_terry_05
            </a>
            
            <a 
              href="mailto:terry050513@hanyang.ac.kr"
              className="w-full py-3.5 bg-white border border-[#1B3A6B]/20 text-[#1B3A6B] rounded-xl text-xs font-bold shadow-sm hover:bg-[#1B3A6B]/5 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              terry050513@hanyang.ac.kr
            </a>
          </div>

          {/* Link Tree Section (Dynamic) */}
          <div className="w-full space-y-3 mb-12">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 pl-1">
              Resource Links
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin" />
              </div>
            ) : (
              links.map((link) => (
                <a 
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link.id)}
                  className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-100 rounded-xl flex items-center justify-between transition-all hover:bg-white hover:border-[#1B3A6B]/20 group active:scale-[0.99]"
                >
                  <span className="text-[13px] font-bold text-slate-600 group-hover:text-[#1B3A6B] transition-colors">
                    {link.title}
                  </span>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1B3A6B] transition-all">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </a>
              ))
            )}
          </div>

          {/* Motto Section */}
          <div className="w-full pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-xs italic font-serif leading-relaxed px-4">
              &quot;손이 타버릴 듯 뜨거울지라도 담고 싶은 태양이 있다면 죽어도 놓치지 말 것&quot;
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <Link 
            href="/mypage" 
            className="text-[10px] font-bold text-slate-300 hover:text-[#1B3A6B] uppercase tracking-widest transition-colors"
          >
            Manage Profile
          </Link>
          <div className="text-slate-200 text-[9px] font-black tracking-[0.3em] uppercase">
            © 2026 TAEIN JIN. ALL RIGHTS RESERVED.
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media (max-width: 360px) {
          main { padding-left: 1rem; padding-right: 1rem; }
          .identity-section h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
