import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  generateAiReflection,
  isBibleCitation,
  translateReference,
  type ExternalReading,
} from "@/lib/external-daily-content";
import { stripRichText } from "@/lib/content";

export const maxDuration = 60;

type GeminiImageResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
};

function mexicoCityDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function cleanReference(value: string | null) {
  if (!value) return null;
  const reference = stripRichText(value);
  return isBibleCitation(reference) ? translateReference(reference) : reference;
}

function databaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Falta la configuración segura de Supabase.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function generateFacebookImage(date: string, gospel: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  if (!apiKey) throw new Error("Falta configurar GEMINI_API_KEY.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: [
              "Genera una imagen original para una publicación católica diaria en redes sociales.",
              "Estilo cálido, sereno, moderno y contemplativo; composición vertical 4:5, luz natural suave, paleta crema, azul profundo y dorado.",
              "Usa símbolos cristianos sobrios relacionados con el pasaje, sin representar a Jesús ni a santos de forma identificable.",
              "No incluyas texto, letras, números, logotipos ni marcas de agua visibles.",
              `Fecha: ${date}. Referencia del Evangelio: ${gospel}.`,
            ].join(" "),
          }],
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "4:5" },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini no pudo generar la imagen (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as GeminiImageResponse;
  const image = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData;
  if (!image?.data || !image.mimeType?.startsWith("image/")) {
    throw new Error("Gemini no devolvió una imagen válida.");
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[image.mimeType];
  if (!extension) throw new Error("Gemini devolvió un formato de imagen no compatible.");

  const bytes = Buffer.from(image.data, "base64");
  if (bytes.length > 10 * 1024 * 1024) {
    throw new Error("La imagen generada supera el límite de almacenamiento.");
  }

  return { bytes, mimeType: image.mimeType, extension };
}

function buildCaption(
  date: string,
  readings: {
    primera_lectura: string | null;
    salmo: string | null;
    segunda_lectura: string | null;
    evangelio: string;
  },
  reflection: string,
  siteUrl: string,
) {
  const references = [
    ["Primera lectura", cleanReference(readings.primera_lectura)],
    ["Salmo", cleanReference(readings.salmo)],
    ["Segunda lectura", cleanReference(readings.segunda_lectura)],
    ["Evangelio", cleanReference(readings.evangelio)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

  return [
    `📖 Lecturas del día · ${formattedDate}`,
    ...references.map(([label, reference]) => `${label}: ${reference}`),
    "",
    "🙏 Reflexión",
    stripRichText(reflection).slice(0, 1000),
    "",
    `Lee las lecturas en ${siteUrl.replace(/\/$/, "")}/lecturas`,
    "",
    "Imagen generada con inteligencia artificial.",
  ].join("\n");
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || "v25.0";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (!pageId || !pageAccessToken || !siteUrl) {
    return NextResponse.json(
      { error: "Falta configurar Facebook o la URL pública del sitio." },
      { status: 503 },
    );
  }

  const { date, hour } = mexicoCityDateParts();
  if (hour !== 7) {
    return NextResponse.json({ skipped: true, reason: "outside_publish_hour", date });
  }

  let supabase;
  try {
    supabase = databaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase no está configurado." },
      { status: 503 },
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("facebook_publications")
    .select("status, facebook_post_id")
    .eq("publication_date", date)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "No se pudo consultar el registro de publicaciones de Facebook." },
      { status: 500 },
    );
  }
  if (existing) {
    return NextResponse.json({
      skipped: true,
      reason: "already_attempted",
      date,
      status: existing.status,
    });
  }

  const { data: reading, error: readingError } = await supabase
    .from("lecturas")
    .select("primera_lectura, salmo, segunda_lectura, evangelio")
    .eq("fecha", date)
    .eq("status", "published")
    .eq("published", true)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (readingError || !reading?.evangelio) {
    return NextResponse.json(
      { error: "No hay una referencia publicada del Evangelio para hoy." },
      { status: 409 },
    );
  }

  const { data: localReflection, error: reflectionError } = await supabase
    .from("reflexiones")
    .select("contenido")
    .eq("fecha", date)
    .eq("status", "published")
    .eq("published", true)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (reflectionError) {
    return NextResponse.json(
      { error: "No se pudo consultar la reflexión publicada." },
      { status: 500 },
    );
  }

  const aiReading: ExternalReading = {
    fecha: date,
    tiempo_liturgico: null,
    primera_lectura: cleanReference(reading.primera_lectura),
    salmo: cleanReference(reading.salmo),
    segunda_lectura: cleanReference(reading.segunda_lectura),
    evangelio: cleanReference(reading.evangelio),
    texto_primera_lectura: null,
    texto_salmo: null,
    texto_segunda_lectura: null,
    texto_evangelio: null,
    source: "external",
  };
  const generatedReflection = localReflection?.contenido
    ? null
    : await generateAiReflection(aiReading);
  const reflection =
    localReflection?.contenido ||
    generatedReflection?.contenido ||
    `Las lecturas de hoy (${cleanReference(reading.evangelio)}) nos invitan a hacer una pausa, escuchar con el corazón y responder con un gesto concreto de amor. ¿Qué paso pequeño puedes dar hoy para vivir tu fe con esperanza?`;

  const { error: reservationError } = await supabase
    .from("facebook_publications")
    .insert({ publication_date: date, status: "sending" });
  if (reservationError?.code === "23505") {
    return NextResponse.json({ skipped: true, reason: "already_attempted", date });
  }
  if (reservationError) {
    return NextResponse.json(
      { error: "No se pudo reservar la publicación diaria." },
      { status: 500 },
    );
  }

  let imageUrl: string | null = null;
  try {
    const image = await generateFacebookImage(
      date,
      cleanReference(reading.evangelio) || reading.evangelio,
    );
    const storagePath = `facebook/daily/${date}.${image.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("content-images")
      .upload(storagePath, image.bytes, {
        contentType: image.mimeType,
        upsert: true,
      });

    if (uploadError) throw new Error("No se pudo guardar la imagen generada.");
    imageUrl = supabase.storage.from("content-images").getPublicUrl(storagePath).data.publicUrl;

    const caption = buildCaption(date, reading, reflection, siteUrl);
    const graphResponse = await fetch(
      `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(pageId)}/photos`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: new URLSearchParams({
          url: imageUrl,
          caption,
          published: "true",
          access_token: pageAccessToken,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );
    const graphPayload = (await graphResponse.json()) as {
      id?: string;
      post_id?: string;
      error?: { message?: string };
    };
    const postId = graphPayload.post_id || graphPayload.id;
    if (!graphResponse.ok || !postId) {
      throw new Error(
        `Meta no publicó el contenido (HTTP ${graphResponse.status}${graphPayload.error?.message ? `: ${graphPayload.error.message}` : ""}).`,
      );
    }

    const { error: updateError } = await supabase
      .from("facebook_publications")
      .update({
        status: "published",
        facebook_post_id: postId,
        image_url: imageUrl,
        error_message: null,
        published_at: new Date().toISOString(),
      })
      .eq("publication_date", date);
    if (updateError) {
      throw new Error("La publicación se envió a Meta, pero no se pudo guardar su confirmación.");
    }

    return NextResponse.json({ published: true, date, postId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falló la publicación diaria.";
    await supabase
      .from("facebook_publications")
      .update({
        status: "failed",
        image_url: imageUrl,
        error_message: message.slice(0, 500),
      })
      .eq("publication_date", date);
    return NextResponse.json({ error: message, date }, { status: 502 });
  }
}
