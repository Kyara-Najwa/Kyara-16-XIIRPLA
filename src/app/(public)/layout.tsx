import type { Metadata } from "next";
import { StarsBackground } from "@/components/backgrounds/StarsBackground";
import { Navbar } from "@/components/public/Navbar";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Public pages",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden overflow-y-scroll scrollbar-hide">
      <StarsBackground className="opacity-60 pointer-events-none -z-10" />
      <Navbar />
      <div style={{ zoom: 0.9 }}>
        <main className="relative z-10">{children}</main>
      </div>
    </div>
  );
}
