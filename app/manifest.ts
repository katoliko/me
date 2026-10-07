import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Katoliko",
    short_name: "Katoliko",
    description: "Lecturas, oración y reflexión para cada día.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F6F1",
    theme_color: "#2D4A5A",
    lang: "es",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
