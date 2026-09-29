import type { Metadata, Viewport } from "next";
import { AudienceApp } from "@/components/audience/AudienceApp";

export const metadata: Metadata = {
  title: "Join the E2EE demo",
  description: "Your phone becomes an end-to-end encrypted endpoint.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function JoinPage() {
  return <AudienceApp />;
}
