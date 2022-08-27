# Reactively

Blueberry is a lightweight library for fine grained reactive programming. It’s a clean way to add caching and smart recalculation to your app. 

```jsx
example
```

If you worry about unnecessarily repeating expensive operations (like memory allocation, network operations, storage, long computations, etc.), Blueberry might be of help.

Mark your code with @reactive and the library will automatically cache and minimize recomputation. Now you don’t have to sprinkle caches, `memoize`, and hasChanged() checks through your code.

Blueberry provides fine grained reactivity and nothing more. That makes Blueberry small and easy to mix in to existing projects.