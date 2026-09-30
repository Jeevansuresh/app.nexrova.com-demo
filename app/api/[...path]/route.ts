import { NextRequest, NextResponse } from "next/server";

type AnyRecord = Record<string, any>;
type ChatMsg = { role: "user" | "assistant"; content: string };

type GapKey =
  | "process_intake"
  | "inventory"
  | "financial"
  | "sales"
  | "diversion"
  | "closing"
  | "other";

const TRANSCRIPT = `Aria: வணக்கம்! Oasis reservations desk. This is Aria speaking.
Guest: ஹலோ Aria, next weekend-ku family stay plan pannrom. 2 rooms தேவை.
Aria: Sure sir, check-in date and total guests சொல்லுங்க.
Guest: 12th October check-in, 14th October checkout, total 5 adults + 1 kid.
Aria: Great. Breakfast, early check-in request, and flexible cancellation options available.
Guest: Super, rate konjam share pannunga. If value good, naanga immediate confirm pannuvom.
Aria: Done. I’ll send detailed quote, room photos, and payment link on WhatsApp in 5 mins.`;

type TranscriptBundle = {
  full: string;
  original: string;
  english: string;
};

function buildTranscriptBundle(params: {
  index: number;
  callerName: string;
  property: string;
  outcome: string;
  rooms: number;
  nights: number;
  checkinDate: string;
  checkoutDate: string;
  estimatedRevenue: number;
}): TranscriptBundle {
  const propertyLabel = PROPERTY_LABELS[params.property] || params.property;
  const stayLine = `${params.rooms} room${params.rooms > 1 ? "s" : ""}, ${params.nights} night${params.nights > 1 ? "s" : ""}`;
  const occasion = ["family trip", "corporate offsite", "wedding function", "temple visit", "medical visit", "college reunion"][params.index % 6];
  const budgetBand = ["₹6k-8k", "₹8k-10k", "₹10k-12k", "₹12k+", "value package", "corporate slab"][params.index % 6];
  const urgency = ["same-day confirmation", "within 2 hours", "before evening", "today EOD", "by tonight", "immediate hold request"][params.index % 6];

  const originalTamilMixed = [
    `Aria: வணக்கம்! ${propertyLabel} reservations-ku welcome. Naan Aria pesuren.`,
    `Guest: ஹலோ Aria, naan ${params.callerName}. ${params.checkinDate} check-in, ${params.checkoutDate} checkout plan pannirukkom.`,
    `Aria: Kandippa. Stay requirement note panniten — ${stayLine}. Total guests and travel purpose confirm pannalama?`,
    `Guest: Approx ${params.rooms + 2} members. Idhu ${occasion} trip, so rooms clean-a irukkanum and check-in smooth-a venum.`,
    `Aria: Sure. Deluxe/Premium categories-la central AC, breakfast buffet, hi-speed Wi‑Fi, 24x7 hot water, lift access ellam include pannrom.`,
    `Guest: Nice. My parents senior citizens; ground floor or lift-near room கிடைக்குமா?`,
    `Aria: கிடைக்கும். Wheelchair-friendly route and less walking distance rooms note pannuren.`,
    `Guest: Rate-wise konjam clarify pannunga. Budget roughly ${budgetBand} range-la irukkanum.`,
    `Aria: Ippo demand high irukku, but long-stay bundle + meal credit சேர்த்து better value kudukka mudiyum.`,
    `Guest: Hidden charges irukka? GST, extra bed, early check-in charge separate-a?`,
    `Aria: Transparent pricing only. GST split, extra bed slab, early check-in subject-to-availability nu quote-la line by line share pannuren.`,
    `Guest: Corporate invoice venum-na company GSTIN add pannalaama?`,
    `Aria: ஆம், billing team same-day proforma and final GST invoice arrange panniduvaanga.`,
    `Guest: Cancellation policy enna? Last-minute plan change aana penalty avoid panna try pannrom.`,
    `Aria: Check-in-ku 48 hours munnadi free cancellation. After that one-night retention; rest refundable policy apply aagum.`,
    `Guest: Super. Please include breakfast timings, parking, kids meal options, and nearby transport info too.`,
    `Aria: Sure. WhatsApp-la room photos, inclusion matrix, map pin, and sample itinerary anuppuren.`,
    `Guest: Nalla irukku. En spouse kooda discuss panni ${urgency} final confirmation kudukren.`,
    `Aria: Perfect. I’m marking this lead as high-intent, rate hold for limited window, and callback reminder set pannuren.`,
    `Guest: Great support, thanks Aria. Message vandhadum advance payment initiate pannrom.`,
    `Aria: Thank you! Quick follow-up panren.`,
    `[System]: Property=${propertyLabel}; Outcome=${params.outcome}; Stay=${stayLine}; RevenuePotential=INR ${params.estimatedRevenue.toLocaleString("en-IN")}; Intent=High; TranscriptStyle=tamil-english-mixed-realistic.`,
  ].join("\n");

  const englishTranslation = [
    `Aria: Hello and welcome to ${propertyLabel} reservations. This is Aria speaking.`,
    `Guest: Hi Aria, this is ${params.callerName}. We are planning check-in on ${params.checkinDate} and checkout on ${params.checkoutDate}.`,
    `Aria: Certainly. I have noted your requirement — ${stayLine}. May I confirm total guests and travel purpose?`,
    `Guest: We are around ${params.rooms + 2} members. This is a ${occasion}, so we need clean rooms and a smooth check-in process.`,
    `Aria: Of course. Deluxe/Premium categories include central AC, breakfast buffet, high-speed Wi‑Fi, 24x7 hot water, and lift access.`,
    `Guest: Nice. My parents are senior citizens; can we get rooms near the lift or with easy access?`,
    `Aria: Yes, we can assign a low-mobility-friendly room cluster and note wheelchair routing.`,
    `Guest: Please clarify rates too. Our budget is around ${budgetBand}.`,
    `Aria: Demand is currently high, but I can include a long-stay bundle and meal credits to improve total value.`,
    `Guest: Any hidden charges? Please specify GST, extra bed cost, and early check-in terms.`,
    `Aria: We share transparent line-item pricing. GST split, extra-bed slab, and early check-in conditions will be listed in the quote.`,
    `Guest: If needed, can you issue a corporate GST invoice?`,
    `Aria: Yes, billing can issue both proforma and final GST invoice on the same day.`,
    `Guest: What is your cancellation policy? We want flexibility in case plans change.`,
    `Aria: Free cancellation until 48 hours before check-in. After that, one-night retention applies and the remainder is refundable as per policy.`,
    `Guest: Great. Please include breakfast timings, parking details, kids meal options, and nearby transport notes.`,
    `Aria: Sure. I’ll send room photos, inclusion matrix, map pin, and a sample itinerary on WhatsApp.`,
    `Guest: Sounds good. I’ll confirm ${urgency} after discussing with my spouse.`,
    `Aria: Perfect. I’m tagging this as high-intent, applying a short rate hold, and setting a callback reminder.`,
    `Guest: Excellent support, thanks Aria. We’ll initiate advance payment once we receive the quote.`,
    `Aria: Thank you. I’ll follow up shortly.`,
    `[System]: Property=${propertyLabel}; Outcome=${params.outcome}; Stay=${stayLine}; RevenuePotential=INR ${params.estimatedRevenue.toLocaleString("en-IN")}; Intent=High; TranscriptStyle=tamil-english-mixed-realistic.`,
  ].join("\n");

  return {
    full: `POLISHED ORIGINAL TRANSCRIPT
${originalTamilMixed}

ENGLISH TRANSLATED TRANSCRIPT
${englishTranslation}`,
    original: originalTamilMixed,
    english: englishTranslation,
  };
}

const PROPERTY_IDS: Record<string, string> = {
  gandhi: "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47",
  ridhi: "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO",
  qbyk: "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66",
};

const ID_TO_PROPERTY: Record<string, string> = Object.fromEntries(
  Object.entries(PROPERTY_IDS).map(([property, id]) => [id, property])
);

const PROPERTY_LABELS: Record<string, string> = {
  gandhi: "Oasis Grand",
  ridhi: "Oasis Palm",
  qbyk: "Oasis Boutique",
};

const SEGMENTS = ["family", "corporate", "wedding", "solo", "group", "long_stay"] as const;
const LOSS_REASONS = ["price_too_high", "no_rooms_available", "competitor_offer", "no_followup"] as const;

let SETTINGS: AnyRecord = {
  escalation_number: "+91 98765 00123",
  followup_interval_hours: 4,
  sync_status: "active",
  booking_images: [
    "oasis-grand/lobby-suite.jpg",
    "oasis-palm/poolside-villa.jpg",
    "oasis-boutique/heritage-suite.jpg",
  ],
  followup_tiers: ["A", "B", "C"],
  picky_assist_enabled: true,
  picky_assist_token: "demo_token",
  picky_assist_application: 121,
  picky_assist_template_id: "wa_template_booking_intent",
  picky_assist_media_url: "https://demo.nexrova.local/media/offer.jpg",
  picky_assist_language: "en_US",
  blacklist_keywords: ["already booked", "wrong number"],
};

let FOLDERS = ["oasis-grand", "oasis-palm", "oasis-boutique"];
let IMAGES = [
  "oasis-grand/lobby-suite.jpg",
  "oasis-grand/boardroom.jpg",
  "oasis-palm/poolside-villa.jpg",
  "oasis-boutique/heritage-suite.jpg",
];

const KB = new Map<string, string>([
  ["main_agent_prompt.txt", "You are a hotel call assistant."],
  ["knowledge.txt", "Synthetic hotel facts for demo only."],
  ["analysis_extraction_prompt.txt", "Extract booking signals."],
  ["analysis_scoring_prompt.txt", "Score lead quality."],
  ["analysis_decision_prompt.txt", "Recommend action and tier."],
  ["coaching_report_prompt.txt", "Generate coaching notes."],
  ["weekly_brief_prompt.txt", "Generate weekly brief."],
  ["aggregate_intelligence_prompt.txt", "Generate aggregate intelligence."],
]);

let CONTACTS = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  full_name: `Guest ${i + 1}`,
  phone: `+91 90011 ${String(22000 + i).padStart(5, "0")}`,
}));

const CHAT_SESSIONS = new Map<string, ChatMsg[]>();

const day = (value?: string | null): string => (value ? String(value).slice(0, 10) : "");

const json = (data: AnyRecord, status = 200): NextResponse =>
  NextResponse.json(data, { status });

const readBody = async <T = AnyRecord>(req: NextRequest): Promise<T> => {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
};

const safeNum = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function parsePath(req: NextRequest): string[] {
  const full = req.nextUrl.pathname;
  const idx = full.indexOf("/api/");
  const raw = idx >= 0 ? full.slice(idx + 5) : full;
  return raw
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}

function normalizeProperty(raw: string | null): string | null {
  if (!raw || raw === "all") return null;
  return ID_TO_PROPERTY[raw] || raw;
}

function hourBucket(ts: string): string {
  const date = new Date(ts);
  const hour = date.getHours();
  const next = (hour + 1) % 24;
  return `${String(hour).padStart(2, "0")}:00-${String(next).padStart(2, "0")}:00`;
}

function createRow(index: number): AnyRecord {
  const now = new Date();
  const todayIst = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);

  const callWindows = [
    { hour: 9, minutes: [5, 14, 23, 35, 48] },
    { hour: 11, minutes: [6, 18, 31, 44, 56] },
    { hour: 13, minutes: [12, 27, 41, 53] },
    { hour: 16, minutes: [3, 16, 28, 39, 52] },
    { hour: 19, minutes: [7, 19, 33, 46, 57] },
  ];

  const totalWindowCapacity = callWindows.reduce((sum, bucket) => sum + bucket.minutes.length, 0);
  const normalizedIndex = ((index % totalWindowCapacity) + totalWindowCapacity) % totalWindowCapacity;

  let cursor = 0;
  let hour = 9;
  let minute = 0;

  for (const bucket of callWindows) {
    const nextCursor = cursor + bucket.minutes.length;
    if (normalizedIndex < nextCursor) {
      hour = bucket.hour;
      minute = bucket.minutes[normalizedIndex - cursor];
      break;
    }
    cursor = nextCursor;
  }

  const ts = `${todayIst}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`;
  const property = (["gandhi", "ridhi", "qbyk"] as const)[index % 3];
  const segment = SEGMENTS[index % SEGMENTS.length];
  const booking = true;

  const outcome = booking
    ? index % 5 === 0
      ? "lost"
      : index % 4 === 0
      ? "followup_needed"
      : "won"
    : "general_enquiry";

  const rooms = booking ? [1, 1, 2, 2, 3, 4][index % 6] : 0;
  const nights = booking ? [1, 2, 2, 3, 4, 5, 7][index % 7] : 0;

  const intentScore = clamp(95 - (index % 15) * 4 + (index % 3), 20, 98);
  const lockInScore = clamp(88 - (index % 12) * 4, 10, 95);
  const revenueScore = clamp(84 - (index % 11) * 3 + (index % 2), 10, 96);
  const totalScore = clamp(Math.round(intentScore * 0.35 + lockInScore * 0.3 + revenueScore * 0.35), 12, 99);

  const checkin = booking ? new Date(now.getTime() + (3 + (index % 30)) * 86400000) : null;
  const checkout = checkin ? new Date(checkin.getTime() + nights * 86400000) : null;
  const estimatedRevenue = booking
    ? Math.round(rooms * nights * (7600 + (index % 5) * 900) + (index % 3) * 2200)
    : 0;

  const priceSensitive = outcome === "lost" || outcome === "followup_needed" || index % 5 === 0 ? 1 : 0;
  const missingGreeting = index % 8 === 0;
  const weakFormat = index % 7 === 0;
  const repeatedInfo = index % 6 === 0;

  const fdGaps: GapKey[] = [];
  if (outcome === "lost") fdGaps.push("financial", "closing");
  if (priceSensitive) fdGaps.push("sales");
  if (weakFormat) fdGaps.push("process_intake");
  if (index % 10 === 0) fdGaps.push("diversion");
  if (index % 11 === 0) fdGaps.push("inventory");

  const id = index + 1;
  const callUuid = `call_${String(id).padStart(4, "0")}`;
  const callerName = [
    "Aarav Shah",
    "Mira Kapoor",
    "Rohan Batra",
    "Ananya Mehta",
    "Dev Khanna",
    "Priyanka Sen",
    "Kabir Jain",
    "Ira Joshi",
    "Samar Gill",
    "Nisha Rao",
    "Arjun Patel",
    "Neha Bedi",
  ][index % 12];

  const callerPhone = `+91 98980 ${String(11000 + (index % 90)).padStart(5, "0")}`;
  const checkinDate = checkin ? day(checkin.toISOString()) : null;
  const checkoutDate = checkout ? day(checkout.toISOString()) : null;
  const stayDates = checkinDate && checkoutDate ? `${checkinDate} to ${checkoutDate}` : "N/A";
  const transcriptBundle = buildTranscriptBundle({
    index,
    callerName,
    property,
    outcome,
    rooms,
    nights,
    checkinDate: checkinDate || "N/A",
    checkoutDate: checkoutDate || "N/A",
    estimatedRevenue,
  });

  return {
    id,
    s_no: id,
    call_uuid: callUuid,
    caller_name: callerName,
    name: callerName,
    persona_name: callerName,
    caller_phone: callerPhone,
    phone: callerPhone,
    created_at: ts,
    created_at_iso: ts,
    call_timestamp: ts,
    call_date: day(ts),
    property_called: property,
    gdrive_folder_id: PROPERTY_IDS[property],
    source: index % 7 === 0 ? "android_auto" : index % 6 === 0 ? "manual" : "gdrive",
    call_type: booking ? (segment === "wedding" ? "event_enquiry" : "booking") : "general_enquiry",
    inquiry_type: booking ? "Booking" : "General",
    outcome,
    total_score: totalScore,
    intent_score: intentScore,
    lock_in_score: lockInScore,
    revenue_score: revenueScore,
    extraction_confidence: Number((0.78 + (index % 18) / 100).toFixed(2)),
    enquirer_segment: segment,
    tier: booking ? (totalScore >= 80 ? "A" : totalScore >= 65 ? "B" : totalScore >= 50 ? "C" : "D") : "N/A",
    needs_followup: outcome === "won" || !booking ? 0 : 1,
    followup_sent: outcome === "won" ? 1 : index % 3 === 0 ? 1 : 0,
    followup_action:
      outcome === "won"
        ? "Send confirmation and add-on options"
        : outcome === "lost"
        ? "Re-engage with value-first proposal"
        : "Callback in 2 hours with tailored package",
    followup_stage:
      outcome === "won" ? "completed" : outcome === "lost" ? "needs_attention" : "followup",
    rooms_requested: rooms,
    rooms,
    nights,
    checkin_date: checkinDate,
    checkout_date: checkoutDate,
    dates: stayDates,
    estimated_revenue_inr: estimatedRevenue,
    revenue_value: estimatedRevenue,
    price_sensitive: priceSensitive,
    sensitivity_score: priceSensitive ? 58 + (index % 35) : 12 + (index % 18),
    repeat_caller_signal: index % 5 === 0 ? 1 : 0,
    call_count: 1 + (index % 4 === 0 ? 2 : index % 9 === 0 ? 3 : 0),
    was_booking_intent: booking ? 1 : 0,
    greeted_properly: missingGreeting ? 0 : 1,
    followed_call_format: weakFormat ? 0 : 1,
    repeated_info_flag: repeatedInfo ? 1 : 0,
    raw_lost_reason: outcome === "lost" ? LOSS_REASONS[index % LOSS_REASONS.length] : "not_lost",
    fd_gaps: fdGaps,
    asked_about_pricing: booking ? 1 : 0,
    asked_about_amenities: index % 2 === 0 ? 1 : 0,
    asked_about_offers: index % 3 === 0 ? 1 : 0,
    asked_about_availability: booking ? 1 : 0,
    asked_about_long_stay: booking && nights >= 5 ? 1 : 0,
    audio_filename: `${callUuid}.mp3`,
    cross_sell_outcome: booking && index % 3 !== 0 ? "cross_sell_offered" : "cross_sell_missed",
    cross_sell_property_offered:
      booking && index % 3 !== 0 ? (index % 2 === 0 ? "suite_upgrade" : "banquet_addon") : null,
    discount_strategy: priceSensitive ? "Offer bundled value before discount" : "No discount needed",
    suggested_action:
      outcome === "lost"
        ? "Reframe value, set urgency, ask for booking commitment"
        : outcome === "followup_needed"
        ? "Send personalized WhatsApp quote and schedule callback"
        : "Share payment link and lock confirmation",
    what_went_wrong:
      outcome === "won" ? "None" : outcome === "lost" ? "Weak objection handling and no assertive close" : "No concrete next step locked",
    negotiation_dialogue: "Rate pushback was not reframed with value stack.",
    segment_dialogue: `Segment cues: ${segment}`,
    call_transcript: transcriptBundle.full,
    transcript_text: transcriptBundle.full,
    all_transcripts: { original: transcriptBundle.original, english: transcriptBundle.english },
    decision_json: {
      what_went_wrong:
        outcome === "won"
          ? "None"
          : "Missed confidence-building and value articulation before close.",
      improvement_suggestions:
        "Confirm key needs, present value stack, and close with one explicit next step.",
    },
    availability_status: booking ? "available" : "n/a",
    confirmation_detected: outcome === "won",
    pipeline_issue_notes: "",
    manual_caller_name: "",
    manual_drive_link: "",
    call_duration_seconds: 95 + (index % 16) * 14,
    is_escalated: outcome === "lost" && estimatedRevenue > 65000 ? 1 : 0,
    followup_summary: outcome === "won" ? "Booking confirmed" : "Follow-up pending",
    confirmation_status: outcome === "won" ? "converted" : "pending",
    custom_followup_message: "",
  };
}

let ROWS: AnyRecord[] = Array.from({ length: 15 }, (_, index) => createRow(index));

let INGEST = {
  status: "success",
  is_syncing: false,
  total_processed: ROWS.length,
  auto_synced: Math.max(14, Math.floor(ROWS.length * 0.65)),
  manual_uploaded: Math.max(4, Math.floor(ROWS.length * 0.18)),
  last_auto_sync: new Date().toISOString(),
};

function rowsFromFilters(req: NextRequest): AnyRecord[] {
  const start = req.nextUrl.searchParams.get("start") || req.nextUrl.searchParams.get("start_date");
  const end = req.nextUrl.searchParams.get("end") || req.nextUrl.searchParams.get("end_date");
  const property = normalizeProperty(
    req.nextUrl.searchParams.get("property") || req.nextUrl.searchParams.get("folder_id")
  );

  return ROWS.filter((row) => {
    const rowDay = day(row.call_timestamp || row.created_at);
    if (start && rowDay < start) return false;
    if (end && rowDay > end) return false;
    if (property && row.property_called !== property) return false;
    return true;
  });
}

function previousRows(req: NextRequest, current: AnyRecord[]): AnyRecord[] {
  const start = req.nextUrl.searchParams.get("start") || req.nextUrl.searchParams.get("start_date");
  const end = req.nextUrl.searchParams.get("end") || req.nextUrl.searchParams.get("end_date");
  const property = normalizeProperty(
    req.nextUrl.searchParams.get("property") || req.nextUrl.searchParams.get("folder_id")
  );

  if (!start || !end) {
    const currentIds = new Set(current.map((row) => row.call_uuid));
    const fallback = ROWS.filter((row) => !currentIds.has(row.call_uuid)).slice(0, Math.max(12, Math.floor(current.length / 2)));
    return property ? fallback.filter((row) => row.property_called === property) : fallback;
  }

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const prevEnd = new Date(startDate.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);

  return ROWS.filter((row) => {
    const rowDate = new Date(`${day(row.call_timestamp)}T00:00:00Z`);
    if (rowDate < prevStart || rowDate > prevEnd) return false;
    if (property && row.property_called !== property) return false;
    return true;
  });
}

function computeCoreMetrics(rows: AnyRecord[]) {
  const booking = rows.filter((row) => row.was_booking_intent === 1);
  const won = booking.filter((row) => row.outcome === "won");
  const lost = booking.filter((row) => row.outcome === "lost");
  const pending = booking.filter((row) => row.outcome === "followup_needed");

  const avgDuration = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + safeNum(row.call_duration_seconds), 0) / rows.length)
    : 0;

  const revenue = won.reduce((sum, row) => sum + safeNum(row.estimated_revenue_inr), 0);
  const uniqueEnquirers = new Set(rows.map((row) => row.caller_phone)).size;
  const highIntent = booking.filter((row) => safeNum(row.intent_score) >= 80).length;
  const repeatRows = rows.filter((row) => safeNum(row.call_count) > 1);
  const followupPending = rows.filter((row) => row.needs_followup === 1 && row.followup_sent === 0).length;

  const qualityScore = rows.length
    ? Math.round(
        rows.reduce((sum, row) => {
          const greeted = row.greeted_properly ? 20 : 0;
          const format = row.followed_call_format ? 50 : 0;
          const nonRepeat = row.repeated_info_flag === 0 ? 30 : 0;
          return sum + greeted + format + nonRepeat;
        }, 0) / rows.length
      )
    : 0;

  const missedCallRate = Number(((lost.length / Math.max(1, booking.length)) * 100).toFixed(1));

  return {
    totalCalls: rows.length,
    bookingCalls: booking.length,
    won: won.length,
    lost: lost.length,
    pending: pending.length,
    conversionRate: Number(((won.length / Math.max(1, booking.length)) * 100).toFixed(1)),
    avgDuration,
    revenue,
    totalEnquiries: booking.length,
    uniqueEnquirers,
    highIntent,
    qualityScore,
    missedCallRate,
    repeatCount: repeatRows.length,
    repeatRate: Number(((repeatRows.length / Math.max(1, rows.length)) * 100).toFixed(1)),
    followupPending,
  };
}

function comparison(current: AnyRecord[], previous: AnyRecord[]) {
  const cur = computeCoreMetrics(current);
  const prev = computeCoreMetrics(previous);

  const pctDelta = (a: number, b: number) => ({
    delta_pct: Math.abs(b === 0 ? (a > 0 ? 100 : 0) : Number((((a - b) / b) * 100).toFixed(1))),
    direction: a - b >= 0 ? "up" : "down",
  });

  const absDelta = (a: number, b: number) => ({
    delta_abs: Math.abs(a - b),
    direction: a - b >= 0 ? "up" : "down",
  });

  const secDelta = (a: number, b: number) => ({
    delta_seconds: Math.abs(a - b),
    direction: a - b >= 0 ? "up" : "down",
  });

  return {
    is_single_day: false,
    total_calls: absDelta(cur.totalCalls, prev.totalCalls),
    bookings_won: absDelta(cur.won, prev.won),
    bookings_lost: absDelta(cur.lost, prev.lost),
    conversion_rate: pctDelta(cur.conversionRate, prev.conversionRate),
    avg_duration_seconds: secDelta(cur.avgDuration, prev.avgDuration),
    revenue: pctDelta(cur.revenue, prev.revenue),
    total_enquiries: absDelta(cur.totalEnquiries, prev.totalEnquiries),
    unique_enquirers: absDelta(cur.uniqueEnquirers, prev.uniqueEnquirers),
    high_intent_count: absDelta(cur.highIntent, prev.highIntent),
    quality_score: absDelta(cur.qualityScore, prev.qualityScore),
    missed_call_rate: pctDelta(cur.missedCallRate, prev.missedCallRate),
    repeat_callers: absDelta(cur.repeatCount, prev.repeatCount),
    followup_pending: absDelta(cur.followupPending, prev.followupPending),
  };
}

function dateSeries(rows: AnyRecord[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const date = day(row.call_timestamp || row.created_at);
    map.set(date, (map.get(date) || 0) + 1);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function gapCount(rows: AnyRecord[]) {
  const gaps: Record<GapKey, number> & { total_calls: number } = {
    process_intake: 0,
    inventory: 0,
    financial: 0,
    sales: 0,
    diversion: 0,
    closing: 0,
    other: 0,
    total_calls: rows.length,
  };

  rows.forEach((row) => {
    const list = Array.isArray(row.fd_gaps) ? (row.fd_gaps as string[]) : [];
    list.forEach((gap) => {
      if (gap in gaps) {
        gaps[gap as GapKey] += 1;
      } else {
        gaps.other += 1;
      }
    });
  });

  return gaps;
}

function filterByOutcome(rows: AnyRecord[], outcome: string | null): AnyRecord[] {
  if (!outcome || outcome === "all") return rows;
  if (outcome === "first_time") return rows.filter((row) => safeNum(row.call_count, 1) <= 1);
  if (outcome === "revisiting") return rows.filter((row) => safeNum(row.call_count, 1) > 1);
  if (outcome === "high_intent") return rows.filter((row) => safeNum(row.intent_score) >= 80);
  if (outcome === "revenue_influenced") return rows.filter((row) => row.outcome === "won");
  if (outcome === "cross_sell_offered" || outcome === "cross_sell_missed") {
    return rows.filter((row) => row.cross_sell_outcome === outcome);
  }
  if (outcome === "unique_enquirers") {
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.caller_phone)) return false;
      seen.add(row.caller_phone);
      return true;
    });
  }
  if (outcome === "total_calls") return rows;
  return rows.filter((row) => row.outcome === outcome || row.cross_sell_outcome === outcome);
}

function toHistoryRow(row: AnyRecord): AnyRecord {
  return {
    ...row,
    fd_gaps: Array.isArray(row.fd_gaps) ? JSON.stringify(row.fd_gaps) : row.fd_gaps,
    transcript_text: row.transcript_text || row.call_transcript,
  };
}

function toCoachRow(row: AnyRecord): AnyRecord {
  let gaps: string[] = [];

  if (Array.isArray(row.fd_gaps)) {
    gaps = row.fd_gaps;
  } else if (typeof row.fd_gaps === "string") {
    try {
      const parsed = JSON.parse(row.fd_gaps);
      if (Array.isArray(parsed)) {
        gaps = parsed;
      }
    } catch {
      gaps = [];
    }
  }

  return {
    ...row,
    fd_gaps: gaps,
    transcript_text: row.transcript_text || row.call_transcript,
  };
}

function mapLead(row: AnyRecord): AnyRecord {
  return {
    s_no: row.s_no,
    name: row.caller_name,
    phone: row.caller_phone,
    rooms: row.rooms_requested,
    dates: row.dates,
    followup_summary: row.followup_summary,
    confirmation_status: row.confirmation_status,
    inquiry_type: row.inquiry_type,
    followup_stage: row.followup_stage,
    is_escalated: row.is_escalated,
    revenue_value: row.revenue_value,
    call_date: row.call_date,
    created_at_iso: row.created_at,
    custom_followup_message: row.custom_followup_message,
    call_transcript: row.call_transcript,
  };
}

function buildGuestRequests(rows: AnyRecord[]) {
  const stats = {
    asked_about_availability: rows.filter((row) => row.asked_about_availability === 1).length,
    asked_about_pricing: rows.filter((row) => row.asked_about_pricing === 1).length,
    asked_about_amenities: rows.filter((row) => row.asked_about_amenities === 1).length,
    asked_about_long_stay: rows.filter((row) => row.asked_about_long_stay === 1).length,
    asked_about_offers: rows.filter((row) => row.asked_about_offers === 1).length,
  };

  const pct: Record<string, { count: number; percentage: number }> = {};
  Object.entries(stats).forEach(([key, count]) => {
    pct[key] = {
      count,
      percentage: Number(((count / Math.max(1, rows.length)) * 100).toFixed(1)),
    };
  });
  return pct;
}

function buildLostReasons(rows: AnyRecord[]) {
  const lostRows = rows.filter((row) => row.outcome === "lost");
  const map: Record<string, { count: number; percentage: number }> = {};

  lostRows.forEach((row) => {
    const reason = row.raw_lost_reason || "unknown";
    if (!map[reason]) map[reason] = { count: 0, percentage: 0 };
    map[reason].count += 1;
  });

  Object.keys(map).forEach((reason) => {
    map[reason].percentage = Number(((map[reason].count / Math.max(1, lostRows.length)) * 100).toFixed(1));
  });

  return map;
}

function buildBehaviorAudit(rows: AnyRecord[]) {
  const grouped = new Map<string, AnyRecord[]>();
  rows.forEach((row) => {
    grouped.set(row.property_called, [...(grouped.get(row.property_called) || []), row]);
  });

  return Array.from(grouped.entries()).map(([property, list]) => {
    const totalCalls = list.length;
    const greetingRate = totalCalls
      ? Math.round((list.filter((row) => row.greeted_properly === 1).length / totalCalls) * 100)
      : 0;
    const formatRate = totalCalls
      ? Math.round((list.filter((row) => row.followed_call_format === 1).length / totalCalls) * 100)
      : 0;
    const listeningRate = totalCalls
      ? Math.round((list.filter((row) => row.repeated_info_flag === 0).length / totalCalls) * 100)
      : 0;

    const segments: Record<string, AnyRecord> = {};
    list.forEach((row) => {
      const segment = row.enquirer_segment || "other";
      if (!segments[segment]) segments[segment] = { total: 0, won: 0, conversion_rate: 0 };
      segments[segment].total += 1;
      if (row.outcome === "won") segments[segment].won += 1;
    });

    Object.keys(segments).forEach((segment) => {
      const payload = segments[segment];
      payload.conversion_rate = payload.total ? Math.round((payload.won / payload.total) * 100) : 0;
    });

    const priceSensitiveRows = list.filter((row) => row.price_sensitive === 1);

    return {
      property,
      total_calls: totalCalls,
      greeting_rate: greetingRate,
      format_rate: formatRate,
      listening_rate: listeningRate,
      compliance_score: Math.round(greetingRate * 0.2 + formatRate * 0.5 + listeningRate * 0.3),
      avg_sensitivity: priceSensitiveRows.length
        ? Math.round(
            priceSensitiveRows.reduce((sum, row) => sum + safeNum(row.sensitivity_score), 0) /
              priceSensitiveRows.length
          )
        : 0,
      price_sensitive_calls: priceSensitiveRows.length,
      price_conversion_rate: priceSensitiveRows.length
        ? Math.round((priceSensitiveRows.filter((row) => row.outcome === "won").length / priceSensitiveRows.length) * 100)
        : 0,
      segments,
      calls: list.slice(0, 40).map((row) => ({
        ...row,
        transcript_text: row.transcript_text || row.call_transcript,
        reasoning:
          row.outcome === "won"
            ? "Strong greeting, need discovery, and close."
            : "Opportunity missed in objection handling and commitment close.",
      })),
    };
  });
}

function buildTimelineInsights(rows: AnyRecord[]) {
  const grouped = new Map<string, AnyRecord[]>();
  rows.forEach((row) => {
    const date = day(row.call_timestamp || row.created_at);
    grouped.set(date, [...(grouped.get(date) || []), row]);
  });

  const timeline = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows]) => {
      const booking = dayRows.filter((row) => row.was_booking_intent === 1);
      const won = booking.filter((row) => row.outcome === "won").length;
      const gaps = gapCount(dayRows);

      return {
        date,
        total_calls: dayRows.length,
        conversion_rate: Number(((won / Math.max(1, booking.length)) * 100).toFixed(1)),
        process_intake: gaps.process_intake,
        inventory: gaps.inventory,
        financial: gaps.financial,
        sales: gaps.sales,
        diversion: gaps.diversion,
        closing: gaps.closing,
        other: gaps.other,
      };
    });

  const sortedByGaps = [...timeline].sort((a, b) => {
    const totalA = a.process_intake + a.inventory + a.financial + a.sales + a.diversion + a.closing + a.other;
    const totalB = b.process_intake + b.inventory + b.financial + b.sales + b.diversion + b.closing + b.other;
    return totalB - totalA;
  });

  const anomalies = sortedByGaps.slice(0, 3).map((row) => {
    const biggest = [
      { key: "process intake", value: row.process_intake },
      { key: "inventory", value: row.inventory },
      { key: "financial", value: row.financial },
      { key: "sales", value: row.sales },
      { key: "diversion", value: row.diversion },
      { key: "closing", value: row.closing },
    ].sort((a, b) => b.value - a.value)[0];
    return `${row.date}: spike in ${biggest.key} gaps (${biggest.value}).`;
  });

  const summary = {
    narrative:
      "Daily coaching trends show strong enquiry volume with conversion pressure on price-sensitive calls. Closing discipline and objection handling are the biggest unlocks for incremental revenue.",
    anomalies,
  };

  return { timeline, summary };
}

function buildChatAnswer(message: string): string {
  const text = message.toLowerCase();
  const bookingRows = ROWS.filter((row) => row.was_booking_intent === 1);
  const won = bookingRows.filter((row) => row.outcome === "won").length;
  const lost = bookingRows.filter((row) => row.outcome === "lost").length;
  const pending = bookingRows.filter((row) => row.outcome === "followup_needed").length;
  const revenue = ROWS.filter((row) => row.outcome === "won").reduce(
    (sum, row) => sum + safeNum(row.estimated_revenue_inr),
    0
  );

  if (text.includes("lost") || text.includes("leak")) {
    const topLost = bookingRows
      .filter((row) => row.outcome === "lost")
      .sort((a, b) => safeNum(b.estimated_revenue_inr) - safeNum(a.estimated_revenue_inr))
      .slice(0, 5)
      .map(
        (row) =>
          `- ${row.caller_name} (${PROPERTY_LABELS[row.property_called] || row.property_called}) | INR ${safeNum(
            row.estimated_revenue_inr
          ).toLocaleString("en-IN")} | ${row.raw_lost_reason}`
      )
      .join("\n");

    return `## Revenue Leak Snapshot\n- Lost booking calls: **${lost}**\n- Estimated leak value: **INR ${bookingRows
      .filter((row) => row.outcome === "lost")
      .reduce((sum, row) => sum + safeNum(row.estimated_revenue_inr), 0)
      .toLocaleString("en-IN")}**\n\n### Highest-Value Lost Leads\n${topLost || "- No lost leads found"}`;
  }

  if (text.includes("high intent") || text.includes("priority") || text.includes("follow")) {
    const highIntentRows = bookingRows
      .filter((row) => safeNum(row.intent_score) >= 80)
      .sort((a, b) => safeNum(b.intent_score) - safeNum(a.intent_score))
      .slice(0, 6);

    const pendingFollowups = highIntentRows.filter((row) => !safeNum(row.followup_sent)).length;

    const queue = highIntentRows
      .map(
        (row) =>
          `- ${row.caller_name} | ${row.intent_score}/100 | ${row.outcome} | ${row.followup_sent ? "follow-up sent" : "follow-up pending"}`
      )
      .join("\n");

    return `## High-Intent Lead Queue\n- Pending follow-ups: **${pendingFollowups}**\n${queue}`;
  }

  return `## Nexrova Live Intelligence\n- Total audited booking calls: **${bookingRows.length}**\n- Won: **${won}** | Lost: **${lost}** | Follow-up needed: **${pending}**\n- Conversion rate: **${Number(((won / Math.max(1, bookingRows.length)) * 100).toFixed(1))}%**\n- Revenue influenced: **INR ${revenue.toLocaleString("en-IN")}**`;
}

function buildCeoResponse(req: NextRequest, rows: AnyRecord[]): AnyRecord {
  const metrics = computeCoreMetrics(rows);
  const previous = previousRows(req, rows);
  const comp = comparison(rows, previous);

  const bookingRows = rows.filter((row) => row.was_booking_intent === 1);
  const lostReasons = buildLostReasons(rows);
  const guestRequests = buildGuestRequests(rows);

  const segmentMap: Record<string, AnyRecord> = {};
  rows.forEach((row) => {
    const segment = row.enquirer_segment || "other";
    if (!segmentMap[segment]) {
      segmentMap[segment] = { count: 0, won_count: 0, pct_of_total: 0, conversion_rate_pct: 0 };
    }
    segmentMap[segment].count += 1;
    if (row.outcome === "won") segmentMap[segment].won_count += 1;
  });

  Object.keys(segmentMap).forEach((segment) => {
    const payload = segmentMap[segment];
    payload.pct_of_total = Number(((payload.count / Math.max(1, rows.length)) * 100).toFixed(1));
    payload.conversion_rate_pct = Number(((payload.won_count / Math.max(1, payload.count)) * 100).toFixed(1));
  });

  const stayDistribution: Record<string, { count: number; pct: number }> = {
    days_1_to_3: { count: 0, pct: 0 },
    days_4_to_7: { count: 0, pct: 0 },
    days_8_to_15: { count: 0, pct: 0 },
    days_16_to_29: { count: 0, pct: 0 },
    days_30_to_59: { count: 0, pct: 0 },
    days_60_to_89: { count: 0, pct: 0 },
    days_90_to_179: { count: 0, pct: 0 },
    days_180_plus: { count: 0, pct: 0 },
  };

  bookingRows.forEach((row) => {
    const nights = safeNum(row.nights);
    if (nights <= 3) stayDistribution.days_1_to_3.count += 1;
    else if (nights <= 7) stayDistribution.days_4_to_7.count += 1;
    else if (nights <= 15) stayDistribution.days_8_to_15.count += 1;
    else if (nights <= 29) stayDistribution.days_16_to_29.count += 1;
    else if (nights <= 59) stayDistribution.days_30_to_59.count += 1;
    else if (nights <= 89) stayDistribution.days_60_to_89.count += 1;
    else if (nights <= 179) stayDistribution.days_90_to_179.count += 1;
    else stayDistribution.days_180_plus.count += 1;
  });

  Object.values(stayDistribution).forEach((item) => {
    item.pct = Number(((item.count / Math.max(1, bookingRows.length)) * 100).toFixed(1));
  });

  const slotCalls: Record<string, number> = {};
  const slotWon: Record<string, number> = {};
  rows.forEach((row) => {
    const slot = hourBucket(row.call_timestamp || row.created_at);
    slotCalls[slot] = (slotCalls[slot] || 0) + 1;
    if (row.outcome === "won") slotWon[slot] = (slotWon[slot] || 0) + 1;
  });

  const slotConversion: Record<string, number> = {};
  Object.keys(slotCalls).forEach((slot) => {
    slotConversion[slot] = Number(((safeNum(slotWon[slot]) / Math.max(1, slotCalls[slot])) * 100).toFixed(1));
  });

  const gaps = gapCount(rows);
  const topGaps = Object.entries(gaps)
    .filter(([key]) => key !== "total_calls")
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5)
    .map(([gap, count]) => ({ gap, count }));

  const peakSlot = Object.entries(slotCalls).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || null;
  const topLossReason = Object.entries(lostReasons).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || null;

  return {
    start_date: req.nextUrl.searchParams.get("start") || req.nextUrl.searchParams.get("start_date") || null,
    end_date: req.nextUrl.searchParams.get("end") || req.nextUrl.searchParams.get("end_date") || null,
    funnel: {
      total_calls: metrics.totalCalls,
      won: metrics.won,
      lost: metrics.lost,
      pending: metrics.pending,
      conversion_rate_pct: metrics.conversionRate,
    },
    guest_requests_pct: guestRequests,
    enquirer_segments: segmentMap,
    stay_duration_distribution: stayDistribution,
    lost_reasons: lostReasons,
    time_slot_calls: slotCalls,
    time_slot_conversion: slotConversion,
    over_time_trend: dateSeries(rows),
    cross_sell: {
      eligible_calls: bookingRows.length,
      offered_count: bookingRows.filter((row) => row.cross_sell_outcome === "cross_sell_offered").length,
      pct_offered: bookingRows.length
        ? Number(
            (
              (bookingRows.filter((row) => row.cross_sell_outcome === "cross_sell_offered").length /
                bookingRows.length) *
              100
            ).toFixed(1)
          )
        : 0,
    },
    revenue: { estimated_revenue_inr: metrics.revenue, won_calls_total: metrics.won },
    brief: {
      peak_call_hour_slot: peakSlot,
      top_lost_reason: topLossReason,
      avg_call_duration_seconds: metrics.avgDuration,
      repeat_caller_rate: { count: metrics.repeatCount, pct_of_total: metrics.repeatRate },
      missed_call_rate: {
        count: rows.filter((row) => row.outcome === "lost").length,
        pct_of_total: metrics.missedCallRate,
      },
      needs_review_count: rows.filter((row) => safeNum(row.total_score) < 55).length,
      followup_pending: {
        count: metrics.followupPending,
        pct_of_total: Number(((metrics.followupPending / Math.max(1, rows.length)) * 100).toFixed(1)),
      },
      booking_funnel: { total_calls: metrics.bookingCalls, conversion_rate_pct: metrics.conversionRate },
      revenue_influenced: { estimated_revenue_inr: metrics.revenue },
      avg_stay_duration_nights: bookingRows.length
        ? Number(
            (
              bookingRows.reduce((sum, row) => sum + safeNum(row.nights), 0) / Math.max(1, bookingRows.length)
            ).toFixed(1)
          )
        : 0,
      fd_gaps: topGaps,
    },
    insights: [
      "Prime booking intent appears strongest in late morning and early evening slots.",
      "High-intent lost calls mostly fail on price framing and commitment closing.",
      "Follow-up performance improves materially when callbacks happen within 2 hours.",
    ],
    executive_alerts: [
      {
        title: "Revenue Leakage",
        description: "Closing gaps are suppressing conversion in high-value calls.",
        type: "leakage",
        level: "high",
      },
      {
        title: "Lead Recovery",
        description: "A-tier follow-up backlog is recoverable with same-day callbacks.",
        type: "followup",
        level: "medium",
      },
    ],
    repeat_caller_rate: { count: metrics.repeatCount, pct_of_total: metrics.repeatRate },
    repeat_callers_detail: rows
      .filter((row) => safeNum(row.call_count) > 1)
      .slice(0, 12)
      .map((row) => ({ caller_phone: row.caller_phone, caller_name: row.caller_name, call_count: row.call_count })),
    comparison: comp,
  };
}

function buildDailyResponse(req: NextRequest, rows: AnyRecord[]): AnyRecord {
  const metrics = computeCoreMetrics(rows);
  const previous = previousRows(req, rows);
  const comp = comparison(rows, previous);

  const booking = rows.filter((row) => row.was_booking_intent === 1);
  const won = booking.filter((row) => row.outcome === "won");

  const byOutcome = {
    confirmed: rows.filter((row) => row.outcome === "won").length,
    lost_booking: rows.filter((row) => row.outcome === "lost").length,
    followup_needed: rows.filter((row) => row.outcome === "followup_needed").length,
    general_enquiry: rows.filter((row) => row.outcome === "general_enquiry").length,
    service_calls: rows.filter((row) => row.call_type === "service").length,
    total: rows.length,
  };

  const outcomeBreakdown: Record<string, { count: number; pct: number }> = {};
  Object.entries(byOutcome).forEach(([key, count]) => {
    outcomeBreakdown[key] = { count, pct: Number(((count / Math.max(1, rows.length)) * 100).toFixed(1)) };
  });

  const hourlyMap = new Map<string, AnyRecord[]>();
  rows.forEach((row) => {
    const slot = hourBucket(row.call_timestamp || row.created_at);
    hourlyMap.set(slot, [...(hourlyMap.get(slot) || []), row]);
  });

  const hourlyCounts = Array.from(hourlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, list]) => ({ hour, count: list.length }));

  const hourlyRates = Array.from(hourlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, list]) => {
      const bookingList = list.filter((row) => row.was_booking_intent === 1);
      const wonCount = bookingList.filter((row) => row.outcome === "won").length;
      return {
        hour,
        conversion_rate_pct: Number(((wonCount / Math.max(1, bookingList.length)) * 100).toFixed(1)),
      };
    });

  const peakHourEntry = [...hourlyCounts].sort((a, b) => b.count - a.count)[0] || {
    hour: "00:00-01:00",
    count: 0,
  };

  const dailySeries = dateSeries(rows);
  const trendConversion = dailySeries.map(({ date }) => {
    const dayRows = rows.filter((row) => day(row.call_timestamp || row.created_at) === date);
    const dayBooking = dayRows.filter((row) => row.was_booking_intent === 1);
    const dayWon = dayBooking.filter((row) => row.outcome === "won").length;
    return {
      date,
      conversion_rate_pct: Number(((dayWon / Math.max(1, dayBooking.length)) * 100).toFixed(1)),
    };
  });

  const pendingFollowups = rows
    .filter((row) => row.needs_followup === 1 && row.followup_sent === 0)
    .sort((a, b) => safeNum(b.intent_score) - safeNum(a.intent_score))
    .slice(0, 18)
    .map((row) => ({
      call_id: row.call_uuid,
      guest_name: row.caller_name,
      guest_phone: row.caller_phone,
      intent_score: row.intent_score,
      call_timestamp: row.call_timestamp,
    }));

  const completedFollowups = rows
    .filter((row) => row.followup_sent === 1)
    .sort((a, b) => String(b.call_timestamp).localeCompare(String(a.call_timestamp)))
    .slice(0, 18)
    .map((row) => ({
      call_id: row.call_uuid,
      guest_name: row.caller_name,
      guest_phone: row.caller_phone,
      intent_score: row.intent_score,
      call_timestamp: row.call_timestamp,
    }));

  const lostReasons = buildLostReasons(rows);
  const guestRequests = buildGuestRequests(rows);

  const gapSummary = Object.entries(gapCount(rows))
    .filter(([key]) => key !== "total_calls")
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6)
    .map(([gap, count]) => ({ gap, count }));

  const recoverable = rows
    .filter((row) => row.outcome === "lost" && safeNum(row.intent_score) >= 70)
    .slice(0, 10)
    .map((row) => ({
      caller_phone: row.caller_phone,
      caller_name: row.caller_name,
      call_timestamp: row.call_timestamp,
      recovery_reason: row.what_went_wrong,
      raw_lost_reason: row.raw_lost_reason,
      gdrive_folder_id: row.gdrive_folder_id,
      audio_filename: row.audio_filename,
      call_uuid: row.call_uuid,
    }));

  return {
    start_date: req.nextUrl.searchParams.get("start") || req.nextUrl.searchParams.get("start_date") || null,
    end_date: req.nextUrl.searchParams.get("end") || req.nextUrl.searchParams.get("end_date") || null,
    selected_date:
      req.nextUrl.searchParams.get("start") ||
      req.nextUrl.searchParams.get("start_date") ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
    summary: {
      total_calls: rows.length,
      bookings_won: won.length,
      conversion_rate_pct: metrics.conversionRate,
      avg_call_duration_seconds: metrics.avgDuration,
      followups_assigned: pendingFollowups.length,
      followups_completed: completedFollowups.length,
    },
    glance: {
      peak_call_hour: peakHourEntry.hour,
      avg_call_duration: `${metrics.avgDuration}s`,
      first_call_time: rows[rows.length - 1]?.call_timestamp || "N/A",
      last_call_time: rows[0]?.call_timestamp || "N/A",
      pending_followups_count: pendingFollowups.length,
    },
    outcome_breakdown: outcomeBreakdown,
    hourly_calls: {
      hourly_counts: hourlyCounts,
      peak_hour: peakHourEntry.hour,
      peak_count: peakHourEntry.count,
    },
    hourly_conversion: { hourly_rates: hourlyRates },
    insights: [
      `Calls audited: ${rows.length}. Peak activity in ${peakHourEntry.hour}.`,
      `Conversion currently at ${metrics.conversionRate}% with ${pendingFollowups.length} follow-up opportunities open.`,
      "Lost bookings are concentrated in pricing objections and soft closing.",
    ],
    coaching_tip:
      "Coach agents to confirm intent, frame value before discounting, and end every call with one explicit next step.",
    pending_followups: pendingFollowups,
    completed_followups: completedFollowups,
    trend_conversion: { daily_rates: trendConversion },
    trend_enquiries: dailySeries.map(({ date, count }) => ({ date, count })),
    comparison: comp,
    guest_requests_pct: guestRequests,
    lost_reasons: lostReasons,
    fd_gaps: gapSummary,
    repeat_caller_rate: { count: metrics.repeatCount, pct_of_total: metrics.repeatRate },
    repeat_callers_detail: rows
      .filter((row) => safeNum(row.call_count) > 1)
      .slice(0, 10)
      .map((row) => ({ caller_phone: row.caller_phone, caller_name: row.caller_name, call_count: row.call_count })),
    recoverable_leads: recoverable,
  };
}

function buildEnquiriesResponse(req: NextRequest, rows: AnyRecord[]): AnyRecord {
  const metrics = computeCoreMetrics(rows);
  const previous = previousRows(req, rows);
  const comp = comparison(rows, previous);

  const booking = rows.filter((row) => row.was_booking_intent === 1);
  const repeatByPhone = rows.filter((row) => safeNum(row.call_count) > 1).length;
  const repeatByTranscript = rows.filter((row) => row.repeat_caller_signal === 1).length;

  const firstTime = rows.filter((row) => safeNum(row.call_count, 1) <= 1).length;
  const revisiting = rows.length - firstTime;

  const intentSignals = {
    asked_about_availability: Number(
      ((rows.filter((row) => row.asked_about_availability === 1).length / Math.max(1, rows.length)) * 100).toFixed(1)
    ),
    asked_about_pricing: Number(
      ((rows.filter((row) => row.asked_about_pricing === 1).length / Math.max(1, rows.length)) * 100).toFixed(1)
    ),
    asked_about_amenities: Number(
      ((rows.filter((row) => row.asked_about_amenities === 1).length / Math.max(1, rows.length)) * 100).toFixed(1)
    ),
    asked_about_long_stay: Number(
      ((rows.filter((row) => row.asked_about_long_stay === 1).length / Math.max(1, rows.length)) * 100).toFixed(1)
    ),
    asked_about_offers: Number(
      ((rows.filter((row) => row.asked_about_offers === 1).length / Math.max(1, rows.length)) * 100).toFixed(1)
    ),
  };

  const high = booking.filter((row) => safeNum(row.intent_score) >= 80).length;
  const medium = booking.filter((row) => safeNum(row.intent_score) >= 50 && safeNum(row.intent_score) < 80).length;
  const low = booking.filter((row) => safeNum(row.intent_score) < 50).length;

  const segmentsMap = new Map<string, number>();
  rows.forEach((row) => {
    const segment = row.enquirer_segment || "other";
    segmentsMap.set(segment, (segmentsMap.get(segment) || 0) + 1);
  });

  const enquirerSegmentDistribution = Array.from(segmentsMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      pct: Number(((count / Math.max(1, rows.length)) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const recentInteractions = [...rows]
    .sort((a, b) => String(b.call_timestamp).localeCompare(String(a.call_timestamp)))
    .slice(0, 25)
    .map((row) => ({
      call_id: row.call_uuid,
      guest_name: row.caller_name,
      guest_phone: row.caller_phone,
      call_timestamp: row.call_timestamp,
      intent_score: row.intent_score,
      enquirer_type: safeNum(row.call_count) > 1 ? "revisiting" : "first_time",
      next_action: row.followup_action,
      call_count: row.call_count,
      is_repeat: safeNum(row.call_count) > 1 ? 1 : 0,
      outcome: row.outcome,
    }));

  const highIntent = booking
    .filter((row) => safeNum(row.intent_score) >= 80)
    .sort((a, b) => safeNum(b.intent_score) - safeNum(a.intent_score))
    .slice(0, 20)
    .map((row) => ({
      call_id: row.call_uuid,
      guest_name: row.caller_name,
      guest_phone: row.caller_phone,
      intent_score: row.intent_score,
      enquirer_segment: row.enquirer_segment,
      outcome: row.outcome,
    }));

  const trend = dateSeries(rows).map(({ date, count }) => ({ date, enquiries: count }));

  return {
    start_date: req.nextUrl.searchParams.get("start") || req.nextUrl.searchParams.get("start_date") || null,
    end_date: req.nextUrl.searchParams.get("end") || req.nextUrl.searchParams.get("end_date") || null,
    total_enquiries: booking.length,
    conversion_rate: metrics.conversionRate,
    unique_vs_repeat: {
      repeat_by_phone_match: repeatByPhone,
      repeat_by_transcript_signal: repeatByTranscript,
      total_enquiries: booking.length,
    },
    enquirer_type_distribution: {
      first_time_enquirers: {
        count: firstTime,
        pct: Number(((firstTime / Math.max(1, rows.length)) * 100).toFixed(1)),
      },
      revisiting_enquirers: {
        count: revisiting,
        pct: Number(((revisiting / Math.max(1, rows.length)) * 100).toFixed(1)),
      },
    },
    top_intent_signals_pct: intentSignals,
    key_insights: [
      "Repeat callers show higher conversion when callback happens within 2 hours.",
      "Corporate and wedding segments produce the highest average booking value.",
      "High-intent callers are dropping mostly on pricing confidence and close quality.",
    ],
    high_intent_enquiries: highIntent,
    recent_enquirer_interactions: recentInteractions,
    all_enquirer_interactions: recentInteractions,
    intent_score_distribution: {
      high: { count: high },
      medium: { count: medium },
      low: { count: low },
    },
    enquirer_segment_distribution: enquirerSegmentDistribution,
    avg_stay_duration_nights: booking.length
      ? Number((booking.reduce((sum, row) => sum + safeNum(row.nights), 0) / booking.length).toFixed(1))
      : 0,
    trend_enquiries: trend,
    comparison: comp,
  };
}

function sseResponse(events: AnyRecord[]): NextResponse {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      events.forEach((event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function insightPayload(rows: AnyRecord[]) {
  const metrics = computeCoreMetrics(rows);
  return {
    insights: [
      `Conversion is at ${metrics.conversionRate}% with ${metrics.won} wins.`,
      `${metrics.followupPending} high-value opportunities still need follow-up closure.`,
      "Top leakage pattern: price resistance + weak close in corporate and wedding segments.",
    ],
    executive_alerts: [
      {
        title: "Leakage Spike",
        description: "Financial + closing gaps increased on evening shift calls.",
        type: "leakage",
        level: "high",
      },
      {
        title: "Follow-up SLA",
        description: "Several A-tier leads are pending beyond ideal callback window.",
        type: "followup",
        level: "medium",
      },
      {
        title: "Opportunity",
        description: "Cross-sell offered rate improved in Gandhi property.",
        type: "opportunity",
        level: "low",
      },
    ],
  };
}

async function routeHandler(req: NextRequest, method: string): Promise<NextResponse> {
  const parts = parsePath(req);
  const [a, b, c, d] = parts;

  if (!a) return json({ status: "ok" });
  if (method === "OPTIONS") return new NextResponse(null, { status: 204 });

  if (a === "auth" && b === "login" && method === "POST") {
    const payload = await readBody<{ email?: string }>(req);
    const email = payload.email || "demo@oasis.local";
    const tenant = email.includes("demo") ? "demo" : "kolam";

    const res = json({ status: "success", tenant, user: { email } });
    res.cookies.set("auth_token", "mock_token", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    res.cookies.set("tenant", tenant, { sameSite: "lax", path: "/" });
    return res;
  }

  if (a === "auth" && b === "logout" && method === "POST") {
    const res = json({ status: "success" });
    res.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return res;
  }

  if (a === "sync" && (method === "POST" || method === "GET")) {
    INGEST.last_auto_sync = new Date().toISOString();
    return json({ status: "success", message: "Sync started" });
  }

  if (a === "settings") {
    if (!b && method === "GET") return json({ status: "success", settings: SETTINGS });

    if (!b && (method === "PATCH" || method === "POST")) {
      const payload = await readBody<AnyRecord>(req);
      SETTINGS = { ...SETTINGS, ...payload };
      return json({ status: "success", settings: SETTINGS, message: "Settings updated" });
    }

    if (b === "images" && !c && method === "GET") {
      return json({ status: "success", images: IMAGES, folders: FOLDERS });
    }

    if (b === "images" && c && method === "DELETE") {
      const filename = parts.slice(2).join("/");
      IMAGES = IMAGES.filter((item) => item !== filename);
      SETTINGS.booking_images = (SETTINGS.booking_images || []).filter((item: string) => item !== filename);
      return json({ status: "success", message: "Image deleted" });
    }

    if (b === "folders" && !c && method === "POST") {
      const payload = await readBody<{ name?: string }>(req);
      const name = (payload.name || "").trim();
      if (!name) return json({ status: "error", message: "Folder name required" }, 400);
      if (!FOLDERS.includes(name)) FOLDERS.push(name);
      return json({ status: "success", folders: FOLDERS, message: "Folder created" });
    }

    if (b === "folders" && c && method === "DELETE") {
      FOLDERS = FOLDERS.filter((folder) => folder !== c);
      IMAGES = IMAGES.filter((image) => !image.startsWith(`${c}/`));
      SETTINGS.booking_images = (SETTINGS.booking_images || []).filter(
        (image: string) => !image.startsWith(`${c}/`)
      );
      return json({ status: "success", folders: FOLDERS, message: "Folder deleted" });
    }
  }

  if (a === "contacts") {
    if (!b && method === "GET") {
      const page = Math.max(1, safeNum(req.nextUrl.searchParams.get("page"), 1));
      const limit = Math.max(1, safeNum(req.nextUrl.searchParams.get("limit"), 10));
      const search = (req.nextUrl.searchParams.get("search") || "").toLowerCase().trim();

      const filtered = search
        ? CONTACTS.filter(
            (contact) =>
              String(contact.full_name).toLowerCase().includes(search) ||
              String(contact.phone).toLowerCase().includes(search)
          )
        : CONTACTS;

      const start = (page - 1) * limit;
      return json({ status: "success", contacts: filtered.slice(start, start + limit), total: filtered.length });
    }

    if (b === "upload" && method === "POST") {
      const add = Array.from({ length: 14 }, (_, i) => ({
        id: CONTACTS.length + i + 1,
        full_name: `Imported Guest ${CONTACTS.length + i + 1}`,
        phone: `+91 90090 ${String(40000 + i).padStart(5, "0")}`,
      }));
      CONTACTS = [...add, ...CONTACTS];
      return json({ status: "success", message: `Uploaded ${add.length} contacts successfully.` });
    }
  }

  if (a === "knowledge") {
    if (!b && method === "GET") {
      return json({ status: "success", content: KB.get("knowledge.txt") || "" });
    }

    if (!b && (method === "POST" || method === "PATCH")) {
      const payload = await readBody<{ content?: string }>(req);
      KB.set("knowledge.txt", payload.content || "");
      return json({ status: "success", message: "Knowledge updated" });
    }

    if (b === "files" && !c && method === "GET") {
      return json({ status: "success", files: Array.from(KB.keys()) });
    }

    if (b === "files" && c === "images" && method === "GET") {
      const filename = parts.slice(3).join("/") || "hotel";
      return NextResponse.redirect(`https://picsum.photos/seed/${encodeURIComponent(filename)}/1280/720`);
    }

    if (b === "files" && c === "images" && method === "POST") {
      const filename = parts.slice(3).join("/");
      if (filename) {
        if (!IMAGES.includes(filename)) IMAGES.push(filename);
        const folder = filename.includes("/") ? filename.split("/")[0] : null;
        if (folder && !FOLDERS.includes(folder)) FOLDERS.push(folder);
      }
      return json({ status: "success", filename, message: "Image uploaded" });
    }

    if (b === "files" && c && c !== "images") {
      const filename = parts.slice(2).join("/");
      if (method === "GET") {
        return json({ status: "success", filename, content: KB.get(filename) || "" });
      }
      if (method === "POST" || method === "PATCH") {
        const payload = await readBody<{ content?: string; prompt?: string; text?: string }>(req);
        KB.set(filename, payload.content ?? payload.prompt ?? payload.text ?? "");
        return json({ status: "success", filename, message: "File saved" });
      }
      if (method === "DELETE") {
        KB.delete(filename);
        return json({ status: "success", filename, message: "File deleted" });
      }
    }
  }

  if (a === "analysis") {
    if (b === "templates" && method === "GET") {
      return json({
        status: "success",
        data: [
          { persona: "Reservation Closer", transcript: TRANSCRIPT },
          { persona: "Corporate Inquiry", transcript: "Guest: Need 12 rooms for a corporate offsite in November." },
          { persona: "Wedding Planner", transcript: "Guest: Need banquet + 18 rooms for a wedding weekend." },
        ],
      });
    }

    if (b === "ingest_status" && method === "GET") {
      return json({ ...INGEST });
    }

    if (b === "sync_gdrive" && method === "POST") {
      INGEST.is_syncing = true;
      setTimeout(() => {
        INGEST.is_syncing = false;
        INGEST.last_auto_sync = new Date().toISOString();
        INGEST.auto_synced += 2;
        INGEST.total_processed = ROWS.length;
      }, 1500);
      return json({ status: "success", message: "Google Drive sync triggered" });
    }

    if (b === "history" && !c && method === "GET") {
      let rows = rowsFromFilters(req);
      rows = filterByOutcome(rows, req.nextUrl.searchParams.get("outcome"));

      const sortBy = req.nextUrl.searchParams.get("sort_by") || "ranking";
      if (sortBy === "recent") {
        rows = [...rows].sort((left, right) => String(right.call_timestamp).localeCompare(String(left.call_timestamp)));
      } else {
        rows = [...rows].sort((left, right) => safeNum(right.total_score) - safeNum(left.total_score));
      }

      const data = rows.map(toHistoryRow);
      return json({ status: "success", data, history: data, total: data.length });
    }

    if (b === "history" && c === "clear" && method === "DELETE") {
      ROWS = [];
      INGEST.total_processed = 0;
      return json({ status: "success", message: "History cleared" });
    }

    if (b === "history" && c && d === "trigger_followup" && method === "POST") {
      const row = ROWS.find((item) => item.id === safeNum(c));
      if (!row) return json({ status: "error", message: "Call not found" }, 404);
      row.followup_sent = 1;
      row.needs_followup = 0;
      row.followup_summary = "Follow-up sent via WhatsApp";
      return json({ status: "success", message: "Follow-up triggered" });
    }

    if (b === "history" && c && method === "DELETE") {
      const target = safeNum(c);
      const before = ROWS.length;
      ROWS = ROWS.filter((row) => safeNum(row.id) !== target);
      INGEST.total_processed = ROWS.length;
      if (ROWS.length === before) return json({ status: "error", message: "Call not found" }, 404);
      return json({ status: "success", message: "Record deleted" });
    }

    if (b === "transcribe_polished" && method === "POST") {
      return json({
        status: "success",
        transcript:
          "POLISHED ORIGINAL TRANSCRIPT\nAria: Welcome to Oasis reservations...\n\nENGLISH TRANSLATED TRANSCRIPT\nAria: Welcome to Oasis reservations...",
      });
    }

    if (b === "transcribe" && method === "POST") {
      return json({ status: "success", transcript: TRANSCRIPT, raw_text: TRANSCRIPT, detected_language: "en" });
    }

    if (b === "analyze" && method === "POST") {
      const payload = await readBody<{ transcript?: string; persona?: string }>(req);
      const now = new Date().toISOString();
      const nextId = (Math.max(0, ...ROWS.map((row) => safeNum(row.id))) || 0) + 1;

      const sample = {
        ...createRow(nextId + 20),
        id: nextId,
        s_no: nextId,
        call_uuid: `call_${String(nextId).padStart(4, "0")}`,
        caller_name: `Analyzed Lead ${nextId}`,
        caller_phone: `+91 98100 ${String(12000 + nextId).slice(-5)}`,
        created_at: now,
        created_at_iso: now,
        call_timestamp: now,
        source: "manual",
        call_transcript: payload.transcript || TRANSCRIPT,
        transcript_text: payload.transcript || TRANSCRIPT,
        all_transcripts: {
          original: payload.transcript || TRANSCRIPT,
          english: payload.transcript || TRANSCRIPT,
        },
        intent_score: 84,
        lock_in_score: 26,
        revenue_score: 21,
        total_score: 83,
        tier: "A",
        outcome: "followup_needed",
        needs_followup: 1,
        followup_sent: 0,
        followup_action: "Send premium package and callback in 2 hours",
        what_went_wrong: "Agent did not confidently close after pricing discussion.",
        suggested_action: "Use value-based closing and lock a micro-commitment.",
        discount_strategy: "Offer bundled benefit before discount",
        decision_json: {
          what_went_wrong: "No structured objection handling at close.",
          improvement_suggestions:
            "Reframe value, confirm urgency, and ask for direct booking commitment.",
        },
      };

      ROWS.unshift(sample);
      INGEST.total_processed = ROWS.length;
      INGEST.manual_uploaded += 1;

      return json({
        status: "success",
        persona: payload.persona || "Reservation Closer",
        signals: {
          rooms_requested: sample.rooms_requested,
          stay_duration: sample.nights,
          price_sensitive: sample.price_sensitive === 1,
          event_related:
            sample.enquirer_segment === "wedding" || sample.enquirer_segment === "group",
        },
        score: {
          total: sample.total_score,
          lock_in: sample.lock_in_score,
          revenue: sample.revenue_score,
          intent: sample.intent_score,
          sensitivity: sample.sensitivity_score,
          reasoning:
            "High intent and strong revenue potential; close quality reduced by weak objection response.",
        },
        decision: {
          tier: sample.tier,
          priority: "HIGH",
          followup: sample.followup_action,
          discount: sample.discount_strategy,
          suggested_action: sample.suggested_action,
          what_went_wrong: sample.what_went_wrong,
          improvement_suggestions: sample.decision_json.improvement_suggestions,
        },
      });
    }

    if (b === "calls" && c && d === "pipeline_qa" && method === "PATCH") {
      const payload = await readBody<{
        manual_caller_name?: string;
        pipeline_issue_notes?: string;
        manual_drive_link?: string;
      }>(req);
      const row = ROWS.find((item) => item.call_uuid === c);
      if (!row) return json({ status: "error", message: "Call not found" }, 404);
      row.manual_caller_name = payload.manual_caller_name ?? row.manual_caller_name;
      row.pipeline_issue_notes = payload.pipeline_issue_notes ?? row.pipeline_issue_notes;
      row.manual_drive_link = payload.manual_drive_link ?? row.manual_drive_link;
      return json({ status: "success", message: "Pipeline QA updated" });
    }
  }

  if (a === "metrics") {
    const rows = rowsFromFilters(req);

    if (b === "ceo" && method === "GET") {
      if (c === "insights") return json(insightPayload(rows));
      return json(buildCeoResponse(req, rows));
    }

    if (b === "daily" && method === "GET") {
      if (c === "insights") {
        const payload = buildDailyResponse(req, rows);
        return json({
          insights: payload.insights,
          coaching_tip: payload.coaching_tip,
        });
      }
      return json(buildDailyResponse(req, rows));
    }

    if (b === "enquiries" && method === "GET") {
      if (c === "insights") {
        const payload = buildEnquiriesResponse(req, rows);
        return json({ key_insights: payload.key_insights });
      }
      return json(buildEnquiriesResponse(req, rows));
    }
  }

  if (a === "ai-coach") {
    const rows = rowsFromFilters(req);

    if (b === "gap-overview" && method === "GET") {
      const gaps = gapCount(rows);
      return json({
        total_calls: rows.length,
        process_intake: gaps.process_intake,
        inventory: gaps.inventory,
        financial: gaps.financial,
        script: rows.filter((row) => row.followed_call_format === 0).length,
        etiquette: rows.filter((row) => row.greeted_properly === 0).length,
        availability: rows.filter((row) => row.asked_about_availability === 0).length,
        sales: gaps.sales,
        diversion: gaps.diversion,
        closing: gaps.closing,
      });
    }

    if (b === "gap-calls" && method === "GET") {
      const gapType = req.nextUrl.searchParams.get("gap_type") || "all";
      const filtered = rows.filter((row) => {
        if (gapType === "all") return true;
        if (gapType === "script") return row.followed_call_format === 0;
        if (gapType === "etiquette") return row.greeted_properly === 0;
        if (gapType === "availability") return row.asked_about_availability === 0;
        const list = Array.isArray(row.fd_gaps) ? (row.fd_gaps as string[]) : [];
        return list.includes(gapType);
      });
      return json(filtered.slice(0, 100).map(toCoachRow));
    }

    if (b === "leakage-calls" && method === "GET") {
      const gap = req.nextUrl.searchParams.get("gap") || "all";
      const filtered = rows.filter((row) => {
        if (row.outcome !== "lost") return false;
        if (gap === "all") return true;
        const list = Array.isArray(row.fd_gaps) ? (row.fd_gaps as string[]) : [];
        return list.includes(gap);
      });
      return json(filtered.slice(0, 120).map(toCoachRow));
    }

    if (b === "bleeding" && method === "GET") {
      const filtered = rows
        .filter((row) => row.outcome === "lost")
        .sort((left, right) => safeNum(right.estimated_revenue_inr) - safeNum(left.estimated_revenue_inr))
        .slice(0, 120)
        .map(toCoachRow);
      return json(filtered);
    }

    if (b === "behavior-audit" && method === "GET") {
      return json(buildBehaviorAudit(rows));
    }

    if (b === "timeline-insights" && method === "GET") {
      return json(buildTimelineInsights(rows));
    }

    if (b === "triage-inbox" && method === "GET") {
      const triage = rows
        .filter(
          (row) =>
            row.outcome === "lost" ||
            row.outcome === "followup_needed" ||
            safeNum(row.total_score) <= 55 ||
            (row.price_sensitive === 1 && row.outcome !== "won")
        )
        .sort((left, right) => {
          const leftPriority = left.outcome === "lost" ? 3 : left.outcome === "followup_needed" ? 2 : 1;
          const rightPriority = right.outcome === "lost" ? 3 : right.outcome === "followup_needed" ? 2 : 1;
          if (leftPriority !== rightPriority) return rightPriority - leftPriority;
          return safeNum(right.estimated_revenue_inr) - safeNum(left.estimated_revenue_inr);
        })
        .slice(0, 80)
        .map((row) => ({
          ...toCoachRow(row),
          priority: row.outcome === "lost" ? "High" : row.outcome === "followup_needed" ? "Medium" : "Low",
        }));

      return json(triage);
    }

    if (b === "call" && c && method === "GET") {
      const row = ROWS.find((item) => item.call_uuid === c);
      if (!row) return json({ status: "error", message: "Call not found" }, 404);
      return json(toCoachRow(row));
    }
  }

  if (a === "calls" && c && method === "PATCH" && d === "book") {
    const id = safeNum(b);
    const row = ROWS.find((item) => safeNum(item.id) === id);
    if (!row) return json({ status: "error", message: "Call not found" }, 404);
    row.outcome = "won";
    row.followup_sent = 1;
    row.needs_followup = 0;
    row.confirmation_status = "converted";
    row.followup_summary = "Booking confirmed";
    return json({ status: "success", message: "Booking marked as confirmed" });
  }

  if (a === "calls" && c && method === "POST" && d === "trigger") {
    const id = safeNum(b);
    const row = ROWS.find((item) => safeNum(item.id) === id);
    if (!row) return json({ status: "error", message: "Call not found" }, 404);
    row.followup_sent = 1;
    row.followup_summary = "Follow-up sent";
    return json({ status: "success", message: "Follow-up sent" });
  }

  if (a === "calls" && c && method === "PATCH" && d === "custom_message") {
    const id = safeNum(b);
    const row = ROWS.find((item) => safeNum(item.id) === id);
    if (!row) return json({ status: "error", message: "Call not found" }, 404);
    const payload = await readBody<{ custom_followup_message?: string }>(req);
    row.custom_followup_message = payload.custom_followup_message || "";
    return json({ status: "success", message: "Custom message updated" });
  }

  if (a === "followups") {
    const followupRows = ROWS.filter((row) => row.tier && row.tier !== "N/A");

    if (!b && method === "GET") {
      const sent = followupRows.filter((row) => row.followup_sent === 1).map(toHistoryRow);
      const missing_number = followupRows
        .filter((row) => row.followup_sent === 0 && (!row.caller_phone || !String(row.caller_phone).trim()))
        .map(toHistoryRow);
      const pending = followupRows
        .filter((row) => row.followup_sent === 0 && row.caller_phone && String(row.caller_phone).trim())
        .map(toHistoryRow);
      return json({ status: "success", sent, missing_number, pending });
    }

    if (b && c === "phone" && method === "PUT") {
      const id = safeNum(b);
      const row = ROWS.find((item) => safeNum(item.id) === id);
      if (!row) return json({ status: "error", message: "Call not found" }, 404);
      const payload = await readBody<{ phone?: string }>(req);
      row.caller_phone = (payload.phone || "").trim();
      row.phone = row.caller_phone;
      return json({ status: "success", message: "Phone updated" });
    }

    if (b === "send_all_failed" && method === "POST") {
      const pendingRows = followupRows.filter(
        (row) => row.followup_sent === 0 && row.caller_phone && String(row.caller_phone).trim()
      );
      pendingRows.forEach((row) => {
        row.followup_sent = 1;
        row.followup_summary = "Bulk follow-up sent";
      });
      return json({
        status: "success",
        sent_count: pendingRows.length,
        failed_count: 0,
        message: `Sent ${pendingRows.length} follow-ups in bulk.`,
      });
    }
  }

  if (a === "followup" && b === "complete" && method === "POST") {
    const payload = await readBody<{ call_id?: string }>(req);
    const callId = payload.call_id || "";
    const row = ROWS.find((item) => item.call_uuid === callId || String(item.id) === callId);
    if (!row) return json({ status: "error", message: "Call not found" }, 404);
    row.followup_sent = 1;
    row.needs_followup = 0;
    row.followup_summary = "Follow-up completed";
    return json({ status: "success", message: "Follow-up marked complete" });
  }

  if (a === "leads" && c === "upload-audio" && method === "POST") {
    const id = safeNum(b);
    const row = ROWS.find((item) => safeNum(item.s_no) === id || safeNum(item.id) === id);
    const transcript = `${TRANSCRIPT}\nSystem: Audio uploaded for lead ${id}.`;
    if (row) {
      row.call_transcript = transcript;
      row.transcript_text = transcript;
      row.all_transcripts = { original: transcript, english: transcript };
    }
    return json({
      status: "success",
      message: "Audio transcribed",
      transcript,
      raw_text: transcript,
      detected_language: "en",
      segments: [{ start: 0, end: 23, text: transcript, language: "en" }],
    });
  }

  if (a === "stats" && method === "GET") {
    const metrics = computeCoreMetrics(ROWS);
    return json({
      status: "success",
      stats: {
        total_calls: ROWS.length,
        booking_inquiries: metrics.bookingCalls,
        general_inquiries: ROWS.length - metrics.bookingCalls,
        ai_conversion_rate: metrics.conversionRate,
        revenue_generated: metrics.revenue,
        active_followup_pipeline: metrics.followupPending,
        escalated_count: ROWS.filter((row) => row.is_escalated === 1).length,
        recurring_callers: metrics.repeatCount,
      },
    });
  }

  if (a === "data" && method === "GET") {
    const filter = req.nextUrl.searchParams.get("filter") || "all";
    let rows = [...ROWS];
    if (filter === "escalated") {
      rows = rows.filter((row) => row.is_escalated === 1 || row.inquiry_type === "General");
    } else if (filter === "completed") {
      rows = rows.filter((row) => row.confirmation_status === "converted");
    }
    const data = rows
      .sort((left, right) => String(right.call_timestamp).localeCompare(String(left.call_timestamp)))
      .map(mapLead);
    return json({ status: "success", data, count: data.length });
  }

  if (a === "trend" && method === "GET") {
    const map = new Map<string, { booking: number; general: number }>();
    ROWS.forEach((row) => {
      const date = day(row.call_timestamp || row.created_at);
      const existing = map.get(date) || { booking: 0, general: 0 };
      if (row.was_booking_intent === 1) existing.booking += 1;
      else existing.general += 1;
      map.set(date, existing);
    });

    const data = Array.from(map.entries())
      .sort(([aDate], [bDate]) => aDate.localeCompare(bDate))
      .slice(-21)
      .map(([date, payload]) => ({ date, booking: payload.booking, general: payload.general }));

    return json({ status: "success", data });
  }

  if (a === "funnel" && method === "GET") {
    const metrics = computeCoreMetrics(ROWS);
    return json({
      status: "success",
      funnel: {
        total_calls: ROWS.length,
        booking_inquiries: metrics.bookingCalls,
        initiated_followups: metrics.followupPending,
        confirmed_bookings: metrics.won,
      },
    });
  }

  if (a === "feed" && method === "GET") {
    const calls = [...ROWS]
      .sort((left, right) => String(right.call_timestamp).localeCompare(String(left.call_timestamp)))
      .slice(0, 40)
      .map(mapLead);
    return json({ status: "success", calls });
  }

  if (a === "chat") {
    if (b === "session" && c && method === "GET") {
      return json({ status: "success", messages: CHAT_SESSIONS.get(c) || [] });
    }

    if (b === "session" && c && method === "DELETE") {
      CHAT_SESSIONS.delete(c);
      return json({ status: "success" });
    }

    if (b === "message" && method === "POST") {
      const payload = await readBody<{ session_id?: string; message?: string }>(req);
      const sessionId = payload.session_id || "default";
      const message = payload.message || "";

      const answer = buildChatAnswer(message);
      const chunks = answer.match(/.{1,60}/g) || [answer];

      const toolCallNeeded =
        message.toLowerCase().includes("sql") ||
        message.toLowerCase().includes("query") ||
        message.toLowerCase().includes("count") ||
        message.toLowerCase().includes("lost") ||
        message.toLowerCase().includes("revenue");

      const events: AnyRecord[] = [];
      if (toolCallNeeded) {
        events.push({
          type: "tool_call",
          reason: "Querying synthetic call intelligence dataset",
          sql: "SELECT outcome, COUNT(*) AS calls, SUM(estimated_revenue_inr) AS revenue FROM calls GROUP BY outcome;",
        });
      }

      chunks.forEach((chunk) => events.push({ type: "chunk", content: chunk }));
      events.push({ type: "done" });

      const history = CHAT_SESSIONS.get(sessionId) || [];
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: answer });
      CHAT_SESSIONS.set(sessionId, history);

      return sseResponse(events);
    }
  }

  if (a === "ws") {
    return json({ status: "error", message: "WebSocket upgrade is not supported in this mock route." }, 426);
  }

  return json({ status: "error", message: "Not found" }, 404);
}

export async function GET(req: NextRequest) {
  return routeHandler(req, "GET");
}

export async function POST(req: NextRequest) {
  return routeHandler(req, "POST");
}

export async function PATCH(req: NextRequest) {
  return routeHandler(req, "PATCH");
}

export async function PUT(req: NextRequest) {
  return routeHandler(req, "PUT");
}

export async function DELETE(req: NextRequest) {
  return routeHandler(req, "DELETE");
}

export async function OPTIONS(req: NextRequest) {
  return routeHandler(req, "OPTIONS");
}



