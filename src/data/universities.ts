import type { University } from "@/data/types";

const MEDICAL_UNI =
  "This is a medical university. Government MBBS and BDS seats are filled through the central DGHS test, which is a separate record in this archive. No 2026–27 circular for this university is stored here.";

function U(
  id: string,
  name: string,
  shortName: string,
  track: University["track"],
  city: string,
  website: string | null,
  extra?: Partial<University>,
): University {
  return {
    id,
    kind: "university",
    name,
    shortName,
    nameBn: "",
    track,
    tags: [],
    city,
    website,
    admissionUrl: null,
    directoryNote: "",
    ...extra,
  };
}

export const seedUniversities: University[] = [
  U("du", "University of Dhaka", "DU", "general", "Dhaka", "https://www.du.ac.bd", {
    nameBn: "ঢাকা বিশ্ববিদ্যালয়",
    directoryNote: "Runs its own undergraduate admission. Not part of the GST cluster in the 2026–27 reports stored here.",
  }),
  U("ru", "University of Rajshahi", "RU", "general", "Rajshahi", "https://www.ru.ac.bd", {
    nameBn: "রাজশাহী বিশ্ববিদ্যালয়",
    directoryNote: "Runs its own undergraduate admission. The stored 2026–27 dates are still marked preliminary by the university's own public relations office.",
  }),
  U("cu", "University of Chittagong", "CU", "general", "Chattogram", "https://www.cu.ac.bd", {
    nameBn: "চট্টগ্রাম বিশ্ববিদ্যালয়",
    directoryNote: "Runs its own undergraduate admission. Stored 2026–27 test dates were described as probable.",
  }),
  U("ju", "Jahangirnagar University", "JU", "general", "Savar, Dhaka", "https://www.juniv.edu", {
    nameBn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("iu", "Islamic University, Bangladesh", "IU", "general", "Kushtia", "https://www.iu.ac.bd", {
    nameBn: "ইসলামী বিশ্ববিদ্যালয়",
    directoryNote: "No 2026–27 notice is stored in this archive. Do not assume GST membership until a circular names it.",
  }),
  U("ku", "Khulna University", "KU", "general", "Khulna", "https://www.ku.ac.bd", {
    nameBn: "খুলনা বিশ্ববিদ্যালয়",
    directoryNote: "Runs its own undergraduate admission for 2026–27, according to a notice cited by The Daily Star.",
  }),
  U("jnu", "Jagannath University", "JnU", "general", "Dhaka", "https://www.jnu.ac.bd", {
    nameBn: "জগন্নাথ বিশ্ববিদ্যালয়",
    directoryNote: "Runs its own undergraduate admission. Not the same institution as Jahangirnagar University (JU).",
  }),
  U("cou", "Comilla University", "CoU", "general", "Cumilla", "https://www.cou.ac.bd", {
    nameBn: "কুমিল্লা বিশ্ববিদ্যালয়",
    directoryNote: "A 4 Nov 2026 Daily Star timeline gives an application deadline only. Opening date and test dates are not in that report.",
  }),
  U("jkkniu", "Jatiya Kabi Kazi Nazrul Islam University", "JKKNIU", "general", "Trishal, Mymensingh", "https://www.jkkniu.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("brur", "Begum Rokeya University, Rangpur", "BRUR", "general", "Rangpur", "https://www.brur.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive. BRUR is also named as a Dhaka University outside centre, which is not a BRUR admission circular.",
  }),
  U("bu", "University of Barishal", "BU", "general", "Barishal", "https://www.bu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("rub", "Rabindra University, Bangladesh", "RUB", "general", "Shahjadpur, Sirajganj", "https://www.rub.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("neu", "Netrokona University", "NeU", "general", "Netrokona", "https://neu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("kiu", "Kishoreganj University", "KiU", "general", "Kishoreganj", "https://bsmru.ac.bd", {
    directoryNote: "UGC's public list still publishes the pre-rename host bsmru.ac.bd. No 2026–27 notice is stored here.",
  }),
  U("nau", "Naogaon University", "NaU", "general", "Naogaon", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("meu", "Meherpur University", "MeU", "general", "Meherpur", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("thu", "Thakurgaon University", "ThU", "general", "Thakurgaon", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("ub", "University of Bogura", "UB", "general", "Bogura", "https://www.ub.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("dcu", "Dhaka Central University", "DCU", "general", "Dhaka", "https://dcu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),

  U("buet", "Bangladesh University of Engineering & Technology", "BUET", "engineering", "Dhaka", "https://www.buet.ac.bd", {
    nameBn: "বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়",
    directoryNote: "Own undergraduate test. A 4 Nov 2026 Daily Star timeline says the test date is fixed. This archive does not have the circular URL.",
  }),
  U("cuet", "Chittagong University of Engineering & Technology", "CUET", "engineering", "Chattogram", "https://www.cuet.ac.bd", {
    nameBn: "চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    directoryNote: "The only stored 2026–27 date is a proposed test day. Not a confirmed circular.",
  }),
  U("kuet", "Khulna University of Engineering & Technology", "KUET", "engineering", "Khulna", "https://www.kuet.ac.bd", {
    nameBn: "খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    directoryNote: "Academic Council fixed a test date. The Daily Star explicitly said the application circular was still to come.",
  }),
  U("ruet", "Rajshahi University of Engineering & Technology", "RUET", "engineering", "Rajshahi", "https://www.ruet.ac.bd", {
    nameBn: "রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    directoryNote: "Test date was provisionally fixed. Not a confirmed circular.",
  }),
  U("duet", "Dhaka University of Engineering & Technology", "DUET", "engineering", "Gazipur", "https://www.duet.ac.bd", {
    directoryNote: "DUET's undergraduate entry has historically been a diploma-to-degree route, not the BUET-style HSC test. The 2026–27 circular is not stored here.",
  }),

  U("sust", "Shahjalal University of Science & Technology", "SUST", "science-technology", "Sylhet", "https://www.sust.edu", {
    directoryNote: "No 2026–27 notice is stored here. SUST is also named as a Dhaka University outside centre, which is not a SUST circular.",
  }),
  U("hstu", "Hajee Mohammad Danesh Science & Technology University", "HSTU", "science-technology", "Dinajpur", "https://www.hstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("mbstu", "Mawlana Bhashani Science & Technology University", "MBSTU", "science-technology", "Tangail", "https://www.mbstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("pstu", "Patuakhali Science and Technology University", "PSTU", "science-technology", "Patuakhali", "https://www.pstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("nstu", "Noakhali Science and Technology University", "NSTU", "science-technology", "Noakhali", "https://www.nstu.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("just", "Jessore University of Science & Technology", "JUST", "science-technology", "Jashore", "https://www.just.edu.bd", {
    directoryNote: "UGC's public list still uses the spelling Jessore. No 2026–27 notice is stored here.",
  }),
  U("pust", "Pabna University of Science and Technology", "PUST", "science-technology", "Pabna", "https://www.pust.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("gstu", "Gopalganj Science & Technology University", "GSTU", "science-technology", "Gopalganj", "https://www.gstu.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive. Not the same thing as the GST admission cluster.",
  }),
  U("rmstu", "Rangamati Science and Technology University", "RMSTU", "science-technology", "Rangamati", "https://www.rmstu.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("jstu", "Jamalpur Science and Technology University", "JSTU", "science-technology", "Jamalpur", "https://bsfmstu.ac.bd", {
    directoryNote: "UGC's public list still publishes the pre-rename host bsfmstu.ac.bd. No 2026–27 notice is stored here.",
  }),
  U("cstu", "Chandpur Science and Technology University", "CSTU", "science-technology", "Chandpur", "https://www.cstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("sstu", "Sunamganj Science and Technology University", "SSTU", "science-technology", "Sunamganj", "https://www.sstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("prstu", "Pirojpur Science & Technology University", "PRSTU", "science-technology", "Pirojpur", "https://www.prstu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("lstu", "Lakshmipur Science & Technology University", "LSTU", "science-technology", "Lakshmipur", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("nrstu", "Narayanganj Science and Technology University", "NrSTU", "science-technology", "Narayanganj", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("uftb", "University of Frontier Technology, Bangladesh", "UFTB", "science-technology", "Gazipur", "https://www.uftb.ac.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),

  U("bau", "Bangladesh Agricultural University", "BAU", "agricultural", "Mymensingh", "https://www.bau.edu.bd", {
    nameBn: "বাংলাদেশ কৃষি বিশ্ববিদ্যালয়",
    directoryNote: "No 2026–27 BAU circular is stored here. BAU is named as a Dhaka University outside centre, which is not a BAU admission circular. Membership of this year's nine-university agricultural cluster was not published in the stored report.",
  }),
  U("gau", "Gazipur Agricultural University", "GAU", "agricultural", "Gazipur", "https://gau.edu.bd", {
    directoryNote: "No 2026–27 notice is stored here. Cluster membership for 2026–27 was not named in the stored report.",
  }),
  U("sau", "Sher-e-Bangla Agricultural University", "SAU", "agricultural", "Dhaka", "https://www.sau.edu.bd", {
    nameBn: "শেরেবাংলা কৃষি বিশ্ববিদ্যালয়",
    directoryNote: "The Daily Star (4 Nov 2026) names Sher-e-Bangla Agricultural University as coordinator of the nine-university agricultural cluster. The nine members were not listed. This is not the same host as Sylhet Agricultural University.",
  }),
  U("sylau", "Sylhet Agricultural University", "SylAU", "agricultural", "Sylhet", "https://www.sau.ac.bd", {
    directoryNote: "Host on the UGC list is sau.ac.bd — not Sher-e-Bangla (sau.edu.bd). No 2026–27 notice is stored here.",
  }),
  U("kau", "Khulna Agricultural University", "KAU", "agricultural", "Khulna", "https://www.kau.edu.bd", {
    directoryNote: "No 2026–27 notice is stored here.",
  }),
  U("hau", "Hobiganj Agricultural University", "HAU", "agricultural", "Hobiganj", "https://www.hau.ac.bd", {
    directoryNote: "Spelling follows the UGC public list (Hobiganj). No 2026–27 notice is stored here.",
  }),
  U("kurau", "Kurigram Agricultural University", "KurAU", "agricultural", "Kurigram", "https://www.kuriau.edu.bd", {
    directoryNote: "No 2026–27 notice is stored here.",
  }),
  U("shau", "Shariatpur Agricultural University", "ShAU", "agricultural", "Shariatpur", null, {
    directoryNote: "UGC's public list does not publish a website. No 2026–27 notice is stored here.",
  }),
  U("cvasu", "Chittagong Veterinary and Animal Sciences University", "CVASU", "agricultural", "Chattogram", "https://www.cvasu.ac.bd", {
    directoryNote: "No 2026–27 notice is stored here.",
  }),

  U("bmu-med", "Bangladesh Medical University", "BMU", "medical", "Dhaka", "https://www.bmu.ac.bd", {
    directoryNote: MEDICAL_UNI + " Not Bangladesh Maritime University.",
  }),
  U("cmu", "Chittagong Medical University", "CMU", "medical", "Chattogram", "https://www.cmu.edu.bd", {
    directoryNote: MEDICAL_UNI,
  }),
  U("rmu", "Rajshahi Medical University", "RMU", "medical", "Rajshahi", "https://www.rmu.ac.bd", {
    directoryNote: MEDICAL_UNI,
  }),
  U("smu", "Sylhet Medical University", "SMU", "medical", "Sylhet", "https://www.bsfmmu.edu.bd", {
    directoryNote: MEDICAL_UNI + " UGC's list still publishes the pre-rename host bsfmmu.edu.bd.",
  }),
  U("kmu", "Khulna Medical University", "KMU", "medical", "Khulna", "https://www.shmu.ac.bd", {
    directoryNote: MEDICAL_UNI + " UGC's list still publishes the pre-rename host shmu.ac.bd.",
  }),

  U("bup", "Bangladesh University of Professionals", "BUP", "specialized", "Dhaka", "https://www.bup.edu.bd", {
    directoryNote: "Runs its own undergraduate admission. No 2026–27 notice is stored here.",
  }),
  U("mist", "Military Institute of Science and Technology", "MIST", "specialized", "Dhaka", "https://mist.ac.bd", {
    nameBn: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি",
    tags: ["engineering"],
    directoryNote: "Undergraduate notice for 2026–27 was cited by The Daily Star. Application dates were not in that report.",
  }),
  U("butex", "Bangladesh University of Textiles", "BUTEX", "specialized", "Dhaka", "https://www.butex.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("maru", "Bangladesh Maritime University", "MarU", "specialized", "Dhaka", "https://bmu.edu.bd", {
    directoryNote: "Not Bangladesh Medical University (bmu.ac.bd). No 2026–27 notice is stored here.",
  }),
  U("aaub", "Aviation and Aerospace University, Bangladesh", "AAUB", "specialized", "Lalmonirhat", "https://www.aaub.edu.bd", {
    directoryNote: "No 2026–27 notice is stored in this archive.",
  }),
  U("iut", "Islamic University of Technology", "IUT", "specialized", "Gazipur", "https://www.iutoic-dhaka.edu", {
    tags: ["engineering"],
    directoryNote: "International (OIC) university at Board Bazar. Not a UGC private university. No 2026–27 notice is stored here.",
  }),

  U("nu", "National University", "NU", "national", "Gazipur", "https://www.nu.edu.bd", {
    directoryNote: "Admits students to affiliated colleges under its own system. Not a GST university. No 2026–27 notice is stored here.",
  }),
  U("bou", "Bangladesh Open University", "BOU", "national", "Gazipur", "https://www.bou.ac.bd", {
    directoryNote: "Open-admission programmes, separate from campus university tests. No 2026–27 notice is stored here.",
  }),
  U("iau", "Islamic Arabic University", "IAU", "national", "Dhaka", "https://www.iau.edu.bd", {
    directoryNote: "Admits through affiliated madrasas. No 2026–27 notice is stored here.",
  }),

  U("nsu", "North South University", "NSU", "private", "Dhaka", "https://www.northsouth.edu", {
    directoryNote: "Private university. Semester intake. No 2026–27 circular is stored here.",
  }),
  U("bracu", "BRAC University", "BRACU", "private", "Dhaka", "https://www.bracu.ac.bd", {
    directoryNote: "Private university. Semester intake. No 2026–27 circular is stored here.",
  }),
  U("iub", "Independent University, Bangladesh", "IUB", "private", "Dhaka", "https://www.iub.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("aust", "Ahsanullah University of Science and Technology", "AUST", "private", "Dhaka", "https://www.aust.edu", {
    tags: ["engineering"],
    directoryNote: "Private engineering-focused university. No 2026–27 circular is stored here.",
  }),
  U("aiub", "American International University-Bangladesh", "AIUB", "private", "Dhaka", "https://www.aiub.edu", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("ewu", "East West University", "EWU", "private", "Dhaka", "https://www.ewubd.edu", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("uiu", "United International University", "UIU", "private", "Dhaka", "https://www.uiu.ac.bd", {
    tags: ["engineering"],
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("diu", "Daffodil International University", "DIU", "private", "Dhaka", "https://daffodilvarsity.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("uap", "University of Asia Pacific", "UAP", "private", "Dhaka", "https://www.uap-bd.edu", {
    tags: ["engineering"],
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("ulab", "University of Liberal Arts Bangladesh", "ULAB", "private", "Dhaka", "https://ulab.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("iubat", "International University of Business Agriculture and Technology", "IUBAT", "private", "Dhaka", "https://www.iubat.edu", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("bubt", "Bangladesh University of Business and Technology", "BUBT", "private", "Dhaka", "https://www.bubt.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("green", "Green University of Bangladesh", "GUB", "private", "Dhaka", "https://green.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("seu", "Southeast University", "SEU", "private", "Dhaka", "https://www.seu.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("iiuc", "International Islamic University Chittagong", "IIUC", "private", "Chattogram", "https://www.iiuc.ac.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("uits", "University of Information Technology and Sciences", "UITS", "private", "Dhaka", "https://www.uits.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("puc", "Premier University", "PUC", "private", "Chattogram", "https://www.puc.ac.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("lus", "Leading University", "LUS", "private", "Sylhet", "https://www.lus.ac.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("eastern", "Eastern University", "EU", "private", "Dhaka", "https://www.easternuni.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("baust", "Bangladesh Army University of Science and Technology", "BAUST", "private", "Saidpur", "https://www.baust.edu.bd", {
    tags: ["engineering"],
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
  U("stamford", "Stamford University Bangladesh", "SUB", "private", "Dhaka", "https://www.stamforduniversity.edu.bd", {
    directoryNote: "Private university. No 2026–27 circular is stored here.",
  }),
];

export const seedSystems: University[] = [
  {
    id: "gst",
    kind: "system",
    name: "GST Cluster — General, Science and Technology",
    shortName: "GST",
    nameBn: "জিএসটি গুচ্ছ",
    track: "system",
    tags: ["gst"],
    city: "National",
    website: null,
    admissionUrl: null,
    directoryNote:
      "The Daily Star (4 Nov 2026) reported a 20-university cluster with tests on 19, 20 and 27 March 2027. Application dates were not announced. The twenty members were not named. This archive does not guess membership.",
  },
  {
    id: "agri",
    kind: "system",
    name: "Agricultural Cluster — nine universities",
    shortName: "AGRI",
    nameBn: "কৃষি গুচ্ছ",
    track: "system",
    tags: ["agricultural"],
    city: "National",
    website: "https://www.sau.edu.bd",
    admissionUrl: null,
    directoryNote:
      "Coordinated this year by Sher-e-Bangla Agricultural University, according to The Daily Star (4 Nov 2026). Combined test 2 Jan 2027. Application arrangements and the nine members were not announced.",
  },
  {
    id: "dghs",
    kind: "system",
    name: "Medical and Dental Admission — DGHS",
    shortName: "DGHS",
    nameBn: "এমবিবিএস ও বিডিএস",
    track: "system",
    tags: ["medical"],
    city: "National",
    website: "https://www.dghs.gov.bd",
    admissionUrl: null,
    directoryNote:
      "Central admission for government medical and dental colleges. The Daily Star (4 Nov 2026) called the test date tentative. This is not the postgraduate admission of Bangladesh Medical University.",
  },
];
