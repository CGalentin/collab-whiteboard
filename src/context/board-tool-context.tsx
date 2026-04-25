"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BoardRailToolId =
  | "templates"
  | "draw"
  | "pen"
  | "highlighter"
  | "eraser"
  | "lasso"
  | "comments"
  | "hyperlinks";

type BoardToolContextValue = {
  activeTool: BoardRailToolId | null;
  setActiveTool: (id: BoardRailToolId | null) => void;
  railExpanded: boolean;
  setRailExpanded: (v: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  notice: string | null;
  setNotice: (v: string | null) => void;
  historyCanUndo: boolean;
  historyCanRedo: boolean;
  setHistoryCanUndo: (v: boolean) => void;
  setHistoryCanRedo: (v: boolean) => void;
  requestUndo: () => void;
  requestRedo: () => void;
  undoRequestToken: number;
  redoRequestToken: number;
};

const BoardToolContext = createContext<BoardToolContextValue | null>(null);

export function BoardToolProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<BoardRailToolId | null>(null);
  const [railExpanded, setRailExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [historyCanUndo, setHistoryCanUndo] = useState(false);
  const [historyCanRedo, setHistoryCanRedo] = useState(false);
  const [undoRequestToken, setUndoRequestToken] = useState(0);
  const [redoRequestToken, setRedoRequestToken] = useState(0);

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      railExpanded,
      setRailExpanded,
      mobileOpen,
      setMobileOpen,
      notice,
      setNotice,
      historyCanUndo,
      historyCanRedo,
      setHistoryCanUndo,
      setHistoryCanRedo,
      requestUndo: () => setUndoRequestToken((x) => x + 1),
      requestRedo: () => setRedoRequestToken((x) => x + 1),
      undoRequestToken,
      redoRequestToken,
    }),
    [
      activeTool,
      railExpanded,
      mobileOpen,
      notice,
      historyCanUndo,
      historyCanRedo,
      undoRequestToken,
      redoRequestToken,
    ],
  );

  return (
    <BoardToolContext.Provider value={value}>
      {children}
    </BoardToolContext.Provider>
  );
}

export function useBoardTool(): BoardToolContextValue {
  const ctx = useContext(BoardToolContext);
  if (!ctx) {
    throw new Error("useBoardTool must be used within BoardToolProvider");
  }
  return ctx;
}

/** Safe when canvas is rendered outside the board page (e.g. tests). */
export function useBoardToolOptional(): BoardToolContextValue | null {
  return useContext(BoardToolContext);
}
