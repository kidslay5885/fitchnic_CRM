"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  CrmData,
  ChecksMap,
  CopiesMap,
  SeqDataMap,
  Feedback,
  TabId,
  Lecture,
  SeqPhase,
} from "@/lib/types";
import { INIT_DATA, DEFAULT_SEQ } from "@/lib/constants";
import { storage } from "@/lib/storage";

/* ─── State ─── */
interface CrmState {
  data: CrmData;
  allChecks: ChecksMap;
  allCopies: CopiesMap;
  seqDataMap: SeqDataMap;
  feedbacks: Feedback[];
  tab: TabId;
  ins: string;
  lec: string;
  hydrated: boolean;
}

const initialState: CrmState = {
  data: INIT_DATA,
  allChecks: {},
  allCopies: {},
  seqDataMap: {},
  feedbacks: [],
  tab: "dashboard",
  ins: "",
  lec: "",
  hydrated: false,
};

/* ─── Actions ─── */
type Action =
  | { type: "HYDRATE"; data: CrmData; checks: ChecksMap; copies: CopiesMap; seqDataMap: SeqDataMap; feedbacks: Feedback[] }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "SELECT_INSTRUCTOR"; ins: string }
  | { type: "SELECT_LECTURE"; lec: string }
  | { type: "SET_DATA"; data: CrmData }
  | { type: "UPDATE_LECTURE_FIELD"; ins: string; lec: string; field: string; value: unknown }
  | { type: "ADD_LECTURE"; ins: string; lec: string; lecture: Lecture; color: string }
  | { type: "SET_CHECK"; curKey: string; itemId: string; checked: boolean }
  | { type: "SET_COPY"; curKey: string; itemId: string; copy: { text: string; edited: string; status: "ai" | "edited" } }
  | { type: "UPDATE_SEQ"; curKey: string; seq: SeqPhase[] }
  | { type: "ADD_FEEDBACK"; feedback: Feedback };

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        data: action.data,
        allChecks: action.checks,
        allCopies: action.copies,
        seqDataMap: action.seqDataMap,
        feedbacks: action.feedbacks,
        hydrated: true,
      };
    case "SET_TAB":
      return { ...state, tab: action.tab };
    case "SELECT_INSTRUCTOR":
      return { ...state, ins: action.ins, lec: "" };
    case "SELECT_LECTURE":
      return { ...state, lec: action.lec };
    case "SET_DATA":
      return { ...state, data: action.data };
    case "UPDATE_LECTURE_FIELD": {
      const d = { ...state.data };
      d[action.ins] = { ...d[action.ins], lectures: { ...d[action.ins].lectures } };
      d[action.ins].lectures[action.lec] = {
        ...d[action.ins].lectures[action.lec],
        [action.field]: action.value,
      };
      return { ...state, data: d };
    }
    case "ADD_LECTURE": {
      const d = { ...state.data };
      if (!d[action.ins]) {
        d[action.ins] = { color: action.color, lectures: {} };
      } else {
        d[action.ins] = { ...d[action.ins], lectures: { ...d[action.ins].lectures } };
      }
      d[action.ins].lectures[action.lec] = action.lecture;
      return { ...state, data: d, ins: action.ins, lec: action.lec, tab: "board" };
    }
    case "SET_CHECK": {
      const prev = state.allChecks[action.curKey] || {};
      return {
        ...state,
        allChecks: {
          ...state.allChecks,
          [action.curKey]: { ...prev, [action.itemId]: action.checked },
        },
      };
    }
    case "SET_COPY": {
      const prev = state.allCopies[action.curKey] || {};
      return {
        ...state,
        allCopies: {
          ...state.allCopies,
          [action.curKey]: { ...prev, [action.itemId]: action.copy },
        },
      };
    }
    case "UPDATE_SEQ":
      return {
        ...state,
        seqDataMap: { ...state.seqDataMap, [action.curKey]: action.seq },
      };
    case "ADD_FEEDBACK":
      return { ...state, feedbacks: [...state.feedbacks, action.feedback] };
    default:
      return state;
  }
}

/* ─── Context ─── */
interface CrmContextValue {
  state: CrmState;
  dispatch: React.Dispatch<Action>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage
  useEffect(() => {
    const d = storage.loadData() || INIT_DATA;
    const c = storage.loadChecks() || {};
    const cp = storage.loadCopies() || {};
    const sm = storage.loadSeqDataMap() || {};
    const fb = storage.loadFeedbacks() || [];
    dispatch({ type: "HYDRATE", data: d, checks: c, copies: cp, seqDataMap: sm, feedbacks: fb });
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!state.hydrated) return;
    storage.saveData(state.data);
  }, [state.data, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.saveChecks(state.allChecks);
  }, [state.allChecks, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.saveCopies(state.allCopies);
  }, [state.allCopies, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.saveSeqDataMap(state.seqDataMap);
  }, [state.seqDataMap, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    storage.saveFeedbacks(state.feedbacks);
  }, [state.feedbacks, state.hydrated]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

/* ─── Hooks ─── */
export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}

export function useCurKey(): string {
  const { state } = useCrm();
  return state.ins && state.lec ? `${state.ins}|${state.lec}` : "";
}

export function useCurrentLecture(): Lecture | null {
  const { state } = useCrm();
  if (!state.ins || !state.lec) return null;
  return state.data[state.ins]?.lectures?.[state.lec] || null;
}

export function useCurrentSeq(): SeqPhase[] {
  const { state } = useCrm();
  const curKey = state.ins && state.lec ? `${state.ins}|${state.lec}` : "";
  return state.seqDataMap[curKey] || JSON.parse(JSON.stringify(DEFAULT_SEQ));
}

export function useGoToBoard() {
  const { dispatch } = useCrm();
  return useCallback(
    (ins: string, lec: string) => {
      dispatch({ type: "SELECT_INSTRUCTOR", ins });
      // need to set lec separately since SELECT_INSTRUCTOR resets it
      setTimeout(() => {
        dispatch({ type: "SELECT_LECTURE", lec });
        dispatch({ type: "SET_TAB", tab: "board" });
      }, 0);
    },
    [dispatch]
  );
}
