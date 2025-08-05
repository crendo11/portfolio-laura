import { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Myapp",
    short_name: "Myapp",
    description: "Showing PWA",
    start_url: "/",
    display: "fullscreen", // This is crucial for full screen
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/vercel.svg",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/vercel.svg",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}