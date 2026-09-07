import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

// DESIGN.md: Hanken Grotesk cho chữ đọc và điều hướng; JetBrains Mono cho
// "mission-critical data" — mã phòng, số tiền, chỉ số công tơ. Chữ số đơn cách
// giữ cột số thẳng hàng khi quét nhanh bảng dày dữ liệu.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rentory",
  description: "Quản lý hóa đơn phòng trọ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${hankenGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        <QueryProvider>{children}</QueryProvider>
        {/* App không có theme toggle; không ghim sáng thì toast tự tối theo OS */}
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
