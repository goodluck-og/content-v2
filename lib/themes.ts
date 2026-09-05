export type Theme = {
  id: string;
  name: string;
  colors: { ink: string; teal: string; lime: string; ember: string; cream: string };
};

// Default theme first. Palettes 1-5 are the user's Coolors picks; 6-7 are
// additional themes designed to round the set out to 7.
export const THEMES: Theme[] = [
  {
    id: "navy-tech",
    name: "Navy Tech",
    colors: { ink: "#0A1128", teal: "#001F54", lime: "#1282A2", ember: "#034078", cream: "#FEFCFB" },
  },
  {
    id: "crimson-rose",
    name: "Crimson Rose",
    colors: { ink: "#211103", teal: "#3D1308", lime: "#7B0D1E", ember: "#9F2042", cream: "#F8E5EE" },
  },
  {
    id: "sunset-coral",
    name: "Sunset Coral",
    colors: { ink: "#721121", teal: "#A5402D", lime: "#F15156", ember: "#FFC07F", cream: "#FFCF99" },
  },
  {
    id: "violet-dusk",
    name: "Violet Dusk",
    colors: { ink: "#011638", teal: "#2E294E", lime: "#9055A2", ember: "#D499B9", cream: "#E8C1C5" },
  },
  {
    id: "signal-orange",
    name: "Signal Orange",
    colors: { ink: "#3F2A2B", teal: "#565656", lime: "#B2FFA9", ember: "#FF4A1C", cream: "#F5FFF0" },
  },
  {
    id: "slate-pro",
    name: "Slate Pro",
    colors: { ink: "#0F1115", teal: "#1C2128", lime: "#3DDC84", ember: "#F59E0B", cream: "#F4F5F7" },
  },
  {
    id: "sunrise-gold",
    name: "Sunrise Gold",
    colors: { ink: "#1A120B", teal: "#3B2414", lime: "#FFD166", ember: "#EF476F", cream: "#FFF8ED" },
  },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
