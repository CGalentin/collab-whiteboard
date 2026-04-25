"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { isValidBoardId } from "@/lib/board";

type MemberRow = { uid: string; role: string };

type BoardSharePanelProps = {
  user: User;
  boardId: string;
  ownerUid: string;
};

export function BoardSharePanel({ user, boardId, ownerUid }: BoardSharePanelProps) {
  const router = useRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [collabUid, setCollabUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const isOwner = ownerUid === user.uid;

  useEffect(() => {
    if (!isOwner) return;
    const db = getFirebaseDb();
    const col = collection(db, "boards", boardId, "members");
    const unsub = onSnapshot(
      col,
      (snap) => {
        const rows: MemberRow[] = [];
        snap.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const role = typeof data.role === "string" ? data.role : "editor";
          rows.push({ uid: d.id, role });
        });
        rows.sort((a, b) => a.uid.localeCompare(b.uid));
        setMembers(rows);
      },
      (e) => {
        console.error("[share] members listen failed", e);
        setNotice("Could not load collaborators.");
      },
    );
    return () => unsub();
  }, [boardId, isOwner]);

  async function addCollaborator() {
    if (!isOwner) return;
    const uid = collabUid.trim();
    if (!uid) {
      setNotice("Paste the other user’s Firebase UID.");
      return;
    }
    if (uid === user.uid) {
      setNotice("That UID is you — pick another collaborator.");
      return;
    }
    if (!isValidBoardId(uid)) {
      setNotice("UID format looks invalid (use letters, numbers, dash, underscore).");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      await setDoc(doc(db, "boards", boardId, "members", uid), {
        role: "editor",
        addedAt: serverTimestamp(),
      });
      setCollabUid("");
      setNotice(`Added ${uid.slice(0, 8)}… as editor. They can open this board URL once to sync it to their dashboard.`);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not add collaborator (check rules / permissions).",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(targetUid: string) {
    if (!isOwner) return;
    if (targetUid === ownerUid) return;
    setBusy(true);
    setNotice(null);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      await deleteDoc(doc(db, "boards", boardId, "members", targetUid));
      setNotice(`Removed ${targetUid.slice(0, 8)}…`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not remove collaborator.");
    } finally {
      setBusy(false);
    }
  }

  async function generateInviteLink() {
    if (!isOwner) return;
    setBusy(true);
    setNotice(null);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const inviteId = crypto.randomUUID();
      await setDoc(doc(db, "boardInvites", inviteId), {
        boardId,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      const base =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${base}/join/${inviteId}`;
      setLastInviteUrl(url);
      setNotice("Invite link created — copy below.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not create invite.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setNotice("Copied invite link to clipboard.");
    } catch {
      setNotice(lastInviteUrl);
    }
  }

  if (!isOwner) {
    return (
      <section
        className="rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
        aria-label="Board sharing"
      >
        <p>
          You are a <span className="font-medium">collaborator</span> on this board. Only the owner
          can add people or create invite links.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Leave this board? You will need a new invite to return.")) {
              return;
            }
            setBusy(true);
            try {
              await user.getIdToken();
              const db = getFirebaseDb();
              await deleteDoc(doc(db, "boards", boardId, "members", user.uid));
              await deleteDoc(doc(db, "users", user.uid, "boards", boardId));
              router.replace("/dashboard");
            } catch (e) {
              setNotice(e instanceof Error ? e.message : "Could not leave board.");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Leave board
        </button>
        {notice ? <p className="mt-2 text-amber-700 dark:text-amber-400">{notice}</p> : null}
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
      aria-label="Board sharing"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        Share board
      </h2>
      <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        Add by Firebase UID, or create an invite link (signed-in users only).
      </p>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="collab-uid" className="sr-only">
            Collaborator UID
          </label>
          <input
            id="collab-uid"
            value={collabUid}
            onChange={(e) => setCollabUid(e.target.value)}
            placeholder="Other user’s UID"
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-[11px] text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void addCollaborator()}
          className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Add editor
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void generateInviteLink()}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          New invite link
        </button>
        {lastInviteUrl ? (
          <button
            type="button"
            onClick={() => void copyInvite()}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Copy link
          </button>
        ) : null}
      </div>

      {lastInviteUrl ? (
        <p className="mt-1 break-all font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
          {lastInviteUrl}
        </p>
      ) : null}

      {members.length > 0 ? (
        <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto border-t border-zinc-200 pt-2 dark:border-zinc-800">
          {members.map((m) => (
            <li
              key={m.uid}
              className="flex items-center justify-between gap-2 font-mono text-[10px] text-zinc-700 dark:text-zinc-300"
            >
              <span className="min-w-0 truncate">
                {m.uid.slice(0, 10)}… · {m.role}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeMember(m.uid)}
                className="shrink-0 text-red-600 hover:underline disabled:opacity-40 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-t border-zinc-200 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          No collaborators yet.
        </p>
      )}

      {notice ? (
        <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300">{notice}</p>
      ) : null}
    </section>
  );
}
