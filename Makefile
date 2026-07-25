.PHONY: build up down logs clean dev-client dev-server

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean everything including volumes
clean:
	docker-compose down -v
	docker system prune -f

# Development - Frontend only
dev-client:
	cd client && npm run dev

# Development - Backend only
dev-server:
	cd server && go run cmd/server/main.go

# Full development (requires Redis running)
dev-full: dev-server dev-client

# Run tests
test:
	cd server && go test ./...

# Format code
format:
	cd server && go fmt ./...
	cd client && npm run lint -- --fix
