# Instructions

## Typescript classes

- All classes must support destruction.
  - For methods use `readonly myMethod = () => {...}`

## Testing

- Use `test` instead of `it`
- Use a top-level `describe` do not nest further
- Use test names in subjectless third person view
- Only mock what is really necessary. A lot of mocks reduce confidence and are a sign of bad design
- Keep tests short and readable
- Keep tests in the same location as the test subject
- TODO Something about not testing every getter, setter, etc. keep expects narrow / precise
- TODO Do not make every test green. Consider if there is a bug