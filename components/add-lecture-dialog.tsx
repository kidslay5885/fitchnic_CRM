"use client";

import { useState, useMemo } from "react";
import { useCrm } from "@/hooks/use-crm-store";
import { COLORS, NEW_LECTURE_INIT, NEW_LECTURE_DEFAULTS } from "@/lib/constants";
import type { NewLectureForm } from "@/lib/types";

/* ─────────── 공통 타입 ─────────── */

interface ParsedRow {
  instructor: string;
  lectureName: string;
  liveDate: string;
  platform?: string;
  valid: boolean;
  partial: boolean;
  raw: string;
}

/* ─────────── 날짜 파싱 ─────────── */

function parseDate(cell: string): string {
  const s = cell.trim();

  // YYYY.MM.DD(요일) or YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:\([^\)]*\))?$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;

  // MM/DD or MM-DD (현재 연도)
  m = s.match(/^(\d{1,2})[/\-](\d{1,2})$/);
  if (m) {
    const year = new Date().getFullYear();
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  // M월 D일
  m = s.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
  if (m) {
    const year = new Date().getFullYear();
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  return "";
}

/* ─────────── 1) 행 목록 파싱 ─────────── */

function parsePastedRows(text: string): ParsedRow[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((raw) => {
      const cells = raw.split(/\t|  +/).map((c) => c.trim()).filter(Boolean);
      let liveDate = "";
      const nonDateCells: string[] = [];

      for (const cell of cells) {
        const d = parseDate(cell);
        if (d && !liveDate) liveDate = d;
        else nonDateCells.push(cell);
      }

      const instructor = nonDateCells[0] || "";
      const lectureName = nonDateCells.slice(1).join(" ") || "";
      const valid = !!instructor && !!lectureName && !!liveDate;
      const partial = !valid && (!!instructor || !!lectureName || !!liveDate);
      return { instructor, lectureName, liveDate, valid, partial, raw };
    });
}

/* ─────────── 2) 달력 시간표 파싱 ─────────── */

const PLATFORM_TAGS = ["핏크닉", "머니업"];
const DAY_RE = /^(\d{1,2})\([일월화수목금토]\)$/;

/** 달력 형식 자동 감지 */
function isCalendarFormat(text: string): boolean {
  return /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/.test(text) && /\d+\([일월화수목금토]\)/.test(text);
}

/** TSV 파서 — 따옴표 안 개행 처리 */
function parseTSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    let cell: string;

    if (text[i] === '"') {
      cell = "";
      i++; // skip "
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') { cell += '"'; i += 2; }
          else { i++; break; }
        } else { cell += text[i]; i++; }
      }
    } else {
      cell = "";
      while (i < len && text[i] !== '\t' && text[i] !== '\n' && text[i] !== '\r') {
        cell += text[i]; i++;
      }
    }

    row.push(cell.trim());

    if (i < len && text[i] === '\t') {
      i++;
    } else {
      if (i < len && text[i] === '\r') i++;
      if (i < len && text[i] === '\n') i++;
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

/** 셀 내 강의 정보 추출 */
function extractLectureFromCell(
  cell: string,
  knownInstructors: string[],
): { instructor: string; lectureName: string; platform: string } | null {
  const lines = cell.split("\n").map((l) => l.trim()).filter(Boolean);

  // 플랫폼 태그 찾기
  const platformLine = lines.find((l) => PLATFORM_TAGS.some((p) => l === `[${p}]`));
  if (!platformLine) return null;
  const platform = platformLine.replace(/[\[\]]/g, "");

  const infoLines = lines.filter((l) => l !== platformLine);
  if (infoLines.length === 0) return null;

  const mainInfo = infoLines[0];

  // 알려진 강사 매칭 (긴 이름 우선)
  const sorted = [...knownInstructors].sort((a, b) => b.length - a.length);
  let instructor = "";
  let lectureName = "";

  for (const ins of sorted) {
    if (mainInfo.startsWith(ins)) {
      instructor = ins;
      lectureName = mainInfo.slice(ins.length).trim();
      break;
    }
  }

  if (!instructor) {
    // 공백 기준 분리
    const sp = mainInfo.indexOf(" ");
    if (sp > 0) {
      instructor = mainInfo.slice(0, sp);
      lectureName = mainInfo.slice(sp + 1);
    } else {
      instructor = mainInfo;
    }
  }

  // lectureName이 비어있으면 다음 줄에서 기수 정보 탐색
  if (!lectureName && infoLines.length > 1) {
    const secondLine = infoLines[1];
    const cohortMatch = secondLine.match(/^(.*?\d+기)/);
    if (cohortMatch) lectureName = cohortMatch[1];
  }

  return { instructor, lectureName, platform };
}

function parseCalendarGrid(text: string, knownInstructors: string[]): ParsedRow[] {
  const grid = parseTSV(text);
  const results: ParsedRow[] = [];

  // 월 추출
  let month = 0;
  const year = new Date().getFullYear();
  for (const row of grid.slice(0, 5)) {
    const joined = row.join(" ");
    const mm = joined.match(/(\d{1,2})월/);
    if (mm) { month = parseInt(mm[1]); break; }
  }
  if (!month) return [];

  // 주간 블록별 컬럼→날짜 매핑
  let colDateMap = new Map<number, string>();
  const skipRows = new Set<number>();

  for (let ri = 0; ri < grid.length; ri++) {
    const row = grid[ri];
    let foundDays = false;
    const weekMap = new Map<number, string>();

    for (let ci = 0; ci < row.length; ci++) {
      const dm = row[ci]?.match(DAY_RE);
      if (dm) {
        foundDays = true;
        const day = parseInt(dm[1]);
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        weekMap.set(ci, dateStr);
        weekMap.set(ci + 1, dateStr);
        weekMap.set(ci + 2, dateStr);
      }
    }

    if (foundDays) {
      colDateMap = weekMap;
      skipRows.add(ri);
      skipRows.add(ri + 1); // 5층/6층/별관 서브헤더
      continue;
    }

    if (skipRows.has(ri) || colDateMap.size === 0) continue;

    // 데이터 행 — 플랫폼 태그 셀 탐색
    for (let ci = 1; ci < row.length; ci++) {
      const cell = row[ci];
      if (!cell || !PLATFORM_TAGS.some((p) => cell.includes(`[${p}]`))) continue;

      const date = colDateMap.get(ci) || "";
      const info = extractLectureFromCell(cell, knownInstructors);
      if (!info) continue;

      const { instructor, lectureName, platform } = info;
      const valid = !!instructor && !!lectureName && !!date;
      const partial = !valid && (!!instructor || !!lectureName || !!date);

      results.push({
        instructor,
        lectureName,
        liveDate: date,
        platform,
        valid,
        partial,
        raw: cell.replace(/\n/g, " / "),
      });
    }
  }

  return results;
}

/* ─────────── 스마트 파싱 (자동 감지) ─────────── */

function smartParse(text: string, knownInstructors: string[]): { rows: ParsedRow[]; isCalendar: boolean } {
  if (isCalendarFormat(text)) {
    return { rows: parseCalendarGrid(text, knownInstructors), isCalendar: true };
  }
  return { rows: parsePastedRows(text), isCalendar: false };
}

/* ─────────── 컴포넌트 ─────────── */

type Mode = "manual" | "paste";

interface AddLectureDialogProps {
  defaultInstructor?: string;
  onClose: () => void;
}

export default function AddLectureDialog({ defaultInstructor, onClose }: AddLectureDialogProps) {
  const { state, dispatch } = useCrm();
  const [mode, setMode] = useState<Mode>("manual");

  /* 수기 입력 */
  const [form, setForm] = useState<NewLectureForm>({
    ...NEW_LECTURE_INIT,
    instructor: defaultInstructor || "",
  });
  const update = (partial: Partial<NewLectureForm>) => setForm((p) => ({ ...p, ...partial }));
  const canSubmitManual = !!form.instructor.trim() && !!form.lectureName.trim() && !!form.liveDate;

  /* 붙여넣기 */
  const [pasteText, setPasteText] = useState("");
  const instructors = Object.keys(state.data);
  const { rows: parsed, isCalendar } = useMemo(
    () => smartParse(pasteText, instructors),
    [pasteText, instructors],
  );
  const validRows = parsed.filter((r) => r.valid);

  /* ── 수기 추가 ── */
  const addManual = () => {
    if (!canSubmitManual) return;
    const ins = form.instructor.trim();
    const color = state.data[ins]?.color ?? COLORS[Object.keys(state.data).length % COLORS.length];
    dispatch({
      type: "ADD_LECTURE",
      ins,
      lec: form.lectureName.trim(),
      color,
      lecture: { ...NEW_LECTURE_DEFAULTS, liveDate: form.liveDate, status: "active" },
    });
    onClose();
  };

  /* ── 붙여넣기 일괄 추가 ── */
  const addPasted = () => {
    if (validRows.length === 0) return;
    let usedColors = Object.keys(state.data).length;

    for (const r of validRows) {
      const color = state.data[r.instructor]?.color ?? COLORS[usedColors++ % COLORS.length];
      dispatch({
        type: "ADD_LECTURE",
        ins: r.instructor,
        lec: r.lectureName,
        color,
        lecture: {
          ...NEW_LECTURE_DEFAULTS,
          ...(r.platform ? { platform: r.platform } : {}),
          liveDate: r.liveDate,
          status: "active",
        },
      });
    }

    // 첫 번째 강의로 이동
    const first = validRows[0];
    dispatch({ type: "SELECT_INSTRUCTOR", ins: first.instructor });
    setTimeout(() => {
      dispatch({ type: "SELECT_LECTURE", lec: first.lectureName });
      dispatch({ type: "SET_TAB", tab: "board" });
    }, 0);
    onClose();
  };

  const tabBtn = (t: Mode, label: string) => (
    <button
      onClick={() => setMode(t)}
      className={`flex-1 py-2 text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors ${
        mode === t
          ? "bg-primary text-white"
          : "bg-secondary text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex justify-center items-center p-5"
    >
      <div
        className="bg-white rounded-[18px] w-full max-w-[520px] max-h-[85vh] overflow-auto p-7 shadow-[0_20px_60px_rgba(0,0,0,.15)]"
        style={{ animation: "pop .2s ease" }}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-extrabold">+ 새 강의 추가</h3>
          <button
            onClick={onClose}
            className="bg-secondary text-muted-foreground text-lg w-[34px] h-[34px] rounded-lg border-none cursor-pointer font-semibold"
          >
            x
          </button>
        </div>

        {/* 모드 탭 */}
        <div className="flex gap-2 mb-5">
          {tabBtn("manual", "수기 입력")}
          {tabBtn("paste", "붙여넣기")}
        </div>

        {/* ── 수기 입력 ── */}
        {mode === "manual" && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
                강사 <span className="text-red-500">*</span>
              </div>
              <select
                value={form.instructor}
                onChange={(e) => update({ instructor: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              >
                <option value="">강사 선택</option>
                {instructors.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
                강의명 <span className="text-red-500">*</span>
              </div>
              <input
                value={form.lectureName}
                onChange={(e) => update({ lectureName: e.target.value })}
                placeholder="예: 브랜드파이프 5기"
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            </div>

            <div>
              <div className="text-[13px] text-muted-foreground mb-1.5 font-semibold">
                라이브 일자 <span className="text-red-500">*</span>
              </div>
              <input
                type="date"
                value={form.liveDate}
                onChange={(e) => update({ liveDate: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[15px] outline-none"
              />
            </div>

            <div className="text-[12px] text-[#aeaeb2] bg-[#f8f8fa] rounded-lg px-3.5 py-2.5 leading-relaxed">
              톤, 타겟, USP 등은 타임라인 탭 &quot;정보 수정&quot;에서 입력하세요.
            </div>

            <button
              onClick={addManual}
              disabled={!canSubmitManual}
              className="w-full bg-gradient-to-br from-primary to-[#764ba2] rounded-xl text-white py-3.5 text-base font-semibold border-none cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              강의 추가하고 타임라인으로 이동
            </button>
          </div>
        )}

        {/* ── 붙여넣기 ── */}
        {mode === "paste" && (
          <div className="flex flex-col gap-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={
                "구글 시트에서 복사해서 붙여넣으세요\n\n" +
                "- 행 목록: 2026.04.19(일)  유메이커  AI 유튜브 롱폼\n" +
                "- 강의실 시간표도 OK (자동 감지)"
              }
              rows={5}
              className="w-full bg-secondary border border-border rounded-lg text-foreground px-3.5 py-2.5 text-[14px] outline-none resize-y font-mono leading-relaxed"
            />

            {/* 형식 감지 표시 */}
            {parsed.length > 0 && (
              <div className="text-[12px] text-primary font-semibold">
                {isCalendar ? "달력 시간표 형식 감지" : "행 목록 형식 감지"}
                {" — "}
                {validRows.length}개 유효 / {parsed.length}개 행
              </div>
            )}

            {/* 미리보기 테이블 */}
            {parsed.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-secondary text-muted-foreground">
                      <th className="text-left px-3 py-2 font-semibold w-6"></th>
                      <th className="text-left px-3 py-2 font-semibold">강사</th>
                      <th className="text-left px-3 py-2 font-semibold">강의명</th>
                      <th className="text-left px-3 py-2 font-semibold">날짜</th>
                      {isCalendar && (
                        <th className="text-left px-3 py-2 font-semibold">플랫폼</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-t border-border ${
                          r.valid ? "" : r.partial ? "bg-yellow-50" : "bg-red-50"
                        }`}
                      >
                        <td className="px-3 py-1.5 text-center">
                          {r.valid ? (
                            <span className="text-green-600">&#10003;</span>
                          ) : (
                            <span className="text-yellow-600">!</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.instructor || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.lectureName || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.liveDate || <span className="text-muted-foreground">-</span>}
                        </td>
                        {isCalendar && (
                          <td className="px-3 py-1.5">
                            {r.platform || <span className="text-muted-foreground">-</span>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.length > 0 && validRows.length < parsed.length && (
              <div className="text-[12px] text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 leading-relaxed">
                {parsed.length - validRows.length}개 행이 불완전합니다 (강사/강의명/날짜 모두 필요). 유효한 행만 추가됩니다.
              </div>
            )}

            <div className="text-[12px] text-[#aeaeb2] bg-[#f8f8fa] rounded-lg px-3.5 py-2.5 leading-relaxed">
              {isCalendar
                ? "[핏크닉], [머니업] 태그된 강의만 추출합니다. 새 강사는 자동 생성됩니다."
                : "날짜 위치는 자유입니다. 새 강사는 자동 생성됩니다."}
            </div>

            <button
              onClick={addPasted}
              disabled={validRows.length === 0}
              className="w-full bg-gradient-to-br from-primary to-[#764ba2] rounded-xl text-white py-3.5 text-base font-semibold border-none cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {validRows.length > 0
                ? `${validRows.length}개 강의 추가`
                : "붙여넣기 대기 중"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
