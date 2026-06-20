declare module "bidi-js" {
  type Level = number;
  interface Bidi {
    getEmbeddingLevels(text: string, baseDir?: "ltr" | "rtl" | "auto"): { levels: Uint8Array; paragraphs: any[] };
    getReorderSegments(text: string, embedLevels: any): Array<[number, number]>;
    getReorderedIndices(text: string, embedLevels: any): number[];
    getReorderedString(text: string, embedLevels: any): string;
    getMirroredCharacter(ch: string): string | null;
  }
  export default function bidiFactory(): Bidi;
}
