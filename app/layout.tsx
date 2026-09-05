import type { Metadata } from "next";
import "./globals.css";
import { ThemeInit } from "@/components/ThemeInit";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Content Autopilot",
  description: "Drive-to-social AI content automation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeInit />
          {children}
        </Providers>
      </body>
    </html>
  );
}
