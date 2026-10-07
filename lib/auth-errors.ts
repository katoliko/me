export function translateAuthError(error: unknown, fallback = "Ocurrió un error. Inténtalo de nuevo.") {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return "El correo o la contraseña no son correctos.";
  if (message.includes("email not confirmed")) return "Confirma tu correo electrónico antes de iniciar sesión.";
  if (message.includes("user already registered")) return "Ya existe una cuenta con ese correo.";
  if (message.includes("password")) return "La contraseña no cumple los requisitos.";
  if (message.includes("rate limit")) return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
  return fallback;
}
