# Reactively

Reactively is a library for fine grained reactive programming.

See [documentation](https://github.com/modderme123/reactively#readme])
for details.

This part of the library (`@reactively/lit`)
provides integration with the [Lit](lit.dev) library for web components.

Here is an [example](https://github.com/modderme123/reactively/blob/main/packages/cypress-test/component-test/ReactiveLitTest1.tsx) using Lit and @reactively together.

1. Inherit from `ReactiveLitElement` in place of `LitElement`
2. Choose how to annotate your properties:
   - `@reactiveProperty` properties are visible to lit and @reatively.
   - `@reactive` properties are visible to @reactively only.
   - `@property` properties are visible to lit only.
