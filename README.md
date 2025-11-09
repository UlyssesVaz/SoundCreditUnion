SoundCreditUnion

A web + backend application built to serve credit-union style goals, AI-driven recommendations, and product catalog functionalities.

Features

User authentication and management (login, registration, JWT refresh)

User goals creation, tracking, and impact analysis

AI-powered recommendations module

Product catalog management

Backend built with FastAPI (Python) and SQLAlchemy for models

Containerised deployment via Docker and Docker Compose

Environment-variable driven configuration (see .env.example)

Scripts for database initialization & seeding

Getting Started
Prerequisites

Docker & Docker Compose installed

Git installed

(Optional) Python environment if running locally without containers

Quick Setup

Clone the repository

git clone https://github.com/UlyssesVaz/SoundCreditUnion.git
cd SoundCreditUnion/soundcu-backend


Copy .env.example to .env and fill in your variables (database credentials, JWT secret, etc.)

Build and start the services via Docker Compose

docker-compose up --build


Run database initialization / seed script

docker exec -it <backend_container_name> python scripts/init_db.py


Access the API (e.g., at http://localhost:8000) and use the routers for authentication, goals, products, etc.

Development

The backend supports live reloading: code changes in app/routers/… will be picked up without rebuilding the image (assuming you’re using a volume mount).

If you change dependencies (i.e., requirements.txt), update the Dockerfile and run docker-compose up --build.

For tests, run the test_api.sh script or integrate with your CI pipeline.

Architecture Overview

Routers: Define HTTP endpoints for auth, users, goals, products, recommendations

Models & Schemas: SQLAlchemy + Pydantic to enforce type safety and serialization

Auth Module: Handles JWT creation, refresh, password hashing

Dependencies: Shared dependencies like database session, current user retrieval

Scripts: Utility for setting up the database schema and seeding with initial data

Containerisation: Backend + PostgreSQL spun up through Docker Compose

Contributing

Fork the repository

Create a feature branch: git checkout -b feature/YourFeature

Commit your changes: git commit -m "Add some feature"

Push to the branch: git push origin feature/YourFeature

Open a Pull Request for review

Please ensure your code follows the project style guidelines, and include tests for new features.

Future Work / Roadmap

Frontend integration (Reflected in the frontend/ directory)

Enhanced recommendation engine (machine learning)

Admin dashboard for product / goal management

Analytics and reporting of user goal progression

Multi-tenant support for multiple credit-unions

License

Specify your license here (e.g., MIT, Apache 2.0).
