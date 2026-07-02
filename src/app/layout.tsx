import type { Metadata } from "next";

import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Addicted2",
  description: "단톡방에서 공유한 링크를 날짜별로 모으는 작은 아카이브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
