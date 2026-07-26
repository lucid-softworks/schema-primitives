import {
  createSchema,
  describeValue,
  parseFailure,
  parseSuccess,
  schemaIssue,
  type Schema,
  type SchemaPath,
} from "@lucid-softworks/schema-core";

export type StringSchemaOptions = Readonly<{
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}>;

export type NumberSchemaOptions = Readonly<{
  minimum?: number;
  maximum?: number;
  integer?: boolean;
  finite?: boolean;
}>;

function typeFailure(expected: string, input: unknown, path: SchemaPath) {
  return parseFailure(
    schemaIssue(
      "invalid_type",
      `Expected ${expected}, received ${describeValue(input)}`,
      path,
      { expected, received: describeValue(input) },
    ),
  );
}

/** Accepts strings and optionally constrains their length and pattern. */
export function stringSchema(
  options: StringSchemaOptions = {},
): Schema<unknown, string> {
  return createSchema(
    (input, path) => {
      if (typeof input !== "string") return typeFailure("string", input, path);
      if (options.minLength !== undefined && input.length < options.minLength) {
        return parseFailure(
          schemaIssue(
            "too_small",
            `Expected at least ${options.minLength} characters`,
            path,
          ),
        );
      }
      if (options.maxLength !== undefined && input.length > options.maxLength) {
        return parseFailure(
          schemaIssue(
            "too_big",
            `Expected at most ${options.maxLength} characters`,
            path,
          ),
        );
      }
      if (
        options.pattern !== undefined &&
        !new RegExp(options.pattern.source, options.pattern.flags).test(input)
      ) {
        return parseFailure(
          schemaIssue(
            "invalid_string",
            `Expected a string matching ${String(options.pattern)}`,
            path,
          ),
        );
      }
      return parseSuccess(input);
    },
    {
      kind: "string",
      ...(options.minLength === undefined
        ? {}
        : { minLength: options.minLength }),
      ...(options.maxLength === undefined
        ? {}
        : { maxLength: options.maxLength }),
      ...(options.pattern === undefined
        ? {}
        : {
            pattern: options.pattern.source,
            patternFlags: options.pattern.flags,
          }),
    },
  );
}

/** Accepts numbers, rejecting NaN and infinity by default. */
export function numberSchema(
  options: NumberSchemaOptions = {},
): Schema<unknown, number> {
  const finite = options.finite ?? true;
  return createSchema(
    (input, path) => {
      if (typeof input !== "number") return typeFailure("number", input, path);
      if (finite && !Number.isFinite(input)) {
        return parseFailure(
          schemaIssue("not_finite", "Expected a finite number", path),
        );
      }
      if (options.integer === true && !Number.isInteger(input)) {
        return parseFailure(
          schemaIssue("not_integer", "Expected an integer", path),
        );
      }
      if (options.minimum !== undefined && input < options.minimum) {
        return parseFailure(
          schemaIssue(
            "too_small",
            `Expected a number greater than or equal to ${options.minimum}`,
            path,
          ),
        );
      }
      if (options.maximum !== undefined && input > options.maximum) {
        return parseFailure(
          schemaIssue(
            "too_big",
            `Expected a number less than or equal to ${options.maximum}`,
            path,
          ),
        );
      }
      return parseSuccess(input);
    },
    {
      kind: options.integer === true ? "integer" : "number",
      finite,
      ...(options.minimum === undefined ? {} : { minimum: options.minimum }),
      ...(options.maximum === undefined ? {} : { maximum: options.maximum }),
    },
  );
}

export function booleanSchema(): Schema<unknown, boolean> {
  return createSchema(
    (input, path) =>
      typeof input === "boolean"
        ? parseSuccess(input)
        : typeFailure("boolean", input, path),
    { kind: "boolean" },
  );
}

export type LiteralValue = string | number | boolean | null;

export function literalSchema<const TValue extends LiteralValue>(
  value: TValue,
): Schema<unknown, TValue> {
  return createSchema(
    (input, path) =>
      Object.is(input, value)
        ? parseSuccess(value)
        : parseFailure(
            schemaIssue(
              "invalid_literal",
              `Expected the literal ${JSON.stringify(value)}`,
              path,
            ),
          ),
    { kind: "literal", value },
  );
}

export function nullSchema(): Schema<unknown, null> {
  return literalSchema(null);
}

export function dateSchema(): Schema<unknown, Date> {
  return createSchema(
    (input, path) =>
      input instanceof Date && !Number.isNaN(input.getTime())
        ? parseSuccess(input)
        : typeFailure("valid date", input, path),
    { kind: "date" },
  );
}

export function bigintSchema(): Schema<unknown, bigint> {
  return createSchema(
    (input, path) =>
      typeof input === "bigint"
        ? parseSuccess(input)
        : typeFailure("bigint", input, path),
    { kind: "bigint" },
  );
}

export function unknownSchema(): Schema<unknown, unknown> {
  return createSchema((input) => parseSuccess(input), { kind: "unknown" });
}

export function neverSchema(): Schema<unknown, never> {
  return createSchema(
    (_input, path) =>
      parseFailure(schemaIssue("never", "No value is allowed", path)),
    { kind: "never" },
  );
}
