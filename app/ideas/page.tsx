import { UserButton } from "@clerk/nextjs";
import { AudioWaveform, Settings } from "lucide-react";
import Link from "next/link";
import { IdeasPage } from "@/components/IdeasPage/IdeasPage";

export default function IdeasRoute() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <AudioWaveform size={20} className="text-[#001524]" />
          <span className="font-forum text-lg font-semibold text-[#001524]">Resonate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/setup"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#001524] transition-colors"
          >
            <Settings size={15} />
            Reconfigure
          </Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <IdeasPage />
    </div>
  );
}
