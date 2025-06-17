// casing.test.ts
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  getCasingFn
} from "./casing";
import { Casing } from "./types";

describe ("Case conversion functions", () => {
  describe ("toCamelCase", () => {
    it ("should convert snake_case to camelCase", () => {
      expect (toCamelCase ("example_string")).toBe ("exampleString");
    });

    it ("should convert kebab-case to camelCase", () => {
      expect (toCamelCase ("example-string")).toBe ("exampleString");
    });

    it ("should convert space delimited to camelCase", () => {
      expect (toCamelCase ("example string test")).toBe ("exampleStringTest");
    });

    it ("should convert PascalCase to camelCase", () => {
      expect (toCamelCase ("ExampleString")).toBe ("exampleString");
    });

    it ("should handle mixed input", () => {
      expect (toCamelCase ("example-String_Test")).toBe ("exampleStringTest");
    });
  });

  describe ("toPascalCase", () => {
    it ("should convert snake_case to PascalCase", () => {
      expect (toPascalCase ("example_string")).toBe ("ExampleString");
    });

    it ("should convert kebab-case to PascalCase", () => {
      expect (toPascalCase ("example-string")).toBe ("ExampleString");
    });

    it ("should convert space delimited to PascalCase", () => {
      expect (toPascalCase ("example string test")).toBe ("ExampleStringTest");
    });

    it ("should convert camelCase to PascalCase", () => {
      expect (toPascalCase ("exampleString")).toBe ("ExampleString");
    });

    it ("should handle mixed input", () => {
      expect (toPascalCase ("example-String_Test")).toBe ("ExampleStringTest");
    });
  });

  describe ("toSnakeCase", () => {
    it ("should convert camelCase to snake_case", () => {
      expect (toSnakeCase ("exampleStringTest")).toBe ("example_string_test");
    });

    it ("should convert PascalCase to snake_case", () => {
      expect (toSnakeCase ("ExampleStringTest")).toBe ("example_string_test");
    });

    it ("should convert kebab-case to snake_case", () => {
      expect (toSnakeCase ("example-string-test")).toBe ("example_string_test");
    });

    it ("should convert space delimited to snake_case", () => {
      expect (toSnakeCase ("example string test")).toBe ("example_string_test");
    });

    it ("should handle mixed input", () => {
      expect (toSnakeCase ("example-String_Test Value")).toBe ("example_string_test_value");
    });
  });

  describe ("toKebabCase", () => {
    it ("should convert camelCase to kebab-case", () => {
      expect (toKebabCase ("exampleStringTest")).toBe ("example-string-test");
    });

    it ("should convert PascalCase to kebab-case", () => {
      expect (toKebabCase ("ExampleStringTest")).toBe ("example-string-test");
    });

    it ("should convert snake_case to kebab-case", () => {
      expect (toKebabCase ("example_string_test")).toBe ("example-string-test");
    });

    it ("should convert space delimited to kebab-case", () => {
      expect (toKebabCase ("example string test")).toBe ("example-string-test");
    });

    it ("should handle mixed input", () => {
      expect (toKebabCase ("example_String-Test value")).toBe ("example-string-test-value");
    });
  });

  describe ("getCasingFn", () => {
    const testString = "hello_world-example";

    const cases: { casing: Casing; expected: string }[] = [
      { casing: "camelCase", expected: toCamelCase (testString) },
      { casing: "PascalCase", expected: toPascalCase (testString) },
      { casing: "snake_case", expected: toSnakeCase (testString) },
      { casing: "kebap-case", expected: toKebabCase (testString) }
    ];

    it.each (cases) ("should return the correct function for $casing", ({ casing, expected }) => {
      const fn = getCasingFn (casing);
      expect (fn (testString)).toBe (expected);
    });

    it ("should fallback to snake_case for unknown casing", () => {
      const fn = getCasingFn ("unknown" as Casing);
      expect (fn ("someStringValue")).toBe (toSnakeCase ("someStringValue"));
    });
  });
});
