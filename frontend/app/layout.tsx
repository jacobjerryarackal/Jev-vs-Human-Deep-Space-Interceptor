import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deep Space Interceptor: Jev vs Human Reflexes",
  description:
    "Scientific space interceptor duel benchmarking human biological reaction latency (~240ms) against Jev's fast System 1 decision API (~100ms).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen max-h-screen w-screen overflow-hidden bg-[#040711]">
      <body className="h-screen max-h-screen w-screen overflow-hidden bg-[#040711] text-slate-100 flex flex-col m-0 p-0 antialiased select-none">
        {children}
      </body>
    </html>
  );
}
