.PHONY: help setup start stop restart logs shell db-init db-reset test clean

help:
	@echo "Sound CU Co-Pilot Backend - Available Commands"
	@echo "==============================================="
	@echo ""
	@echo "  make setup      - Initial setup (copy .env, start services, init DB)"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View backend logs"
	@echo "  make shell      - Open backend shell"
	@echo "  make db-init    - Initialize database with seed data"
	@echo "  make db-reset   - Reset database (WARNING: deletes all data)"
	@echo "  make test       - Run API tests"
	@echo "  make clean      - Stop services and remove volumes"
	@echo ""

setup:
	@./setup.sh

start:
	@echo "🚀 Starting services..."
	@docker-compose up -d
	@echo "✅ Services started"
	@echo "   API: http://localhost:8000"
	@echo "   Docs: http://localhost:8000/v1/docs"

stop:
	@echo "🛑 Stopping services..."
	@docker-compose down
	@echo "✅ Services stopped"

restart:
	@echo "🔄 Restarting services..."
	@docker-compose restart
	@echo "✅ Services restarted"

logs:
	@docker-compose logs -f backend

shell:
	@docker-compose exec backend /bin/bash

db-init:
	@echo "🌱 Initializing database..."
	@docker-compose exec backend python scripts/init_db.py
	@echo "✅ Database initialized"

db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? (y/n) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "🗑️  Resetting database..."; \
		docker-compose down -v; \
		docker-compose up -d; \
		sleep 10; \
		docker-compose exec backend python scripts/init_db.py; \
		echo "✅ Database reset complete"; \
	fi

test:
	@./test_api.sh

clean:
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@echo "✅ Cleanup complete"
