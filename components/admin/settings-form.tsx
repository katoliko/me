"use client";

import { useActionState, useEffect } from "react";
import { saveSiteSettings } from "@/app/admin/configuracion/actions";

type State = { saved: boolean };

export function SettingsForm({ children }: { children: React.ReactNode }) {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_previous, formData) => {
      await saveSiteSettings(formData);
      return { saved: true };
    },
    { saved: false },
  );

  useEffect(() => {
    if (state.saved) window.alert("Configuración guardada correctamente.");
  }, [state.saved]);

  return <form action={action} className="mt-8 grid gap-6">{children}<button disabled={pending} className="justify-self-start rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{pending ? "Guardando..." : "Guardar configuración"}</button></form>;
}
