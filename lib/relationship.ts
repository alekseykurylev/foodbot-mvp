export function getRelationshipID(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: number | string }).id;

    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return undefined;
}
