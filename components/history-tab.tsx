"use client";

import { useCrm } from "@/hooks/use-crm-store";
import { fmtDateKr } from "@/lib/utils";

export default function HistoryTab() {
  const { state } = useCrm();

  return (
    <div className="p-7 max-w-[1200px] mx-auto animate-fi">
      <h2 className="text-[22px] font-extrabold mb-5">CRM 히스토리</h2>
      {Object.entries(state.data).map(([iN, iD]) => {
        const comp = Object.entries(iD.lectures).filter(([, l]) => l.status === "completed");
        if (!comp.length) return null;
        return (
          <div key={iN} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: iD.color }} />
              <span className="text-lg font-extrabold" style={{ color: iD.color }}>{iN}</span>
            </div>
            {comp.map(([lN, lD]) => (
              <div
                key={lN}
                className="bg-white border border-border rounded-xl p-[18px] mb-2 ml-5"
                style={{ borderLeft: `4px solid ${iD.color}40` }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-base font-bold">{lN}</span>
                    <span className="text-sm text-muted-foreground ml-2.5">{lD.type}</span>
                  </div>
                  <span className="text-[13px] text-[#aeaeb2]">📅 {fmtDateKr(lD.liveDate)}</span>
                </div>
                <div className="text-[13px] text-muted-foreground mt-1.5">
                  USP: {lD.usps.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
