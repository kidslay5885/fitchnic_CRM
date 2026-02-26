"use client";

import { useState } from "react";
import { useCrm } from "@/hooks/use-crm-store";
import { COLORS, NEW_LECTURE_INIT, NEW_LECTURE_DEFAULTS } from "@/lib/constants";
import type { NewLectureForm } from "@/lib/types";

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

  const iName = form.isNew ? form.newInstructor : form.instructor;
  const canSubmit = !!iName.trim() && !!form.lectureName.trim() && !!form.liveDate;

  const addLecture = () => {
    if (!canSubmit) return;

    const color = state.data[iName]
      ? state.data[iName].color
      : COLORS[Object.keys(state.data).length % COLORS.length];

    dispatch({
      type: "ADD_LECTURE",
      ins: iName,
      lec: form.lectureName,
      color,
      lecture: {
        ...NEW_LECTURE_DEFAULTS,
        liveDate: form.liveDate,
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
        className="bg-white rounded-[18px] w-full max-w-[440px] overflow-auto p-7 shadow-[0_20px_60px_rgba(0,0,0,.15)]"
        style={{ animation: "pop .2s ease" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-extrabold">+ 새 강의 추가</h3>
          <button
            onClick={onClose}
            className="bg-secondary text-muted-foreground text-lg w-[34px] h-[34px] rounded-lg border-none cursor-pointer font-semibold"
          >
            x
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* 1. 강사 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
              1. 강사명 <span className="text-red-500">*</span>
            </div>
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
                placeholder="새 강사명 입력"
                className="w-full mt-2 bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
                autoFocus
              />
            )}
          </div>

          {/* 2. 강의명 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
              2. 강의명 <span className="text-red-500">*</span>
            </div>
            <input
              value={form.lectureName}
              onChange={(e) => update({ lectureName: e.target.value })}
              placeholder="예: 브랜드파이프 5기"
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            />
          </div>

          {/* 3. 라이브 일자 */}
          <div>
            <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
              3. 라이브 일자 <span className="text-red-500">*</span>
            </div>
            <input
              type="date"
              value={form.liveDate}
              onChange={(e) => update({ liveDate: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
            />
          </div>

          <div className="text-[12px] text-[#aeaeb2] bg-[#f8f8fa] rounded-lg px-3.5 py-2.5 leading-relaxed">
            나머지 정보(톤, 타겟, USP 등)는 타임라인 탭의 &quot;정보 수정&quot;에서 입력할 수 있습니다.
          </div>

          <button
            onClick={addLecture}
            disabled={!canSubmit}
            className="w-full bg-gradient-to-br from-primary to-[#764ba2] rounded-xl text-white py-3.5 text-base font-semibold border-none cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            강의 추가하고 타임라인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
