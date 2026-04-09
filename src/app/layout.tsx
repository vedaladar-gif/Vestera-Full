import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TermsGate from "@/components/TermsGate";
import SnapseWidget from "@/components/SnapseWidget";
import ThemeProvider from "@/components/ThemeProvider";
import { AlertToastProvider } from "@/components/AlertToastProvider";

export const metadata: Metadata = {
  title: "Vestera - Professional Paper Trading",
  description: "Experience professional-grade paper trading with real market data, advanced charting tools, and AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Anti-FOUC: apply saved theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('vt-theme') || 'dark';
            var resolved = t === 'system'
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
              : (t === 'light' ? 'light' : 'dark');
            document.documentElement.setAttribute('data-theme', resolved);
          } catch(e) {}
        ` }} />
      </head>
      <body>
        <AlertToastProvider>
          <div className="app-root">
            <ThemeProvider />
            <Navbar />
            <TermsGate />
            <div className="app-main">
              <div className="container app-main-inner">{children}</div>
              <Footer />
            </div>
            <SnapseWidget />
          </div>
        </AlertToastProvider>
      </body>
    </html>
  );
}
