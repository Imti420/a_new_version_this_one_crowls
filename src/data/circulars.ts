import type { Circular, SourceRef } from "@/data/types";

const STAR_DU: SourceRef = {
  label: "The Daily Star — DU applications open 11 Nov",
  url: "https://online.thedailystar.net/campus/news/dhaka-university-admission-applications-open-nov-11-2026-27-session-4238521",
  published: "2026-08-02",
};

const STAR_CLASH: SourceRef = {
  label: "The Daily Star — eight institutions announce schedules",
  url: "https://online.thedailystar.net/news/education/news/university-admission-tests-2026-27-date-clashes-emerge-8-institutions-announce-schedules-4260196",
  published: "2026-08-30",
};

const STAR_RETAKE: SourceRef = {
  label: "The Daily Star — schedules and the HSC retake",
  url: "https://www.thedailystar.net/news/bangladesh/education/news/admission-schedule-medical-colleges-univs-mull-relief-hsc-retakers-4315036",
  published: "2026-11-04",
};

function C(
  partial: Pick<
    Circular,
    | "id"
    | "universityId"
    | "title"
    | "summary"
    | "system"
    | "publication"
    | "confidence"
    | "confidenceNote"
    | "sources"
    | "updatedOn"
  > &
    Partial<Circular>,
): Circular {
  return {
    session: "2026-27",
    pdfUrl: null,
    applicationOpens: null,
    opensAt: null,
    applicationCloses: null,
    closesAt: null,
    admitCardOn: null,
    examDate: null,
    examTime: null,
    resultOn: null,
    classesBegin: null,
    feeBdt: null,
    feeNote: "",
    seats: null,
    eligibility: [],
    units: [],
    notes: [],
    ...partial,
  };
}

const UNIT_UNKNOWN = "Subject group not named in the stored reports.";

export const seedCirculars: Circular[] = [
  C({
    id: "c-du",
    universityId: "du",
    title: "University of Dhaka undergraduate admission 2026–27",
    summary:
      "The General Admission Committee, chaired by Vice-Chancellor Prof ABM Obaidul Islam, set the application window and five unit tests. Reported from a university press release. The PDF circular is not stored in this archive.",
    system: "own",
    publication: "notice",
    confidence: "notice",
    confidenceNote:
      "Dates come from a Daily Star report of the 2 Aug 2026 committee decision and a university press release. Restated as the existing timeline on 4 Nov 2026. No official PDF is linked here.",
    sources: [STAR_DU, STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    applicationOpens: "2026-11-11",
    opensAt: "12:00",
    applicationCloses: "2026-11-25",
    closesAt: "23:59",
    examDate: "2026-12-05",
    classesBegin: "2027-03-28",
    eligibility: [
      "HSC or equivalent must be 2026. Applicants from earlier HSC batches are not eligible (The Daily Star, 4 Nov 2026).",
      "Unit-wise minimum GPA figures were not printed in the Daily Star reports stored here.",
      "Arts, Law and Social Science, Science, and Business Studies papers: 60 marks MCQ and 40 marks written (The Daily Star, 2 Aug 2026).",
      "Fine Arts: 40-mark MCQ and 60-mark drawing. IBA: 70-mark MCQ and 30-mark descriptive (The Daily Star, 2 Aug 2026).",
      "English-medium candidates in the Science unit get a separate question paper (The Daily Star, 2 Aug 2026).",
    ],
    units: [
      {
        code: "IBA",
        detail: "Institute of Business Administration. 70 MCQ + 30 descriptive.",
        examDate: "2026-12-05",
        examTime: null,
        centre: "Outside centres were not stated for IBA.",
      },
      {
        code: "Science",
        detail: "Science unit. Separate paper for English-medium candidates. 60 MCQ + 40 written.",
        examDate: "2026-12-12",
        examTime: null,
        centre: "Dhaka, RU, CU, KU, University of Barishal, SUST, BAU Mymensingh, BRUR.",
      },
      {
        code: "A/Law/Social",
        detail: "Arts, Law and Social Science. 60 MCQ + 40 written.",
        examDate: "2026-12-19",
        examTime: null,
        centre: "Dhaka, RU, CU, KU, University of Barishal, SUST, BAU Mymensingh, BRUR.",
      },
      {
        code: "Fine Arts",
        detail: "40-mark MCQ and 60-mark drawing.",
        examDate: "2026-12-22",
        examTime: null,
        centre: "Outside centres were not stated for Fine Arts.",
      },
      {
        code: "Business",
        detail: "Business Studies. 60 MCQ + 40 written.",
        examDate: "2026-12-26",
        examTime: null,
        centre: "Dhaka, RU, CU, KU, University of Barishal, SUST, BAU Mymensingh, BRUR.",
      },
    ],
    notes: [
      "First-year classes are scheduled to begin 28 Mar 2027.",
      "Application fee, seat count and admit-card date were not in the stored reports.",
      "A later retake policy may still move these dates. See the watch item on the overview.",
    ],
  }),
  C({
    id: "c-jnu",
    universityId: "jnu",
    title: "Jagannath University undergraduate admission 2026–27",
    summary:
      "An official university release set a five-unit MCQ schedule, all of it in Dhaka. The PDF is not stored in this archive.",
    system: "own",
    publication: "notice",
    confidence: "notice",
    confidenceNote: "The Daily Star (30 Aug 2026) cites an official university release. Restated 4 Nov 2026.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    applicationOpens: "2026-11-15",
    opensAt: "12:00",
    applicationCloses: "2026-12-10",
    closesAt: "23:59",
    examDate: "2027-01-01",
    examTime: "10:00–11:00",
    eligibility: ["Eligibility and GPA bars were not in the stored reports."],
    units: [
      {
        code: "A",
        detail: "Science and Life and Earth Sciences. MCQ.",
        examDate: "2027-01-01",
        examTime: "10:00–11:00",
        centre: "Dhaka",
      },
      {
        code: "E",
        detail: UNIT_UNKNOWN + " MCQ.",
        examDate: "2027-01-08",
        examTime: "10:00–11:00",
        centre: "Dhaka",
      },
      {
        code: "B",
        detail: UNIT_UNKNOWN + " MCQ.",
        examDate: "2027-01-15",
        examTime: "10:00–11:00",
        centre: "Dhaka",
      },
      {
        code: "C",
        detail: UNIT_UNKNOWN + " MCQ.",
        examDate: "2027-01-22",
        examTime: "10:00–11:00",
        centre: "Dhaka",
      },
      {
        code: "D",
        detail: UNIT_UNKNOWN + " MCQ.",
        examDate: "2027-01-23",
        examTime: "10:00–11:00",
        centre: "Dhaka",
      },
    ],
    notes: [
      "All five tests are one hour, 10:00 to 11:00, in Dhaka.",
      "Fee, seats, admit card and result date were not in the stored reports.",
    ],
  }),
  C({
    id: "c-ru",
    universityId: "ru",
    title: "University of Rajshahi undergraduate admission 2026–27",
    summary:
      "Preliminary application window and three unit dates, recommended by an admission sub-committee. Not described as a final circular.",
    system: "own",
    publication: "decision",
    confidence: "preliminary",
    confidenceNote:
      "The Public Relations Office told The Daily Star the dates were recommended at a sub-committee meeting on 16 Aug 2026. The 30 Aug report calls them preliminary.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    applicationOpens: "2026-11-12",
    applicationCloses: "2026-11-27",
    examDate: "2027-01-08",
    eligibility: ["Eligibility was not in the stored reports."],
    units: [
      { code: "B", detail: UNIT_UNKNOWN, examDate: "2027-01-08", examTime: null, centre: "Not stated." },
      { code: "C", detail: UNIT_UNKNOWN, examDate: "2027-01-09", examTime: null, centre: "Not stated." },
      { code: "A", detail: UNIT_UNKNOWN, examDate: "2027-01-16", examTime: null, centre: "Not stated." },
    ],
    notes: [
      "The 12–27 Nov window is a preliminary application period, not confirmed here as the final circular.",
      "Fee, seats and admit-card date were not in the stored reports.",
    ],
  }),
  C({
    id: "c-cu",
    universityId: "cu",
    title: "University of Chittagong undergraduate admission 2026–27",
    summary:
      "Probable test dates from a notice signed by the secretary of the admission committee. The article itself calls the dates probable.",
    system: "own",
    publication: "notice",
    confidence: "preliminary",
    confidenceNote:
      "The Daily Star (30 Aug 2026) says CU set probable dates and cites a notice signed by the admission committee secretary. Treat the calendar as not final.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    applicationOpens: "2026-11-15",
    applicationCloses: "2026-12-10",
    examDate: "2027-01-29",
    eligibility: ["Eligibility was not in the stored reports."],
    units: [
      { code: "C", detail: UNIT_UNKNOWN, examDate: "2027-01-29", examTime: null, centre: "CU, DU and RU campuses." },
      { code: "A", detail: UNIT_UNKNOWN, examDate: "2027-01-30", examTime: null, centre: "CU, DU and RU campuses." },
      { code: "B1", detail: "Sub-unit. Subject not named.", examDate: "2027-02-03", examTime: null, centre: "CU campus only." },
      { code: "B2", detail: "Sub-unit. Subject not named.", examDate: "2027-02-04", examTime: null, centre: "CU campus only." },
      { code: "B", detail: UNIT_UNKNOWN, examDate: "2027-02-05", examTime: null, centre: "CU, DU and RU campuses." },
      { code: "D", detail: UNIT_UNKNOWN, examDate: "2027-02-06", examTime: null, centre: "CU, DU and RU campuses." },
      { code: "D1", detail: "Sub-unit. Subject not named.", examDate: "2027-02-08", examTime: null, centre: "CU campus only." },
    ],
    notes: [
      "Main unit tests at the CU, DU and RU campuses. Sub-unit tests only at CU.",
      "Opening time of day was not stated. Fee, seats and admit card were not stated.",
    ],
  }),
  C({
    id: "c-cou",
    universityId: "cou",
    title: "Comilla University application deadline 2026–27",
    summary:
      "Only a closing date is on file. Opening day, units and the test calendar were not in the stored report.",
    system: "own",
    publication: "decision",
    confidence: "reported",
    confidenceNote:
      "The Daily Star (4 Nov 2026) says Comilla University has set 10 Dec 2026 as the application deadline, with tests planned for later dates. No notice URL is stored here.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    applicationCloses: "2026-12-10",
    eligibility: ["Eligibility was not in the stored report."],
    notes: ["Do not invent an opening date or an examination date for CoU."],
  }),
  C({
    id: "c-ku",
    universityId: "ku",
    title: "Khulna University undergraduate admission 2026–27",
    summary:
      "Test days from an official notice signed by acting registrar Prof SM Mahbubur Rahman, after a Central Admission Committee meeting on 24 Aug 2026. Application dates were not in the report.",
    system: "own",
    publication: "notice",
    confidence: "notice",
    confidenceNote: "The Daily Star (30 Aug 2026) cites the signed notice. Application window is still unknown.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2026-12-17",
    eligibility: ["Eligibility was not in the stored reports."],
    units: [
      { code: "C & D", detail: UNIT_UNKNOWN, examDate: "2026-12-17", examTime: null, centre: "Not stated." },
      { code: "A & B", detail: UNIT_UNKNOWN, examDate: "2026-12-18", examTime: null, centre: "Not stated." },
    ],
    notes: ["Application opening, closing, fee, seats and admit card were not in the stored reports."],
  }),
  C({
    id: "c-kuet",
    universityId: "kuet",
    title: "KUET undergraduate admission test 2026–27",
    summary:
      "The special Academic Council on 25 Aug 2026 fixed the test. The same report said application procedure, eligibility and other details would be announced later in the admission circular.",
    system: "engineering",
    publication: "decision",
    confidence: "notice",
    confidenceNote:
      "Test date is from a cited Academic Council decision. The circular itself was explicitly not yet published as of the 30 Aug 2026 report.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-01-08",
    eligibility: ["Eligibility will be in the circular. It was not announced in the stored reports."],
    notes: [
      "MCQ test, held the same day in Khulna, Dhaka and Rajshahi.",
      "Do not treat 8 Jan 2027 as proof that applications are open.",
    ],
  }),
  C({
    id: "c-mist",
    universityId: "mist",
    title: "MIST undergraduate admission tests 2026–27",
    summary: "A notice from the institute set two test days. Application dates were not in the report.",
    system: "specialized",
    publication: "notice",
    confidence: "notice",
    confidenceNote: "The Daily Star (30 Aug 2026) says the dates come from a notice published by the institute.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2026-12-18",
    eligibility: ["Eligibility was not in the stored reports."],
    units: [
      { code: "C", detail: "Science.", examDate: "2026-12-18", examTime: null, centre: "Not stated." },
      {
        code: "A & B",
        detail: "Engineering and Architecture.",
        examDate: "2026-12-19",
        examTime: null,
        centre: "Not stated.",
      },
    ],
    notes: ["Application window, fee, seats and admit card were not in the stored reports."],
  }),
  C({
    id: "c-ruet",
    universityId: "ruet",
    title: "RUET undergraduate admission test 2026–27",
    summary: "The admission-test steering committee provisionally fixed a date on 29 Aug 2026.",
    system: "engineering",
    publication: "decision",
    confidence: "preliminary",
    confidenceNote: "The Daily Star calls the 14 Jan 2027 date provisional. Application details were not published in that report.",
    sources: [STAR_CLASH, STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-01-14",
    eligibility: ["Eligibility was not in the stored reports."],
    notes: ["Do not treat this as an open circular."],
  }),
  C({
    id: "c-buet",
    universityId: "buet",
    title: "BUET undergraduate admission test 2026–27",
    summary:
      "A Daily Star timeline says BUET has fixed the test for 16 Jan 2027. No BUET notice URL or application window is stored in this archive.",
    system: "engineering",
    publication: "decision",
    confidence: "reported",
    confidenceNote:
      "Stated as fixed in The Daily Star, 4 Nov 2026. This desk has not logged a BUET circular, fee, or eligibility sheet for 2026–27. Earlier BUET circulars from the previous session are not reused here.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-01-16",
    eligibility: ["Eligibility was not in the stored report."],
    notes: [
      "Application opening, closing, fee, seats and admit card are NOT ANNOUNCED in this archive.",
      "Do not copy last year's BUET fee or dates into this session.",
    ],
  }),
  C({
    id: "c-cuet",
    universityId: "cuet",
    title: "CUET undergraduate admission test 2026–27",
    summary: "Only a proposed test date is on file.",
    system: "engineering",
    publication: "decision",
    confidence: "preliminary",
    confidenceNote: "The Daily Star (4 Nov 2026) says CUET has proposed 23 Jan 2027. It does not cite a published circular.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-01-23",
    eligibility: ["Eligibility was not in the stored report."],
    notes: ["Application window is NOT ANNOUNCED."],
  }),
  C({
    id: "c-gst",
    universityId: "gst",
    title: "GST cluster admission tests 2026–27",
    summary:
      "Twenty universities. Tests on three days in March 2027. Application dates were not announced, and the member list was not published in the stored report.",
    system: "gst",
    publication: "decision",
    confidence: "reported",
    confidenceNote:
      "The Daily Star (4 Nov 2026) says there may be more room to move these dates because applications are not open yet. Membership is intentionally blank in this archive.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-03-19",
    eligibility: ["Eligibility was not in the stored report."],
    units: [
      { code: "Day 1", detail: "Cluster test day. Paper split not announced.", examDate: "2027-03-19", examTime: null, centre: "Not stated." },
      { code: "Day 2", detail: "Cluster test day. Paper split not announced.", examDate: "2027-03-20", examTime: null, centre: "Not stated." },
      { code: "Day 3", detail: "Cluster test day. Paper split not announced.", examDate: "2027-03-27", examTime: null, centre: "Not stated." },
    ],
    notes: [
      "Do not mark a university as a GST member until the official list is logged.",
      "Universities already running their own tests in the stored reports — DU, RU, CU, JnU, KU — are not placed in this cluster.",
    ],
  }),
  C({
    id: "c-agri",
    universityId: "agri",
    title: "Agricultural cluster combined test 2026–27",
    summary:
      "Nine universities, coordinated by Sher-e-Bangla Agricultural University. Combined test on 2 Jan 2027. Detailed application arrangements were not announced.",
    system: "agricultural",
    publication: "decision",
    confidence: "reported",
    confidenceNote:
      "The Daily Star (4 Nov 2026) says the cluster has fixed 2 January. It does not name the nine universities or the application window.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2027-01-02",
    eligibility: ["Eligibility was not in the stored report."],
    notes: [
      "Coordinator cited: Sher-e-Bangla Agricultural University.",
      "This archive does not assign individual agricultural universities to the cluster.",
    ],
  }),
  C({
    id: "c-dghs",
    universityId: "dghs",
    title: "MBBS and BDS admission test 2026–27",
    summary: "The medical and dental admission test is tentatively planned for 4 Dec 2026. Nothing else from the circular is on file.",
    system: "medical",
    publication: "decision",
    confidence: "preliminary",
    confidenceNote: "The Daily Star (4 Nov 2026) uses the word tentatively. Fee, seats, eligibility and the application window are not stored here.",
    sources: [STAR_RETAKE],
    updatedOn: "2026-11-04",
    examDate: "2026-12-04",
    eligibility: ["Eligibility was not in the stored report."],
    notes: [
      "This is the DGHS / government medical college test, not a medical university's postgraduate admission.",
      "The retake discussion may move this date. It is not confirmed.",
    ],
  }),
];

export const EVIDENCE_COPY = [
  "OFFICIAL NOTICE CITED — a news report quotes a university notice, press release, or signed decision. The PDF is linked only when this archive actually has a URL.",
  "REPORTED — a newsroom stated the date. This desk has not stored the underlying document.",
  "REPORTED · NOT FINAL — the source itself calls the date proposed, probable, provisional or tentative.",
  "NOT ANNOUNCED — this archive does not have the fact. It is not a guess and it is not last year's number.",
  "MARKED VERIFIED ON THIS DESK — your own check. It does not rewrite the source grade.",
];
