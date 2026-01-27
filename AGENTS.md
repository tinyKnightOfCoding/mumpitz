# Instructions

## Typescript classes

- All classes must support destruction.
  - For methods use `readonly myMethod = () => {...}`

## Testing

- Use test instead of it
- Use a single top level describe per test file and avoid further nesting
- Write test names in subjectless third person
- Mock only what is truly necessary. Excessive mocking reduces confidence and often signals design issues
- Keep tests short, focused, and easy to read
- Place tests close to the code they verify
- Do not test trivial getters, setters, or framework behavior. Keep assertions narrow and precise
- Do not assume all tests should pass. Question green tests and consider whether they hide a real bug
- Use vi.mock only for IO or external boundaries and prefer vi.spyOn for internal seams
- Clean up spies in afterEach with vi.restoreAllMocks()
- Use fake timers only when needed and always return to real timers
- Prefer test.each for input/output style units and avoid snapshots for non-UI logic