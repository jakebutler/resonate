"use client";

import { useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

export function ConvexClientProvider({
  children,
  url,
}: {
  children: React.ReactNode;
  url?: string;
}) {
  const clientRef = useRef<ConvexReactClient | null>(null);

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_CONVEX_URL");
  }

  if (!clientRef.current) {
    clientRef.current = new ConvexReactClient(url);
  }

  return (
    <ConvexProviderWithClerk client={clientRef.current} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
