const MAX_AUTO_SLUG_LENGTH = 40;
const MAX_MANUAL_SLUG_LENGTH = 60;

export function slugifyTitle(value: string, maxLength = MAX_AUTO_SLUG_LENGTH) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized.slice(0, maxLength).replace(/-+$/, "");
}

export function normalizeManualSlug(value: string) {
  return slugifyTitle(value, MAX_MANUAL_SLUG_LENGTH);
}

export function isValidManualSlug(value: string) {
  return value.length <= MAX_MANUAL_SLUG_LENGTH && /^[a-z]+(?:-[a-z]+)*$/.test(value);
}

export { MAX_AUTO_SLUG_LENGTH, MAX_MANUAL_SLUG_LENGTH };
