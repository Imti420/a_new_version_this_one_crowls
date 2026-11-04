import { useState, type ReactNode } from "react";
import type { AdmissionSystem, Circular, Confidence, Publication, Track, UnitPlan, University } from "@/data/types";
import { SYSTEM_LABEL, TRACK_LABEL } from "@/data/types";
import { isCustomCircular, isCustomUniversity } from "@/lib/catalog";
import { todayISO } from "@/lib/dates";
import { usePersonal } from "@/lib/store";
import { controlClass, TextButton } from "@/components/marks";

const TRACKS = Object.keys(TRACK_LABEL) as Track[];
const SYSTEMS = Object.keys(SYSTEM_LABEL) as AdmissionSystem[];
const CONFIDENCE: Confidence[] = ["notice", "reported", "preliminary", "not-announced"];
const PUBLICATION: Publication[] = ["none", "decision", "notice", "circular"];

function clean(value: string): string | null {
  const next = value.trim();
  return next ? next : null;
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AmendUniversity({ university }: { university: University }) {
  const saveUniversity = usePersonal((s) => s.saveUniversity);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(university);
  const [error, setError] = useState("");

  const save = () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      setError("Name and short name are required.");
      return;
    }
    for (const url of [form.website, form.admissionUrl]) {
      if (url && !/^https?:\/\//i.test(url)) {
        setError("Links must start with http:// or https://");
        return;
      }
    }
    saveUniversity(
      university.id,
      {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        nameBn: form.nameBn.trim(),
        track: form.track,
        city: form.city.trim(),
        website: clean(form.website ?? ""),
        admissionUrl: clean(form.admissionUrl ?? ""),
        directoryNote: form.directoryNote.trim(),
        tags: form.tags,
      },
      isCustomUniversity(university.id),
    );
    setError("");
    setOpen(false);
  };

  if (!open) {
    return (
      <TextButton tone="paper" onClick={() => setOpen(true)}>
        Amend record
      </TextButton>
    );
  }

  return (
    <form
      className="grid gap-4 border border-ink p-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <p className="font-mono text-xs tracking-widest text-mute">DESK AMENDMENT · DOES NOT INVENT A SOURCE</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input className={controlClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Short name">
          <input
            className={controlClass}
            value={form.shortName}
            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
          />
        </Field>
        <Field label="Bangla name">
          <input className={controlClass} value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
        </Field>
        <Field label="Category">
          <select className={controlClass} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value as Track })}>
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {TRACK_LABEL[track]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input className={controlClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="Official website">
          <input
            className={controlClass}
            value={form.website ?? ""}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </Field>
        <Field label="Application portal">
          <input
            className={controlClass}
            value={form.admissionUrl ?? ""}
            onChange={(e) => setForm({ ...form, admissionUrl: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Directory note">
        <textarea
          className={`${controlClass} h-28 py-2`}
          value={form.directoryNote}
          onChange={(e) => setForm({ ...form, directoryNote: e.target.value })}
        />
      </Field>
      {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <TextButton type="submit">Save amendment</TextButton>
        <TextButton tone="ghost" onClick={() => setOpen(false)}>
          Cancel
        </TextButton>
      </div>
    </form>
  );
}

export function AmendCircular({ circular }: { circular: Circular }) {
  const saveCircular = usePersonal((s) => s.saveCircular);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [unitsText, setUnitsText] = useState(unitsToText(circular.units));
  const [form, setForm] = useState({
    title: circular.title,
    summary: circular.summary,
    session: circular.session,
    system: circular.system,
    publication: circular.publication,
    confidence: circular.confidence,
    confidenceNote: circular.confidenceNote,
    applicationOpens: circular.applicationOpens ?? "",
    opensAt: circular.opensAt ?? "",
    applicationCloses: circular.applicationCloses ?? "",
    closesAt: circular.closesAt ?? "",
    admitCardOn: circular.admitCardOn ?? "",
    examDate: circular.examDate ?? "",
    resultOn: circular.resultOn ?? "",
    classesBegin: circular.classesBegin ?? "",
    fee: circular.feeBdt == null ? "" : String(circular.feeBdt),
    feeNote: circular.feeNote,
    seats: circular.seats == null ? "" : String(circular.seats),
    pdfUrl: circular.pdfUrl ?? "",
    sourceUrl: circular.sources[0]?.url ?? "",
    sourceLabel: circular.sources[0]?.label ?? "",
    eligibility: circular.eligibility.join("\n"),
    notes: circular.notes.join("\n"),
  });

  const save = () => {
    for (const url of [form.pdfUrl, form.sourceUrl]) {
      if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
        setError("Links must start with http:// or https://");
        return;
      }
    }
    const fee = form.fee.trim() ? Number(form.fee) : null;
    const seats = form.seats.trim() ? Number(form.seats) : null;
    if ((form.fee.trim() && !Number.isFinite(fee)) || (form.seats.trim() && !Number.isFinite(seats))) {
      setError("Fee and seats must be numbers, or left blank.");
      return;
    }
    const sources = [...circular.sources];
    if (form.sourceUrl.trim()) {
      const next = {
        label: form.sourceLabel.trim() || "Source logged on this desk",
        url: form.sourceUrl.trim(),
        published: todayISO(),
      };
      if (sources[0]?.url === circular.sources[0]?.url && form.sourceUrl.trim() !== circular.sources[0]?.url) {
        sources.unshift(next);
      } else if (!sources.length) sources.push(next);
      else sources[0] = { ...sources[0], label: next.label, url: next.url };
    }
    saveCircular(
      circular.id,
      {
        title: form.title.trim(),
        summary: form.summary.trim(),
        session: form.session.trim() || "2026-27",
        system: form.system,
        publication: form.publication,
        confidence: form.confidence,
        confidenceNote: form.confidenceNote.trim(),
        applicationOpens: clean(form.applicationOpens),
        opensAt: clean(form.opensAt),
        applicationCloses: clean(form.applicationCloses),
        closesAt: clean(form.closesAt),
        admitCardOn: clean(form.admitCardOn),
        examDate: clean(form.examDate),
        resultOn: clean(form.resultOn),
        classesBegin: clean(form.classesBegin),
        feeBdt: fee,
        feeNote: form.feeNote.trim(),
        seats,
        pdfUrl: clean(form.pdfUrl),
        eligibility: lines(form.eligibility),
        notes: lines(form.notes),
        units: textToUnits(unitsText),
        sources,
        updatedOn: todayISO(),
      },
      isCustomCircular(circular.id),
    );
    setError("");
    setOpen(false);
  };

  if (!open) {
    return (
      <TextButton tone="paper" onClick={() => setOpen(true)}>
        Amend dates & eligibility
      </TextButton>
    );
  }

  return (
    <form
      className="grid gap-4 border border-ink p-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <p className="font-mono text-xs tracking-widest text-mute">
        DESK AMENDMENT · BLANK DATES STAY NOT ANNOUNCED · DO NOT GUESS
      </p>
      <Field label="Title">
        <input className={controlClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Summary">
        <textarea className={`${controlClass} h-24 py-2`} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Session">
          <input className={controlClass} value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} />
        </Field>
        <Field label="System">
          <select className={controlClass} value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value as AdmissionSystem })}>
            {SYSTEMS.map((item) => (
              <option key={item} value={item}>
                {SYSTEM_LABEL[item]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Publication">
          <select
            className={controlClass}
            value={form.publication}
            onChange={(e) => setForm({ ...form, publication: e.target.value as Publication })}
          >
            {PUBLICATION.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Evidence">
          <select
            className={controlClass}
            value={form.confidence}
            onChange={(e) => setForm({ ...form, confidence: e.target.value as Confidence })}
          >
            {CONFIDENCE.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Opens">
          <input type="date" className={controlClass} value={form.applicationOpens} onChange={(e) => setForm({ ...form, applicationOpens: e.target.value })} />
        </Field>
        <Field label="Opens at">
          <input className={controlClass} placeholder="12:00" value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} />
        </Field>
        <Field label="Closes">
          <input type="date" className={controlClass} value={form.applicationCloses} onChange={(e) => setForm({ ...form, applicationCloses: e.target.value })} />
        </Field>
        <Field label="Closes at">
          <input className={controlClass} placeholder="23:59" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} />
        </Field>
        <Field label="Admit card">
          <input type="date" className={controlClass} value={form.admitCardOn} onChange={(e) => setForm({ ...form, admitCardOn: e.target.value })} />
        </Field>
        <Field label="First exam">
          <input type="date" className={controlClass} value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
        </Field>
        <Field label="Result">
          <input type="date" className={controlClass} value={form.resultOn} onChange={(e) => setForm({ ...form, resultOn: e.target.value })} />
        </Field>
        <Field label="Classes begin">
          <input type="date" className={controlClass} value={form.classesBegin} onChange={(e) => setForm({ ...form, classesBegin: e.target.value })} />
        </Field>
        <Field label="Fee (BDT)">
          <input className={controlClass} inputMode="numeric" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
        </Field>
        <Field label="Seats">
          <input className={controlClass} inputMode="numeric" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
        </Field>
      </div>
      <Field label="Fee note">
        <input className={controlClass} value={form.feeNote} onChange={(e) => setForm({ ...form, feeNote: e.target.value })} />
      </Field>
      <Field label="Official PDF">
        <input className={controlClass} value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Source label">
          <input className={controlClass} value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} />
        </Field>
        <Field label="Source URL">
          <input className={controlClass} value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
        </Field>
      </div>
      <Field label="Why this grade">
        <textarea className={`${controlClass} h-20 py-2`} value={form.confidenceNote} onChange={(e) => setForm({ ...form, confidenceNote: e.target.value })} />
      </Field>
      <Field label="Eligibility, one fact per line">
        <textarea className={`${controlClass} h-28 py-2`} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
      </Field>
      <Field label="Units — code | detail | YYYY-MM-DD | time | centre">
        <textarea className={`${controlClass} h-32 py-2 font-mono text-xs`} value={unitsText} onChange={(e) => setUnitsText(e.target.value)} />
      </Field>
      <Field label="Notes, one per line">
        <textarea className={`${controlClass} h-24 py-2`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <TextButton type="submit">Save amendment</TextButton>
        <TextButton tone="ghost" onClick={() => setOpen(false)}>
          Cancel
        </TextButton>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-widest text-mute">{label}</span>
      {children}
    </label>
  );
}

function unitsToText(units: UnitPlan[]): string {
  return units.map((unit) => [unit.code, unit.detail, unit.examDate ?? "", unit.examTime ?? "", unit.centre].join(" | ")).join("\n");
}

function textToUnits(text: string): UnitPlan[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code = "", detail = "", examDate = "", examTime = "", centre = ""] = line.split("|").map((part) => part.trim());
      return {
        code: code || "UNIT",
        detail,
        examDate: examDate || null,
        examTime: examTime || null,
        centre,
      };
    });
}
