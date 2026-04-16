import { Casing } from "./types.ts";

export function toCamelCase(str: string): string {
  return str
    .replace (/[-_\s]+(.)?/g, (_, chr) => chr ? chr.toUpperCase () : "")
    .replace (/^./, match => match.toLowerCase ());
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

