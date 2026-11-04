import { useState } from "react";
import type { Progress } from "@/data/types";
import { PROGRESS_LABEL } from "@/data/types";
import { usePersonal } from "@/lib/store";
import { controlClass, TextButton } from "@/components/marks";

export function RecordActions({
  universityId,
  circularId,
}: {
  universityId?: string;
  circularId?: string;
}) {
  const hydrated = usePersonal((s) => s.hydrated);
  const bookmarks = usePersonal((s) => s.bookmarks);
  const shortlist = usePersonal((s) => s.shortlist);
  const readIds = usePersonal((s) => s.readIds);
  const pinnedIds = usePersonal((s) => s.pinnedIds);
  const verifiedOn = usePersonal((s) => s.verifiedOn);
  const toggleBookmark = usePersonal((s) => s.toggleBookmark);
  const toggleShortlist = usePersonal((s) => s.toggleShortlist);
  const toggleRead = usePersonal((s) => s.toggleRead);
  const togglePin = usePersonal((s) => s.togglePin);
  const toggleVerified = usePersonal((s) => s.toggleVerified);

  return (
    <div className="flex flex-wrap gap-2">
      {universityId ? (
        <TextButton tone="paper" disabled={!hydrated} onClick={() => toggleBookmark(universityId)}>
          {bookmarks.includes(universityId) ? "Saved" : "Save"}
        </TextButton>
      ) : null}
      {universityId ? (
        <TextButton tone="ghost" disabled={!hydrated} onClick={() => toggleShortlist(universityId)}>
          {shortlist.includes(universityId) ? "On shortlist" : "Shortlist"}
        </TextButton>
      ) : null}
      {circularId ? (
        <TextButton tone="paper" disabled={!hydrated} onClick={() => togglePin(circularId)}>
          {pinnedIds.includes(circularId) ? "Deadline pinned" : "Pin deadline"}
        </TextButton>
      ) : null}
      {circularId ? (
        <TextButton tone="ghost" disabled={!hydrated} onClick={() => toggleRead(circularId)}>
          {readIds.includes(circularId) ? "Read" : "Mark read"}
        </TextButton>
      ) : null}
      {circularId ? (
        <TextButton tone="ghost" disabled={!hydrated} onClick={() => toggleVerified(circularId)}>
          {verifiedOn[circularId] ? `Verified ${verifiedOn[circularId]}` : "Mark verified"}
        </TextButton>
      ) : null}
    </div>
  );
}

export function NoteBox({ id, label }: { id: string; label: string }) {
  const hydrated = usePersonal((s) => s.hydrated);
  const stored = usePersonal((s) => s.notes[id] ?? "");
  const setNote = usePersonal((s) => s.setNote);
  const [value, setValue] = useState<string | null>(null);
  const shown = value ?? stored;

  if (!hydrated) {
    return <p className="font-mono text-xs text-mute">RESTORING LOCAL NOTES…</p>;
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-widest text-mute">{label}</span>
      <textarea
        className={`${controlClass} h-28 py-2`}
        value={shown}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          setNote(id, shown);
          setValue(null);
        }}
      />
    </label>
  );
}

export function ProgressSelect({ id }: { id: string }) {
  const hydrated = usePersonal((s) => s.hydrated);
  const progress = usePersonal((s) => s.progress[id] ?? "");
  const setProgress = usePersonal((s) => s.setProgress);
  return (
    <select
      className={controlClass}
      disabled={!hydrated}
      value={progress}
      onChange={(event) => setProgress(id, (event.target.value || null) as Progress | null)}
    >
      <option value="">NOT TRACKING</option>
      {(Object.keys(PROGRESS_LABEL) as Progress[]).map((key) => (
        <option key={key} value={key}>
          {PROGRESS_LABEL[key].toUpperCase()}
        </option>
      ))}
    </select>
  );
}
