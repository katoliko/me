import { stripRichText } from "@/lib/content";

type ApiReading = {
  date?: string;
  season?: string;
  readings?: {
    firstReading?: string;
    psalm?: string;
    secondReading?: string;
    gospel?: string;
  };
};

type ApiSaint = {
  date?: string;
  season?: string;
  celebration?: {
    name?: string;
    type?: string;
    quote?: string;
    description?: string;
    image?: string;
  };
};

type WikipediaPage = {
  title?: string;
  extract?: string;
  thumbnail?: {
    source?: string;
  };
};

export type ExternalReading = {
  fecha: string;
  tiempo_liturgico: string | null;
  primera_lectura: string | null;
  salmo: string | null;
  segunda_lectura: string | null;
  evangelio: string | null;
  texto_primera_lectura: string | null;
  texto_salmo: string | null;
  texto_segunda_lectura: string | null;
  texto_evangelio: string | null;
  source: "external";
};

export type ExternalSaint = {
  fecha: string;
  nombre: string;
  biografia: string;
  virtudes: string | null;
  patronazgo: string | null;
  imagen_url: string | null;
  tipo: string | null;
  source: "external";
};

function dateParts(date: string) {
  const [year, month, day] = date.split("-");

  return {
    year,
    monthDay: `${month}-${day}`,
  };
}

function endpoint(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path}`;
}

const BOOK_NAMES: Record<string, string> = {
  Genesis: "Génesis",
  Exodus: "Éxodo",
  Leviticus: "Levítico",
  Numbers: "Números",
  Deuteronomy: "Deuteronomio",
  Joshua: "Josué",
  Judges: "Jueces",
  Ruth: "Rut",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Kings": "1 Reyes",
  "2 Kings": "2 Reyes",
  "1 Chronicles": "1 Crónicas",
  "2 Chronicles": "2 Crónicas",
  Ezra: "Esdras",
  Nehemiah: "Nehemías",
  Tobit: "Tobías",
  Judith: "Judit",
  Esther: "Ester",
  "1 Maccabees": "1 Macabeos",
  "2 Maccabees": "2 Macabeos",
  Job: "Job",
  Psalm: "Salmos",
  Psalms: "Salmos",
  Proverbs: "Proverbios",
  Ecclesiastes: "Eclesiastés",
  "Song of Songs": "Cantar de los Cantares",
  Wisdom: "Sabiduría",
  Sirach: "Eclesiástico",
  Sirarch: "Eclesiástico",
  Isaiah: "Isaías",
  Jeremiah: "Jeremías",
  Lamentations: "Lamentaciones",
  Baruch: "Baruc",
  Ezekiel: "Ezequiel",
  Daniel: "Daniel",
  Hosea: "Oseas",
  Joel: "Joel",
  Amos: "Amós",
  Obadiah: "Abdías",
  Jonah: "Jonás",
  Micah: "Miqueas",
  Nahum: "Nahúm",
  Habakkuk: "Habacuc",
  Zephaniah: "Sofonías",
  Haggai: "Ageo",
  Zechariah: "Zacarías",
  Malachi: "Malaquías",
  Matthew: "Mateo",
  Mark: "Marcos",
  Luke: "Lucas",
  John: "Juan",
  Acts: "Hechos",
  Romans: "Romanos",
  Corinthians: "Corintios",
  "1 Corinthians": "1 Corintios",
  "2 Corinthians": "2 Corintios",
  Galatians: "Gálatas",
  Ephesians: "Efesios",
  Philippians: "Filipenses",
  Phiippians: "Filipenses",
  Colossians: "Colosenses",
  Thessalonians: "Tesalonicenses",
  "1 Thessalonians": "1 Tesalonicenses",
  "2 Thessalonians": "2 Tesalonicenses",
  Timothy: "Timoteo",
  "1 Timothy": "1 Timoteo",
  "2 Timothy": "2 Timoteo",
  Titus: "Tito",
  Philemon: "Filemón",
  Hebrews: "Hebreos",
  James: "Santiago",
  Peter: "Pedro",
  "1 Peter": "1 Pedro",
  "2 Peter": "2 Pedro",
  "1 John": "1 Juan",
  "2 John": "2 Juan",
  "3 John": "3 Juan",
  Jude: "Judas",
  Revelation: "Apocalipsis",
};

export function translateReference(reference: string) {
  return Object.entries(BOOK_NAMES)
    .sort(([a], [b]) => b.length - a.length)
    .reduce(
      (value, [english, spanish]) =>
        value.replace(new RegExp(`\\b${english}\\b`, "gi"), spanish),
      reference
    );
}

function translateSeason(season: string | undefined) {
  return (
    season
      ?.replace("Ordinary Time", "Tiempo Ordinario")
      .replace("Advent", "Adviento")
      .replace("Christmas", "Navidad")
      .replace("Lent", "Cuaresma")
      .replace("Easter", "Pascua") || null
  );
}

export function translateCelebrationName(name: string) {
  const knownTranslations: Record<string, string> = {
    "Our Lady of Sorrows": "Nuestra Señora de los Dolores",
    "Saint Francis of Assisi": "San Francisco de Asís",
    "Saint Thérèse of Lisieux": "Santa Teresita del Niño Jesús",
    "Saint Teresa of Ávila": "Santa Teresa de Jesús",
    "Saint John Paul II": "San Juan Pablo II",
    "Saint Joseph": "San José",
    "The Exaltation of the Holy Cross": "La Exaltación de la Santa Cruz",
  };
  if (knownTranslations[name]) return knownTranslations[name];

  const sunday = name.match(/^(\d+)(?:st|nd|rd|th) Sunday of Ordinary Time$/i);
  if (sunday) return `${toRomanNumeral(Number(sunday[1]))} Domingo del Tiempo Ordinario`;

  return name
    .replace(/^Our Lady of /, "Nuestra Señora de ")
    .replace(/^Saint Francis of Assisi$/, "San Francisco de Asís")
    .replace(/^Saint /, "San ");
}

function toRomanNumeral(value: number) {
  const numerals: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let remainder = value;
  return numerals.reduce((result, [number, numeral]) => {
    while (remainder >= number) {
      result += numeral;
      remainder -= number;
    }
    return result;
  }, "");
}

export function isBibleCitation(value: string | null | undefined) {
  if (!value) return false;
  return /^[\p{L}\d][\p{L}\d\s.'-]*\s+(?:\d+|[A-F]):\s*\d+[a-z]?(?:\s*-\s*(?:(?:\d+|[A-F]):\s*)?\d+[a-z]?)?(?:\s*,\s*\d+[a-z]?(?:\s*-\s*\d+[a-z]?)?)*(?:\s+and\s+\d+(?:\s*-\s*\d+)?)?$/iu.test(
    stripRichText(value).replace(/\u00a0/g, " ").replace(/[–—]/g, "-").trim()
  );
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: 86400,
      },
    });

    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("application/json")
    ) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getWikipediaSummary(name: string) {
  const search = await fetchJson<{
    query?: {
      search?: Array<{
        title?: string;
      }>;
    };
  }>(
    `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      name
    )}&srnamespace=0&srlimit=10&format=json&origin=*`
  );

  const titles =
    search?.query?.search
      ?.map((item) => item.title)
      .filter((title): title is string => Boolean(title)) || [];

  const normalized = name
    .toLowerCase()
    .replace(/^(el|la|san|santa)\s+/, "")
    .trim();

  const title =
    titles.find((item) => item.toLowerCase() === normalized) ||
    titles.find((item) => item.toLowerCase().includes(normalized)) ||
    titles[0];

  if (!title) return null;

  const data = await fetchJson<{
    query?: {
      pages?: Record<string, WikipediaPage>;
    };
  }>(
    `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&prop=extracts%7Cpageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`
  );

  return Object.values(data?.query?.pages || {})[0] || null;
}

export async function getExternalReading(
  date: string
): Promise<ExternalReading | null> {
  const { year, monthDay } = dateParts(date);

  const base =
    process.env.LECTIONARY_API_URL ||
    "https://cpbjr.github.io/catholic-readings-api";

  const data = await fetchJson<ApiReading>(
    endpoint(base, `readings/${year}/${monthDay}.json`)
  );

  if (!data?.readings) return null;

  const references = {
    first: data.readings.firstReading || null,
    psalm: data.readings.psalm || null,
    second: data.readings.secondReading || null,
    gospel: data.readings.gospel || null,
  };

  return {
    fecha: date,
    tiempo_liturgico: translateSeason(data.season),
    primera_lectura: references.first
      ? translateReference(references.first)
      : null,
    salmo: references.psalm
      ? translateReference(references.psalm)
      : null,
    segunda_lectura: references.second
      ? translateReference(references.second)
      : null,
    evangelio: references.gospel
      ? translateReference(references.gospel)
      : null,
    texto_primera_lectura: null,
    texto_salmo: null,
    texto_segunda_lectura: null,
    texto_evangelio: null,
    source: "external",
  };
}

export async function getExternalSaint(
  date: string
): Promise<ExternalSaint | null> {
  const { year, monthDay } = dateParts(date);

  const base =
    process.env.CATHOLIC_READINGS_API_URL ||
    "https://cpbjr.github.io/catholic-readings-api";

  const data = await fetchJson<ApiSaint>(
    endpoint(
      base,
      `liturgical-calendar/${year}/${monthDay}.json`
    )
  );

  const celebration = data?.celebration;

  if (!celebration?.name) return null;

  if (celebration.type === "SUNDAY" && monthDay === "10-04") {
    const saintName = "San Francisco de Asís";
    const saintInfo = await getWikipediaSummary(saintName);
    if (saintInfo?.extract || saintInfo?.thumbnail?.source) {
      return {
        fecha: date,
        nombre: saintName,
        biografia: saintInfo.extract || "San Francisco de Asís es conmemorado el 4 de octubre.",
        virtudes: null,
        patronazgo: null,
        imagen_url: saintInfo.thumbnail?.source || null,
        tipo: "SAINT",
        source: "external",
      };
    }
  }

  const translatedName = translateCelebrationName(celebration.name);

  const description = stripRichText(
    celebration.description || ""
  );

  const quote = stripRichText(
    celebration.quote || ""
  );
  const isSunday = celebration.type === "SUNDAY";

  let biography = description;
  let image = celebration.image || null;

  if ((!biography || !image) && !isSunday) {
    const saintName = translatedName.replace(/,.*/, "");

    const wiki = await getWikipediaSummary(saintName);

    biography = biography || wiki?.extract || "";
    image = image || wiki?.thumbnail?.source || null;
  }

  return {
    fecha: date,
    nombre: translatedName,
    biografia: biography || (isSunday
      ? `La Iglesia celebra hoy el ${translatedName}. Las lecturas de la Misa invitan a escuchar la Palabra de Dios y llevarla a la vida diaria.`
      : "Información biográfica no disponible."),
    virtudes: quote ? `Frase: ${quote}` : null,
    patronazgo: null,
    imagen_url: image,
    tipo: celebration.type || null,
    source: "external",
  };
}

export async function generateAiReflection(
  reading: ExternalReading
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const references = [
      reading.primera_lectura,
      reading.salmo,
      reading.segunda_lectura,
      reading.evangelio,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      source: "fallback" as const,
      titulo: "Una palabra para tu día",
      contenido: `Las lecturas de hoy (${references}) nos invitan a detenernos, escuchar la Palabra y llevarla a nuestras decisiones concretas. Reserva unos minutos de silencio, reconoce aquello que Dios está poniendo en tu corazón y responde con un gesto sencillo de amor.`,
      pregunta:
        "¿Qué palabra de las lecturas de hoy quieres llevar a tu vida?",
      oracion:
        "Señor, ayúdame a escuchar tu Palabra y a vivirla con esperanza, humildad y amor.",
      proposito:
        "Elegir hoy un gesto concreto de servicio y realizarlo con alegría.",
    };
  }

  const model =
    process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const prompt = [
    "Escribe una reflexión católica breve en español para una aplicación pastoral.",
    "No inventes citas bíblicas ni atribuyas frases a santos.",
    "Devuelve únicamente JSON válido con estas claves: titulo, contenido, pregunta, oracion, proposito.",
    `Primera lectura: ${
      reading.primera_lectura || "No disponible"
    }`,
    `Salmo: ${reading.salmo || "No disponible"}`,
    `Segunda lectura: ${
      reading.segunda_lectura || "No disponible"
    }`,
    `Evangelio: ${reading.evangelio || "No disponible"}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const text =
      payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return null;

    const parsed = JSON.parse(text) as Record<
      string,
      unknown
    >;

    const value = (key: string, max: number) =>
      typeof parsed[key] === "string"
        ? stripRichText(parsed[key] as string).slice(0, max)
        : "";

    const result = {
      titulo: value("titulo", 180),
      contenido: value("contenido", 4000),
      pregunta: value("pregunta", 500),
      oracion: value("oracion", 1000),
      proposito: value("proposito", 500),
    };

    return result.titulo && result.contenido
      ? {
          ...result,
          source: "gemini" as const,
        }
      : null;
  } catch {
    return null;
  }
}