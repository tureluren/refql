import { Casing } from "./types";

export function toCamelCase(str: string): string {
  return str
    .toLowerCase ()
    .replace (/(?:[_\-\s]+([a-z]))|^[A-Z]/g, (_, letter, offset) =>
      offset === 0 ? str.charAt (0).toLowerCase () : (letter ? letter.toUpperCase () : "")
    );
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase (str);
  return camel.charAt (0).toUpperCase () + camel.slice (1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace (/([a-z])([A-Z])/g, "$1_$2")
    .replace (/[-\s]+/g, "_")
    .toLowerCase ();
}

export function toKebabCase(str: string): string {
  return str
    .replace (/([a-z])([A-Z])/g, "$1-$2")
    .replace (/[_\s]+/g, "-")
    .toLowerCase ();
}

export function getCasingFn(casing: Casing) {
  switch (casing) {
    case "camelCase":
      return toCamelCase;
    case "PascalCase":
      return toPascalCase;
    case "snake_case":
      return toSnakeCase;
    case "kebap-case":
      return toKebabCase;
    default:
      return toSnakeCase;
  }
}

