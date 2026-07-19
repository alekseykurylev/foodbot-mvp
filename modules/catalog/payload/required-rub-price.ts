import type { CollectionBeforeValidateHook, Field } from "payload";

function configureRUBPriceField(field: Field, companionField?: Field): Field {
  if ("name" in field && field.name === "priceInRUBEnabled" && field.type === "checkbox") {
    return {
      ...field,
      defaultValue: true,
      admin: {
        ...field.admin,
        hidden: true,
      },
    };
  }

  if ("name" in field && field.name === "priceInRUB" && field.type === "number") {
    return {
      ...field,
      min: 1,
      required: true,
      admin: {
        ...field.admin,
        condition: undefined,
      },
    };
  }

  if ("fields" in field && Array.isArray(field.fields)) {
    const containsRUBPrice = field.fields.some(
      (nestedField) =>
        "name" in nestedField && nestedField.name === "priceInRUB" && nestedField.type === "number",
    );
    const containsCompanion =
      companionField &&
      "name" in companionField &&
      field.fields.some(
        (nestedField) =>
          "name" in nestedField && nestedField.name === companionField.name,
      );

    return {
      ...field,
      fields: [
        ...field.fields.map((nestedField) => configureRUBPriceField(nestedField, companionField)),
        ...(containsRUBPrice && companionField && !containsCompanion ? [companionField] : []),
      ],
    } as Field;
  }

  return field;
}

export function requireRUBPrice(fields: Field[], companionField?: Field): Field[] {
  return fields.map((field) => configureRUBPriceField(field, companionField));
}

export const enableRUBPrice: CollectionBeforeValidateHook = ({ data }) => {
  if (data) {
    data.priceInRUBEnabled = true;
  }

  return data;
};
