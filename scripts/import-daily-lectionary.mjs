import { createClient } from "@supabase/supabase-js";

const years = [2026, 2027];
const sourceBase = "https://cpbjr.github.io/catholic-readings-api/readings";
const concurrency = 10;
const batchSize = 100;
const shouldApply = process.argv.includes("--apply");

function datesForYear(year) {
  const dayCount =
    (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;

  return Array.from({ length: dayCount }, (_, index) =>
    new Date(Date.UTC(year, 0, index + 1)).toISOString().slice(0, 10),
  );
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
      });

      if (response.ok) return await response.json();

      lastError = new Error(`HTTP ${response.status} for ${url}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  throw lastError ?? new Error(`Could not fetch ${url}`);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );

  return results;
}

function toReadingRow(date, payload) {
  if (payload.date !== date || !payload.readings) {
    throw new Error(`Invalid lectionary record for ${date}`);
  }

  const { firstReading, psalm, secondReading, gospel } = payload.readings;
  if (typeof firstReading !== "string" || typeof gospel !== "string") {
    throw new Error(`Required reading references are missing for ${date}`);
  }

  for (const [name, value] of Object.entries({
    firstReading,
    psalm,
    secondReading,
    gospel,
  })) {
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new Error(`Invalid ${name} reference for ${date}`);
    }
  }

  return {
    fecha: date,
    tiempo_liturgico: payload.season ?? null,
    primera_lectura: firstReading,
    salmo: psalm ?? null,
    segunda_lectura: secondReading ?? null,
    evangelio: gospel,
    status: "published",
    published: true,
  };
}

async function main() {
  const dates = years.flatMap(datesForYear);
  const readings = await mapWithConcurrency(dates, concurrency, async (date) => {
    const year = date.slice(0, 4);
    const monthDay = date.slice(5);
    const payload = await fetchJson(`${sourceBase}/${year}/${monthDay}.json`);
    return toReadingRow(date, payload);
  });

  const missingPsalms = readings
    .filter((reading) => !reading.salmo)
    .map((reading) => reading.fecha);
  const missingSecondReadings = readings.filter(
    (reading) => !reading.segunda_lectura,
  ).length;

  console.log(`Source validation passed: ${readings.length} dates (${years.join(", ")}).`);
  console.log(
    `References without a psalm: ${missingPsalms.length ? missingPsalms.join(", ") : "none"}.`,
  );
  console.log(
    `Dates without a second reading: ${missingSecondReadings} (normal on many weekdays).`,
  );

  if (!shouldApply) {
    console.log("Dry run only. No Supabase rows were read or written.");
    console.log("Run with --apply to insert dates not already present.");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before applying.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: existingRows, error: selectError } = await supabase
    .from("lecturas")
    .select("fecha")
    .gte("fecha", "2026-01-01")
    .lt("fecha", "2028-01-01")
    .limit(2000);

  if (selectError) {
    throw new Error(
      `Could not read existing lectionary dates: ${selectError.message}`,
    );
  }

  const existingDates = new Set(existingRows.map((row) => row.fecha));
  const pending = readings.filter((reading) => !existingDates.has(reading.fecha));
  console.log(
    `Existing dates preserved: ${readings.length - pending.length}; new rows to insert: ${pending.length}.`,
  );

  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = pending.slice(start, start + batchSize);
    const { error: insertError } = await supabase.from("lecturas").insert(batch);
    if (insertError) {
      throw new Error(
        `Supabase insert failed for batch starting at ${batch[0].fecha}: ${insertError.message}`,
      );
    }

    console.log(
      `Inserted ${Math.min(start + batch.length, pending.length)} of ${pending.length} new rows.`,
    );
  }

  console.log("Lectionary references imported. No Bible passage text was imported.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Lectionary import failed.");
  process.exitCode = 1;
});
