import type { CrmData, ChecksMap, CopiesMap, SeqDataMap, Feedback } from "./types";

const KEYS = {
  data: "crm_data",
  checks: "crm_checks",
  copies: "crm_copies",
  seqData: "crm_seqDataMap",
  feedbacks: "crm_feedbacks",
} as const;

function load<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export const storage = {
  loadData: () => load<CrmData>(KEYS.data),
  saveData: (v: CrmData) => save(KEYS.data, v),

  loadChecks: () => load<ChecksMap>(KEYS.checks),
  saveChecks: (v: ChecksMap) => save(KEYS.checks, v),

  loadCopies: () => load<CopiesMap>(KEYS.copies),
  saveCopies: (v: CopiesMap) => save(KEYS.copies, v),

  loadSeqDataMap: () => load<SeqDataMap>(KEYS.seqData),
  saveSeqDataMap: (v: SeqDataMap) => save(KEYS.seqData, v),

  loadFeedbacks: () => load<Feedback[]>(KEYS.feedbacks),
  saveFeedbacks: (v: Feedback[]) => save(KEYS.feedbacks, v),
};
