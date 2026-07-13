import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import TermsGate from "@/components/TermsGate";
import SnapseWidget from "@/components/SnapseWidget";
import ThemeProvider from "@/components/ThemeProvider";
import { AlertToastProvider } from "@/components/AlertToastProvider";
import GuestModeSync from "@/components/GuestModeSync";
import OnboardingTour from "@/components/OnboardingTour";

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
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Anti-FOUC: apply saved theme before first paint (default: light) */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme','light');` }} />
      </head>
      <body>
        <AlertToastProvider>
          <div className="app-root">
            <ThemeProvider />
            <GuestModeSync />
            <div className="nav-float-shell">
              <Navbar />
            </div>
            <TermsGate />
            <div className="app-main">
              <div className="app-main-inner">{children}</div>
              <ConditionalFooter />
            </div>
            <SnapseWidget />
            <OnboardingTour />
          </div>
        </AlertToastProvider>
      </body>
    </html>
  );
}
