import { slugify } from "transliteration";

export function generateSlug(value: string): string {
  return slugify(value, {
    lowercase: true,
    separator: "-",
    trim: true,
  });
}
