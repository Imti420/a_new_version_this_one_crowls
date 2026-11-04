import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { monthMatrix, toIcs, weekDays } from "./calendar-ics.ts";

const event = {
  id: "c-du-closes",
  day: "2026-11-25",
  time: "23:59",
  title: "DU · Application closes",
  kind: "closes",
  confidence: "notice",
  confidenceLabel: "OFFICIAL NOTICE CITED",
  universityId: "du",
  circularId: "c-du",
  personal: false,
  completed: false,
  notes: "",
  remindDays: null,
};

describe("calendar", () => {
  it("builds a Sunday-start month that includes the first", () => {
    const days = monthMatrix(2026, 10);
    assert.equal(days.length, 42);
    assert.ok(days.includes("2026-11-01"));
    assert.equal(days[0], weekDays("2026-11-01")[0]);
  });

  it("exports an ics document without dropping the confidence line", () => {
    const ics = toIcs([event]);
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /DTSTART:20261125T235900/);
    assert.match(ics, /SUMMARY:DU · Application closes/);
    assert.match(ics, /OFFICIAL NOTICE CITED/);
    assert.match(ics, /END:VCALENDAR/);
  });
});
