import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EVIDENCE_COPY } from "@/data/circulars";
import { SYSTEM_LABEL, TRACK_LABEL, type Track } from "@/data/types";
import { Signature } from "@/components/signature";
import { PageHead, TextButton, controlClass } from "@/components/marks";
import { blankCircular, blankUniversity, buildCatalog, useCatalog } from "@/lib/catalog";
import { todayISO } from "@/lib/dates";
import { parseBackup, personalSnapshot, usePersonal } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — ADMISSION//26" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const personal = usePersonal();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [uniName, setUniName] = useState("");
  const [uniShort, setUniShort] = useState("");
  const [uniTrack, setUniTrack] = useState<Track>("general");
  const [uniCity, setUniCity] = useState("");
  const [uniSite, setUniSite] = useState("");
  const [circUni, setCircUni] = useState(catalog.universities[0]?.id ?? "du");
  const [circTitle, setCircTitle] = useState("");

  const download = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportDesk = () => {
    download(`admission26-desk-${todayISO()}.json`, {
      archive: "ADMISSION//26",
      version: 2,
      exportedAt: new Date().toISOString(),
      personal: personalSnapshot(personal),
    });
    setMessage("Desk backup downloaded.");
  };

  const exportMerged = () => {
    download(`admission26-catalog-${todayISO()}.json`, {
      archive: "ADMISSION//26",
      kind: "snapshot",
      exportedAt: new Date().toISOString(),
      universities: catalog.universities,
      circulars: catalog.circulars,
    });
    setMessage("Merged catalog snapshot downloaded. This file is for reading, not for import.");
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed) {
        setMessage("That file is not an ADMISSION//26 desk backup. Snapshots cannot be imported.");
        return;
      }
      personal.replacePersonal(parsed);
      setMessage("Desk backup restored on this browser.");
    } catch {
      setMessage("Could not read that JSON file.");
    }
  };

  return (
    <div>
      <PageHead
        kicker="Desk"
        title="Settings"
        lede="Add a university, log a circular, and keep a JSON backup. Edits live in this browser. The seeded directory stays in the app; your amendments sit on top of it."
      />

      <section className="border border-ink p-4">
        <h2 className="font-display text-3xl font-bold uppercase">How to read a record</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {EVIDENCE_COPY.map((line) => (
            <li key={line} className="border-b border-ink py-2">
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          The directory was logged on 4 Nov 2026 from the UGC public-university list and three Daily Star reports. It does not scrape the web. If a portal is down, the field stays blank.
        </p>
      </section>

      <section className="mt-8 border border-ink p-4">
        <h2 className="font-display text-3xl font-bold uppercase">Backup</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <TextButton onClick={exportDesk}>Export desk backup</TextButton>
          <TextButton tone="paper" onClick={exportMerged}>
            Export merged catalog
          </TextButton>
          <TextButton
            tone="ghost"
            onClick={() => {
              if (confirm("Erase bookmarks, notes, tracker marks and desk amendments on this browser?")) {
                personal.resetPersonal();
                setMessage("Local desk cleared. The seeded directory is unchanged.");
              }
            }}
          >
            Reset this desk
          </TextButton>
        </div>
        <label className="mt-4 flex flex-col gap-2">
          <span className="font-mono text-xs tracking-widest text-mute">IMPORT DESK BACKUP</span>
          <input
            type="file"
            accept="application/json"
            className={controlClass}
            onChange={(event) => void onImport(event.target.files?.[0])}
          />
        </label>
        {message ? <p className="mt-3 font-mono text-xs">{message}</p> : null}
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <form
          className="border border-ink p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!uniName.trim()) {
              setMessage("A university needs a name.");
              return;
            }
            if (uniSite.trim() && !/^https?:\/\//i.test(uniSite.trim())) {
              setMessage("Website must start with http:// or https://");
              return;
            }
            const uni = blankUniversity(uniName);
            uni.shortName = uniShort.trim() || uni.shortName;
            uni.track = uniTrack;
            uni.city = uniCity.trim();
            uni.website = uniSite.trim() || null;
            personal.addUniversity(uni);
            setUniName("");
            setUniShort("");
            setUniCity("");
            setUniSite("");
            void navigate({ to: "/universities/$id", params: { id: uni.id } });
          }}
        >
          <h2 className="font-display text-3xl font-bold uppercase">Add a university</h2>
          <div className="mt-4 grid gap-3">
            <input className={controlClass} placeholder="University name" value={uniName} onChange={(e) => setUniName(e.target.value)} />
            <input className={controlClass} placeholder="Short name" value={uniShort} onChange={(e) => setUniShort(e.target.value)} />
            <select className={controlClass} value={uniTrack} onChange={(e) => setUniTrack(e.target.value as Track)}>
              {(Object.keys(TRACK_LABEL) as Track[]).map((track) => (
                <option key={track} value={track}>
                  {TRACK_LABEL[track]}
                </option>
              ))}
            </select>
            <input className={controlClass} placeholder="City" value={uniCity} onChange={(e) => setUniCity(e.target.value)} />
            <input className={controlClass} placeholder="https:// official website" value={uniSite} onChange={(e) => setUniSite(e.target.value)} />
            <TextButton type="submit">Add university</TextButton>
          </div>
        </form>

        <form
          className="border border-ink p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const circular = blankCircular(circUni, circTitle);
            const uni = catalog.byId.get(circUni);
            if (uni?.track === "engineering") circular.system = "engineering";
            if (uni?.track === "private") circular.system = "private";
            if (uni?.track === "medical") circular.system = "medical";
            if (uni?.track === "agricultural") circular.system = "agricultural";
            if (uni?.id === "gst") circular.system = "gst";
            personal.addCircular(circular);
            setCircTitle("");
            void navigate({ to: "/circulars/$id", params: { id: circular.id } });
          }}
        >
          <h2 className="font-display text-3xl font-bold uppercase">Add a circular</h2>
          <div className="mt-4 grid gap-3">
            <select className={controlClass} value={circUni} onChange={(e) => setCircUni(e.target.value)}>
              {catalog.universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.shortName} — {uni.name}
                </option>
              ))}
            </select>
            <input className={controlClass} placeholder="Title" value={circTitle} onChange={(e) => setCircTitle(e.target.value)} />
            <p className="font-mono text-xs text-mute">
              Systems on file: {Object.values(SYSTEM_LABEL).join(" · ")}. You will set dates on the next screen. Leave unknown fields blank.
            </p>
            <TextButton type="submit">Add circular</TextButton>
          </div>
        </form>
      </section>

      <Signature variant="about" />

      <SeedCount />
    </div>
  );
}

function SeedCount() {
  const personal = usePersonal();
  const count = buildCatalog(personal).universities.length;
  return (
    <p className="mt-8 font-mono text-xs text-mute">
      {String(count).padStart(2, "0")} RECORDS VISIBLE AFTER YOUR AMENDMENTS AND HIDES.
    </p>
  );
}
