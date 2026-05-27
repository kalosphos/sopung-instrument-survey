import "./globals.css";

export const metadata = {
  title: "소풍 치배구성 조사",
  description: "악기 보유와 대여 수요를 빠르게 모으는 모바일 설문",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
