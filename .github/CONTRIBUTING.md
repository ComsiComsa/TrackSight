# Contributing to TrackSight

Thanks for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`bun run test`)
5. Run build (`bun run build`)
6. Commit and push
7. Open a Pull Request against `main`

## Development Setup

```bash
bun install
bun run dev    # watch mode
bun run build  # production build
bun run test   # run tests
```

## Adding a New Tracker Parser

1. Create `src/parsers/yourtracker.ts` following the `ITrackerParser` interface
2. Register it in `src/parsers/registry.ts`
3. Add the type, color, and name to `src/types/events.ts`
4. Add a test in `tests/registry.test.ts`

## Guidelines

- Test the public interface, not implementation details
- Keep files under 500 lines
- Run `bun run test` before submitting
- One feature per PR
