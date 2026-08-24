import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { CustomCursor, ScrollProgressBar } from "./CustomCursor";
import { PageLoadingScreen } from "./PageLoadingScreen";
import { TopBar } from "./TopBar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollProgressBar />
      <CustomCursor />
      <PageLoadingScreen />
      {/* TopBar (h-9 = 36px) + Header (h-20 = 80px) → pt-[116px] */}
      <TopBar />
      <Header />
      <main className="flex-grow pt-[116px]">
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
