# Reactively

Reactively is a library for fine grained reactive programming.

See [documentation](https://github.com/modderme123/reactively#readme])
for details.

This part of the library (`@reactively/lit`)
provides integration with the [Lit](lit.dev) library for web components.

Here is an [example](https://github.com/modderme123/reactively/blob/main/packages/cypress-test/component-test/ReactiveLit.cy.ts)
using Lit and @reactively together.

1. Inherit from `ReactiveLitElement` in place of `LitElement`
1. Implement `reactiveRender()` instead of `render()`.
(This enables `@reactively/lit` to track the reactive sources used while rendering, 
and to trigger re-rendering when necessary.)
1. Choose how to annotate your reactive properties:
   - `@reactiveProperty` properties are reactive and visible as lit web component properties. 
   - `@reactively` properties are reactive but not web component properties.
1. Call `stabilizeContinously()` once when you start your application,
so that all `ReactiveLitElement` instances will re-render() automatically.

