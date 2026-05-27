export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: "instagram" | "youtube" | "blog";
  clicks?: number;
}

export const linksData: LinkItem[] = [
  {
    id: "instagram",
    title: "인스타그램 (Instagram)",
    url: "https://www.instagram.com",
    icon: "instagram",
  },
  {
    id: "youtube",
    title: "유튜브 (YouTube)",
    url: "https://www.youtube.com",
    icon: "youtube",
  },
  {
    id: "blog",
    title: "네이버 블로그 (Blog)",
    url: "https://blog.naver.com",
    icon: "blog",
  },
];
