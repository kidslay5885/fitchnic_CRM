"use client";

import { useState } from "react";
import { useCrm } from "@/hooks/use-crm-store";
import { TONE_PRESETS, TARGET_PRESETS, TYPE_PRESETS, COLORS, NEW_LECTURE_INIT } from "@/lib/constants";
import type { NewLectureForm } from "@/lib/types";
import TagPicker from "./tag-picker";

interface AddLectureDialogProps {
  defaultInstructor?: string;
  onClose: () => void;
}

export default function AddLectureDialog({ defaultInstructor, onClose }: AddLectureDialogProps) {
  const { state, dispatch } = useCrm();
  const [form, setForm] = useState<NewLectureForm>({
    ...NEW_LECTURE_INIT,
    instructor: defaultInstructor || "",
  });

  const update = (partial: Partial<NewLectureForm>) => setForm((p) => ({ ...p, ...partial }));

  const addLecture = () => {
    const iName = form.isNew ? form.newInstructor : form.instructor;
    if (!iName || !form.lectureName) return;

    const color = state.data[iName]
      ? state.data[iName].color
      : COLORS[Object.keys(state.data).length % COLORS.length];

    dispatch({
      type: "ADD_LECTURE",
      ins: iName,
      lec: form.lectureName,
      color,
      lecture: {
        type: form.type,
        tone: form.tone,
        platform: form.platform,
        usps: form.usps.filter(Boolean),
        proof: form.proof.filter(Boolean),
        target: form.target,
        story: form.story,
        ebook: form.ebook,
        freeUrl: form.freeUrl,
        youtubeUrl: form.youtubeUrl,
        payUrl: form.payUrl,
        ebookUrl: form.ebookUrl,
        liveDate: form.liveDate,
        liveTime: form.liveTime,
        status: "active",
      },
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex justify-center items-center p-5"
    >
      <div
        className="bg-white rounded-[18px] w-full max-w-[600px] max-h-[90vh] overflow-auto p-7 shadow-[0_20px_60px_rgba(0,0,0,.15)]"
        style={{ animation: "pop .2s ease" }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-extrabold">➕ 새 강의 추가</h3>
          <button
            onClick={onClose}
            className="bg-secondary text-muted-foreground text-lg w-[34px] h-[34px] rounded-lg border-none cursor-pointer font-semibold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* 강사 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">강사</div>
            <select
              value={form.isNew ? "__new__" : form.instructor}
              onChange={(e) => {
                if (e.target.value === "__new__") update({ isNew: true, instructor: "" });
                else update({ isNew: false, instructor: e.target.value, newInstructor: "" });
              }}
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            >
              <option value="">기존 강사 선택</option>
              {Object.keys(state.data).map((n) => (
                <option key={n}>{n}</option>
              ))}
              <option value="__new__">+ 새 강사</option>
            </select>
            {form.isNew && (
              <input
                value={form.newInstructor}
                onChange={(e) => update({ newInstructor: e.target.value })}
                placeholder="새 강사명"
                className="w-full mt-2 bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            )}
          </div>

          {/* 강의명 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">강의명 + 기수</div>
            <input
              value={form.lectureName}
              onChange={(e) => update({ lectureName: e.target.value })}
              placeholder="예: 브랜드파이프 5기"
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            />
          </div>

          <TagPicker label="톤앤매너" options={TONE_PRESETS} value={form.tone} onChange={(v) => update({ tone: v })} />
          <TagPicker label="타겟" options={TARGET_PRESETS} value={form.target} onChange={(v) => update({ target: v })} />
          <TagPicker label="강의 유형" options={TYPE_PRESETS} value={form.type} onChange={(v) => update({ type: v })} />

          {/* 라이브 날짜 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">라이브 날짜</div>
            <input
              type="date"
              value={form.liveDate}
              onChange={(e) => update({ liveDate: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            />
          </div>

          {/* USP */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">핵심 USP</div>
            {form.usps.map((u, i) => (
              <input
                key={i}
                value={u}
                onChange={(e) => {
                  const n = [...form.usps];
                  n[i] = e.target.value;
                  update({ usps: n });
                }}
                placeholder={`USP ${i + 1}`}
                className="w-full mb-1 bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            ))}
          </div>

          {/* 성과 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">성과 증거</div>
            {form.proof.map((p, i) => (
              <input
                key={i}
                value={p}
                onChange={(e) => {
                  const n = [...form.proof];
                  n[i] = e.target.value;
                  update({ proof: n });
                }}
                placeholder={`성과 ${i + 1}`}
                className="w-full mb-1 bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            ))}
          </div>

          {/* 스토리/전자책 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="text-[13px] text-muted-foreground mb-1 font-semibold">강사 스토리</div>
              <input
                value={form.story}
                onChange={(e) => update({ story: e.target.value })}
                placeholder="한 줄 스토리"
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            </div>
            <div>
              <div className="text-[13px] text-muted-foreground mb-1 font-semibold">전자책명</div>
              <input
                value={form.ebook}
                onChange={(e) => update({ ebook: e.target.value })}
                placeholder="전자책 이름"
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            </div>
          </div>

          {/* 무료 링크 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1 font-semibold">무료 링크</div>
            <input
              value={form.freeUrl}
              onChange={(e) => update({ freeUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            />
          </div>

          <button
            onClick={addLecture}
            className="w-full mt-2 bg-gradient-to-br from-primary to-[#764ba2] rounded-xl text-white py-3.5 text-base font-semibold border-none cursor-pointer hover:opacity-95"
          >
            강의 추가하고 타임라인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
