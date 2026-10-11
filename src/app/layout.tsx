import type { Metadata } from "next";
import "./globals.css";
import { AudioProvider } from "@/components/AudioController";
import { ChannelTransitionProvider } from "@/components/ChannelTransition";
import { AuthProvider } from "@/lib/auth-context";
import ClerkProviderWrapper from "@/components/ClerkProviderWrapper";

export const metadata: Metadata = {
  title: "Ovel — The Flat-Price Booking-to-Paid Operating Platform",
  description:
    "Unifying Quote → Book → Remind → Invoice → Paid for salons, aesthetic clinics, and specialists. 0% transaction commission fees.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased bg-[#F6FAF9] text-[#103438]">
        <ClerkProviderWrapper>
          <AuthProvider>
            <AudioProvider>
              <ChannelTransitionProvider>
                {children}
              </ChannelTransitionProvider>
            </AudioProvider>
          </AuthProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
