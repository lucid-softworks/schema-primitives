import { describe, expect, expectTypeOf, it } from "vitest";

import {
  bigintSchema,
  booleanSchema,
  dateSchema,
  literalSchema,
  neverSchema,
  nullSchema,
  numberSchema,
  stringSchema,
  unknownSchema,
} from "../src/index.js";

describe("stringSchema", () => {
  it("accepts configured strings and exposes JSON-friendly metadata", () => {
    const schema = stringSchema({
      minLength: 2,
      maxLength: 4,
      pattern: /^a/iu,
    });
    expect(schema.parse("abc")).toBe("abc");
    expect(schema.definition).toEqual({
      kind: "string",
      maxLength: 4,
      minLength: 2,
      pattern: "^a",
      patternFlags: "iu",
    });
  });

  it.each([
    [1, "Expected string, received number"],
    ["a", "Expected at least 2 characters"],
    ["abcde", "Expected at most 4 characters"],
    ["zz", "Expected a string matching /^a/iu"],
  ])("rejects %j", (input, message) => {
    expect(() =>
      stringSchema({
        minLength: 2,
        maxLength: 4,
        pattern: /^a/iu,
      }).parse(input),
    ).toThrow(message);
  });

  it("supports an unconstrained string", () => {
    expect(stringSchema().parse("")).toBe("");
    expect(stringSchema().definition).toEqual({ kind: "string" });
  });
});

describe("numberSchema", () => {
  it("accepts constrained numbers", () => {
    const schema = numberSchema({ integer: true, minimum: 1, maximum: 3 });
    expect(schema.parse(2)).toBe(2);
    expect(schema.definition).toEqual({
      finite: true,
      kind: "integer",
      maximum: 3,
      minimum: 1,
    });
  });

  it.each([
    ["1", "Expected number, received string"],
    [Number.NaN, "Expected a finite number"],
    [1.5, "Expected an integer"],
    [0, "greater than or equal to 1"],
    [4, "less than or equal to 3"],
  ])("rejects invalid number %j", (input, message) => {
    expect(() =>
      numberSchema({ integer: true, minimum: 1, maximum: 3 }).parse(input),
    ).toThrow(message);
  });

  it("can allow non-finite numbers", () => {
    const schema = numberSchema({ finite: false });
    expect(schema.parse(Number.POSITIVE_INFINITY)).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(schema.definition).toEqual({ finite: false, kind: "number" });
  });
});

describe("other primitive schemas", () => {
  it("parses booleans and literals with narrow output types", () => {
    expect(booleanSchema().parse(true)).toBe(true);
    expect(() => booleanSchema().parse("true")).toThrow("Expected boolean");
    const literal = literalSchema("ready");
    expect(literal.parse("ready")).toBe("ready");
    expectTypeOf(literal.parse("ready")).toEqualTypeOf<"ready">();
    expect(() => literal.parse("nope")).toThrow('Expected the literal "ready"');
    expect(nullSchema().parse(null)).toBeNull();
  });

  it("parses dates and bigints", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(dateSchema().parse(date)).toBe(date);
    expect(() => dateSchema().parse(new Date("invalid"))).toThrow(
      "Expected valid date",
    );
    expect(bigintSchema().parse(1n)).toBe(1n);
    expect(() => bigintSchema().parse(1)).toThrow("Expected bigint");
  });

  it("accepts unknown values and rejects every never value", () => {
    const value = { anything: true };
    expect(unknownSchema().parse(value)).toBe(value);
    expect(() => neverSchema().parse(value)).toThrow("No value is allowed");
  });
});
