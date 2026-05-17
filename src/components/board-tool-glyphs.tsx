"use client";

import type { BoardRailToolId } from "@/context/board-tool-context";

const w = 1.75;

export type BoardToolGlyphId =
  | BoardRailToolId
  | "templates"
  | "select"
  | "line"
  | "text"
  | "connect"
  | "duplicate"
  | "sticky-add"
  | "shapes";

type Props = {
  id: BoardToolGlyphId;
  className?: string;
};

/**
 * Shared 24×24 outline icons for the tool rail, mid-rail, and board toolbar.
 */
export function BoardToolGlyph({ id, className = "h-5 w-5" }: Props) {
  switch (id) {
    case "templates":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "select":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 4.5L9 18l2.5-5 5-2.5L4.5 4.5z"
          />
          <path strokeLinecap="round" d="M9 13l1.5 1.5" />
        </svg>
      );
    case "hand":
      return (
        // User-provided asset — public/icons/tool-hand.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-hand.png"
          alt=""
          width={24}
          height={24}
          className={`${className} object-contain dark:invert`}
          aria-hidden
        />
      );
    case "pen":
      return (
        // User-provided asset — public/icons/tool-pen.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-pen.png"
          alt=""
          width={24}
          height={24}
          className={`${className} object-contain dark:invert`}
          aria-hidden
        />
      );
    case "highlighter":
      return (
        // User-provided asset — public/icons/tool-highlighter.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-highlighter.png"
          alt=""
          width={24}
          height={24}
          className={`${className} object-contain dark:invert`}
          aria-hidden
        />
      );
    case "eraser":
      return (
        // User-provided asset — public/icons/tool-eraser.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-eraser.png"
          alt=""
          width={24}
          height={24}
          className={`${className} object-contain dark:invert`}
          aria-hidden
        />
      );
    case "lasso":
      return (
        // User-provided asset — public/icons/tool-lasso.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-lasso.png"
          alt=""
          width={26}
          height={26}
          className="h-[1.625rem] w-[1.625rem] object-contain dark:invert"
          aria-hidden
        />
      );
    case "comments":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h8M8 14h5M6 18l-2 3V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-3 2z"
          />
        </svg>
      );
    case "hyperlinks":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 13a5 5 0 007.07 0l1.42-1.42a5 5 0 000-7.07 5 5 0 00-7.07 0M14 11a5 5 0 00-7.07 0L5.51 12.42a5 5 0 000 7.07 5 5 0 007.07 0"
          />
        </svg>
      );
    case "sticky-add":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 3.75h6.75l3.75 3.75v8.25A2.25 2.25 0 0116.5 18h-6a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5v3.75H18.75" />
          <path strokeLinecap="round" d="M9.75 8.25h4.5M9.75 10.75h3" />
        </svg>
      );
    case "shapes":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l5.25 9h-10.5L12 3.75z" />
          <rect x="3.5" y="14" width="7.5" height="7.5" rx="1" />
          <circle cx="17.25" cy="17.75" r="3.25" />
        </svg>
      );
    case "line":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <path strokeLinecap="round" d="M5.25 18.75L18.75 5.25" />
          <circle cx="5.25" cy="18.75" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="18.75" cy="5.25" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      );
    case "text":
      return (
        // User-provided asset — public/icons/tool-text.png
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icons/tool-text.png"
          alt=""
          width={24}
          height={24}
          className={`${className} object-contain dark:invert`}
          aria-hidden
        />
      );
    case "connect":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <circle cx="7" cy="12" r="2.5" />
          <circle cx="17" cy="12" r="2.5" />
          <path strokeLinecap="round" d="M9.5 12h5" />
        </svg>
      );
    case "duplicate":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} aria-hidden>
          <rect x="8.5" y="8.5" width="10" height="10" rx="1.25" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.5 15.5v-8A2 2 0 017.5 5.5h8"
          />
        </svg>
      );
    default:
      return (
        <span className={`font-bold text-[10px] ${className}`} aria-hidden>
          ?
        </span>
      );
  }
}
