import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/lora";
import "@fontsource-variable/lora/wght-italic.css";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/dancing-script";
import "./globals.css";
import "./archipelago.css";

export const metadata: Metadata = {
  title: { default: "EIU YouthVerse — Hoist the Sails", template: "%s | EIU YouthVerse" },
  description: "Khơi buồm hành trình sinh viên. Khám phá quần đảo hoạt động, tin tức và câu lạc bộ trong thế giới 3D EIU YouthVerse. Bản trải nghiệm demo.",
  applicationName: "EIU YouthVerse",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#cce8f4" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser cursor extensions mutate these root attributes before hydration; application children remain checked.
  return <html lang="vi" suppressHydrationWarning><body suppressHydrationWarning><a href="#main-content" className="skip-link">Đến nội dung chính</a>{children}</body></html>;
}
