# `@lucid-softworks/schema-primitives`

Primitive schemas for strings, numbers, booleans, literals, null, dates,
bigints, unknown values, and impossible values.

```ts
import {
  literalSchema,
  numberSchema,
  stringSchema,
} from "@lucid-softworks/schema-primitives";

const username = stringSchema({ minLength: 3, maxLength: 30 });
const status = literalSchema("ready");
const port = numberSchema({ integer: true, minimum: 1, maximum: 65_535 });
```

Numbers are finite by default. Regular-expression state is not mutated while
parsing, and literal output types remain narrow.
