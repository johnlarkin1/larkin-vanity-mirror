.PHONY: favicons dev build lint

# Generate favicons from original.png
favicons:
	node scripts/generate-favicons.mjs

# Development server
dev:
	pnpm dev

# Production build
build:
	pnpm build

# Lint
lint:
	pnpm lint
