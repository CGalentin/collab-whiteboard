"use client";

import {
  BOARD_PALETTE_SWATCHES,
  companionStrokeForFill,
  fillToHexForColorInput,
  type BoardPaletteChoice,
} from "@/lib/board-color-swatches";

const CLEAR_SWATCH_BG = [
  "linear-gradient(45deg,#d4d4d8 25%,transparent 25%)",
  "linear-gradient(-45deg,#d4d4d8 25%,transparent 25%)",
  "linear-gradient(45deg,transparent 75%,#d4d4d8 75%)",
  "linear-gradient(-45deg,transparent 75%,#d4d4d8 75%)",
].join(",");

const SWATCH_BTN_CLASS =
  "h-10 w-10 shrink-0 touch-manipulation rounded border shadow-sm ring-offset-2 hover:ring-2 hover:ring-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:h-7 sm:w-7 dark:ring-offset-zinc-900";

type BoardPaletteStripProps = {
  choice: BoardPaletteChoice;
  onChoiceChange: (next: BoardPaletteChoice) => void;
  className?: string;
  "aria-label": string;
};

export function BoardPaletteStrip({
  choice,
  onChoiceChange,
  className,
  "aria-label": ariaLabel,
}: BoardPaletteStripProps) {
  const customHex =
    choice.kind === "custom"
      ? fillToHexForColorInput(choice.fill)
      : "#6366f1";

  const customSelected = choice.kind === "custom";

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 sm:gap-1 ${className ?? ""}`}
      role="group"
      aria-label={ariaLabel}
    >
      {BOARD_PALETTE_SWATCHES.map((s, i) => {
        const selected = choice.kind === "swatch" && choice.index === i;
        const isClear = s.id === "clear";
        return (
          <button
            key={s.id}
            type="button"
            title={s.id}
            className={`${SWATCH_BTN_CLASS} ${
              selected
                ? "border-sky-500 ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:border-sky-400 dark:ring-sky-400 dark:ring-offset-zinc-900"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
            style={
              isClear
                ? {
                    backgroundColor: "#fafafa",
                    backgroundImage: CLEAR_SWATCH_BG,
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                  }
                : { backgroundColor: s.fill }
            }
            onClick={() => onChoiceChange({ kind: "swatch", index: i })}
          />
        );
      })}
      <label
        className={`relative flex h-10 w-10 shrink-0 touch-manipulation overflow-hidden rounded border shadow-sm ring-offset-2 hover:ring-2 hover:ring-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500 sm:h-7 sm:w-7 dark:ring-offset-zinc-900 ${
          customSelected
            ? "border-violet-500 ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:border-violet-400 dark:ring-violet-400 dark:ring-offset-zinc-900"
            : "border-zinc-300 dark:border-zinc-600"
        }`}
        title="Custom color"
      >
        <input
          type="color"
          aria-label="Pick a custom color not in the palette"
          value={customHex}
          onChange={(e) => {
            const fill = e.target.value;
            onChoiceChange({
              kind: "custom",
              fill,
              stroke: companionStrokeForFill(fill),
            });
          }}
          className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer border-0 p-0 opacity-0"
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background: customSelected
              ? customHex
              : "conic-gradient(from 180deg at 50% 50%, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #a855f7, #ef4444)",
          }}
        />
        <span
          className="pointer-events-none absolute inset-[3px] rounded-sm border border-zinc-200/80 dark:border-zinc-600/80"
          style={
            customSelected
              ? { backgroundColor: customHex }
              : { backgroundColor: "var(--background, #fff)" }
          }
        />
      </label>
    </div>
  );
}

