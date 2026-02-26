/* ── 핏크닉 CRM 자동화 — 전체 타입 정의 ── */

export interface Lecture {
  type: string;
  tone: string;
  platform: string;
  usps: string[];
  proof: string[];
  target: string;
  story: string;
  ebook: string;
  freeUrl: string;
  youtubeUrl: string;
  payUrl: string;
  ebookUrl: string;
  liveDate: string;
  liveTime: string;
  status: "active" | "completed";
}

export interface InstructorData {
  color: string;
  lectures: Record<string, Lecture>;
}

export type CrmData = Record<string, InstructorData>;

export interface SeqItem {
  id: string;
  ch: string;
  name: string;
  icon: string;
  color: string;
}

export interface SeqPhase {
  id: string;
  label: string;
  dayOffset: number;
  items: SeqItem[];
}

export interface CopyData {
  text: string;
  edited: string;
  status: "ai" | "edited";
}

export type ChecksMap = Record<string, Record<string, boolean>>;
export type CopiesMap = Record<string, Record<string, CopyData>>;
export type SeqDataMap = Record<string, SeqPhase[]>;

export interface Feedback {
  id: number;
  curKey: string;
  itemId: string;
  text: string;
  createdAt: string;
}

export interface CalendarEvent {
  date: string;
  ins: string;
  lec: string;
  seqId: string;
  seqLabel: string;
  items: SeqItem[];
  color: string;
  isLiveDay: boolean;
  checkedCount: number;
  copiedCount: number;
  allDone: boolean;
  allCopied: boolean;
}

export interface NewLectureForm {
  instructor: string;
  isNew: boolean;
  newInstructor: string;
  lectureName: string;
  liveDate: string;
}

export type TabId = "dashboard" | "board" | "history";

export interface ChOption {
  ch: string;
  icon: string;
  color: string;
}

export interface ChRule {
  emoji: string;
  btn: string;
  len: string;
}
