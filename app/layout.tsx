import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resonate",
  description: "Publishing schedule manager for Corvo Labs",
};

const isProductionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
  (isProductionBuild ? "pk_test_Y2xlcmsuYnVpbGQubG9jYWwk" : undefined);
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL?.trim() ||
  (isProductionBuild ? "https://build-placeholder.convex.cloud" : undefined);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body className={`${inter.variable} antialiased`}>
          <ConvexClientProvider url={convexUrl}>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
