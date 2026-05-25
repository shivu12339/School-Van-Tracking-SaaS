.PHONY: install dev build lint test setup docker-up docker-down

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

setup:
	pnpm setup

docker-up:
	pnpm docker:up

docker-down:
	pnpm docker:down
