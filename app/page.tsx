"use client";

import { CrmProvider, useCrm } from "@/hooks/use-crm-store";
import NavHeader from "@/components/nav-header";
import DashboardTab from "@/components/dashboard-tab";
import BoardTab from "@/components/board-tab";
import HistoryTab from "@/components/history-tab";

function MainContent() {
  const { state } = useCrm();

  if (!state.hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-lg font-semibold">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      {state.tab === "dashboard" && <DashboardTab />}
      {state.tab === "board" && <BoardTab />}
      {state.tab === "history" && <HistoryTab />}
    </div>
  );
}

export default function Page() {
  return (
    <CrmProvider>
      <MainContent />
    </CrmProvider>
  );
}
