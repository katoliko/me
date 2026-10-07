import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags
      .filter((tag) => tag !== "img")
      .concat("u"),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": [...(sanitizeHtml.defaults.allowedAttributes["*"] ?? []), "style"],
      a: [...(sanitizeHtml.defaults.allowedAttributes.a ?? []), "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      "*": {
        color: [/^#[\da-f]{3,8}$/i],
        "font-size": [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
        "text-align": [/^(?:left|right|center|justify)$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}

export function stripRichText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
