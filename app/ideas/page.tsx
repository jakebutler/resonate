import { AppHeader } from "@/components/AppHeader/AppHeader";
import { IdeasPage } from "@/components/IdeasPage/IdeasPage";

export default function IdeasRoute() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader />
      <IdeasPage />
    </div>
  );
}
