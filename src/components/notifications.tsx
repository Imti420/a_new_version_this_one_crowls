import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { buildNotices } from "@/lib/notices";
import { usePublishedReport } from "@/lib/published-report";
import { usePersonal } from "@/lib/store";
import { cn } from "@/lib/cn";

export function NoticeBell() {
  const report = usePublishedReport((s) => s.report);
  const decisions = usePersonal((s) => s.proposalDecisions);
  const events = usePersonal((s) => s.personalEvents);
  const read = usePersonal((s) => s.readNoticeIds);
  const markNoticeRead = usePersonal((s) => s.markNoticeRead);
  const markNoticesRead = usePersonal((s) => s.markNoticesRead);
  const [open, setOpen] = useState(false);
  const notices = useMemo(() => buildNotices({ report, decisions, events }), [report, decisions, events]);
  const unread = notices.filter((notice) => !read.includes(notice.id)).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-11 items-center border border-ink px-3 font-mono text-xs tracking-widest"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="mr-2 size-4" aria-hidden />
        Notices
        {unread > 0 ? <span className="ml-2 bg-accent px-1 text-paper">{unread}</span> : null}
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-40 mt-1 w-[min(24rem,calc(100vw-2rem))] border border-ink bg-paper">
          <div className="flex items-center justify-between border-b border-ink px-3 py-2">
            <p className="font-mono text-xs tracking-widest text-mute">IN-APP · NOT BROWSER PUSH</p>
            <button
              type="button"
              className="font-mono text-xs underline"
              onClick={() => markNoticesRead(notices.map((notice) => notice.id))}
            >
              MARK READ
            </button>
          </div>
          {notices.length === 0 ? (
            <p className="px-3 py-4 text-sm">No notices. A quiet desk is not a successful verification.</p>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {notices.slice(0, 12).map((notice) => {
                const seen = read.includes(notice.id);
                return (
                  <li key={notice.id} className={cn("border-b border-ink", seen && "opacity-60")}>
                    <Link
                      to={notice.href}
                      className="block px-3 py-3 hover:bg-panel"
                      onClick={() => {
                        markNoticeRead(notice.id);
                        setOpen(false);
                      }}
                    >
                      <p className={cn("font-mono text-xs tracking-widest", notice.tone === "unverified" ? "text-signal" : notice.tone === "confirmed" ? "text-accent" : "text-mute")}>
                        {notice.tone === "confirmed" ? "CONFIRMED" : notice.tone === "unverified" ? "UNVERIFIED" : "REMINDER"}
                      </p>
                      <p className="mt-1 font-display text-xl font-bold uppercase leading-none">{notice.title}</p>
                      <p className="mt-1 text-sm">{notice.body}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
