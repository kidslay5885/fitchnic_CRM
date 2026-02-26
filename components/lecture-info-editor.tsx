"use client";

import { useCrm, useCurrentLecture } from "@/hooks/use-crm-store";
import { TONE_PRESETS, TARGET_PRESETS, TYPE_PRESETS } from "@/lib/constants";
import TagPicker from "./tag-picker";

export default function LectureInfoEditor() {
  const { state, dispatch } = useCrm();
  const ld = useCurrentLecture();
  if (!ld) return null;

  const { ins, lec } = state;

  const updateLd = (field: string, value: unknown) => {
    dispatch({ type: "UPDATE_LECTURE_FIELD", ins, lec, field, value });
  };

  return (
    <div className="animate-fi">
      <TagPicker label="톤앤매너" options={TONE_PRESETS} value={ld.tone} onChange={(v) => updateLd("tone", v)} />
      <TagPicker label="타겟" options={TARGET_PRESETS} value={ld.target} onChange={(v) => updateLd("target", v)} />
      <TagPicker label="강의 유형" options={TYPE_PRESETS} value={ld.type} onChange={(v) => updateLd("type", v)} />

      <div className="grid grid-cols-2 gap-2.5 mt-2">
        {([
          { l: "라이브 날짜", f: "liveDate" },
          { l: "라이브 시간", f: "liveTime" },
          { l: "전자책", f: "ebook" },
          { l: "강사스토리", f: "story" },
        ] as const).map(({ l, f }) => (
          <div key={f}>
            <div className="text-xs text-muted-foreground mb-0.5 font-semibold">{l}</div>
            <input
              value={(ld[f] as string) || ""}
              onChange={(e) => updateLd(f, e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </div>

      {/* 링크 관리 */}
      <div className="mt-2.5 bg-primary/5 rounded-[10px] p-3">
        <div className="text-[13px] text-primary font-bold mb-2">🔗 링크 관리 (복사 시 자동 치환)</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { l: "무료 톡방", f: "freeUrl" },
            { l: "유튜브 라이브", f: "youtubeUrl" },
            { l: "결제 페이지", f: "payUrl" },
            { l: "전자책 다운", f: "ebookUrl" },
          ] as const).map(({ l, f }) => (
            <div key={f}>
              <div className="text-xs text-muted-foreground mb-0.5 font-semibold">{l}</div>
              <input
                value={(ld[f] as string) || ""}
                onChange={(e) => updateLd(f, e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* USP */}
      <div className="mt-2.5">
        <div className="text-xs text-muted-foreground mb-0.5 font-semibold">핵심 USP</div>
        {(ld.usps || []).map((u, i) => (
          <input
            key={i}
            value={u}
            onChange={(e) => {
              const nu = [...ld.usps];
              nu[i] = e.target.value;
              updateLd("usps", nu);
            }}
            placeholder={`USP ${i + 1}`}
            className="w-full bg-secondary border border-border rounded-lg text-foreground px-3 py-2 text-sm outline-none mb-1 focus:ring-1 focus:ring-primary"
          />
        ))}
      </div>

      {/* 성과증거 */}
      <div className="mt-1.5">
        <div className="text-xs text-muted-foreground mb-0.5 font-semibold">성과증거</div>
        {(ld.proof || []).map((p, i) => (
          <input
            key={i}
            value={p}
            onChange={(e) => {
              const np = [...ld.proof];
              np[i] = e.target.value;
              updateLd("proof", np);
            }}
            placeholder={`성과 ${i + 1}`}
            className="w-full bg-secondary border border-border rounded-lg text-foreground px-3 py-2 text-sm outline-none mb-1 focus:ring-1 focus:ring-primary"
          />
        ))}
      </div>
    </div>
  );
}
