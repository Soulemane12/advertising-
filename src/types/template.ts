// Template types for video generation

export type AspectRatio = "9:16" | "1:1" | "16:9";
export type CaptionStyle = "burned" | "sidecar" | "off";

export interface Template {
  id: string;
  name: string;
  description: string;
  durationsSec: number[]; // [6, 15]
  aspectRatios: AspectRatio[];
  captions: CaptionStyle;
  thumbnail?: string;
}

export interface EditRequest {
  videoId: string;
  selections: { startMs: number; endMs: number }[];
  templateId: string;
  aspectRatios: AspectRatio[];
  durationsSec: number[];
  captions: CaptionStyle;
}

export const defaultTemplates: Template[] = [
  {
    id: "short",
    name: "Short Form Ads",
    description: "Quick, engaging videos perfect for social media stories and reels",
    durationsSec: [6, 15],
    aspectRatios: ["9:16", "1:1", "16:9"],
    captions: "burned"
  },
  {
    id: "square",
    name: "Square Social",
    description: "Square format optimized for Instagram feed and Facebook posts",
    durationsSec: [6, 15],
    aspectRatios: ["1:1"],
    captions: "burned"
  },
  {
    id: "landscape",
    name: "Landscape Web",
    description: "Wide format perfect for YouTube ads and website headers",
    durationsSec: [15, 30],
    aspectRatios: ["16:9"],
    captions: "sidecar"
  },
  {
    id: "stories",
    name: "Mobile Stories",
    description: "Vertical format for Instagram/TikTok stories and reels",
    durationsSec: [6, 15],
    aspectRatios: ["9:16"],
    captions: "burned"
  }
];

export const aspectRatioLabels: Record<AspectRatio, string> = {
  "9:16": "Vertical (Stories)",
  "1:1": "Square (Feed)",
  "16:9": "Landscape (YouTube)"
};

export const captionLabels: Record<CaptionStyle, string> = {
  "burned": "Burned-in Captions",
  "sidecar": "Separate Caption File",
  "off": "No Captions"
};