"use client";

import { useCrm } from "@/hooks/use-crm-store";
import type { TabId } from "@/lib/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "📊 대시보드" },
  { id: "board", label: "📋 타임라인" },
  { id: "history", label: "📁 히스토리" },
];

export default function NavHeader() {
  const { state, dispatch } = useCrm();

  return (
    <div className="bg-white border-b border-border px-7 sticky top-0 z-[100] shadow-[0_1px_3px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between h-[60px]">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-primary to-[#764ba2] flex items-center justify-center text-[15px] font-extrabold text-white">
              F
            </div>
            <span className="text-[17px] font-extrabold">CRM 생성기</span>
          </div>
          <div className="flex gap-0.5 bg-secondary rounded-[10px] p-[3px]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: "SET_TAB", tab: t.id })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-none ${
                  state.tab === t.id
                    ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,.08)]"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {state.feedbacks.length > 0 && (
          <span className="text-[13px] text-[#f39c12] font-semibold">
            💬 피드백 {state.feedbacks.length}건
          </span>
        )}
      </div>
    </div>
  );
}
