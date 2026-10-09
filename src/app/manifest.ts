import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WAPPX — WhatsApp Business Automation & CRM",
    short_name: "WAPPX",
    description:
      "Enterprise WhatsApp Business Automation & CRM engine powered by official Meta Cloud API v22.0.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F7F2",
    theme_color: "#0A504A",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192 512x512",
        type: "image/png",
      },
    ],
  };
}
