#!/bin/bash

# Sound CU Backend - Quick Setup Script

set -e

echo "🚀 Sound CU Co-Pilot Backend Setup"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please add your OPENAI_API_KEY to .env file for AI recommendations"
    echo "   You can add it now or skip and use rules-based recommendations only"
    echo ""
    read -p "Do you want to add your OpenAI API key now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " api_key
        # Update .env file with API key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env
        else
            sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env
        fi
        echo "✅ API key added to .env"
    fi
    echo ""
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy (30 seconds)..."
sleep 30

# Initialize database
echo ""
echo "🌱 Initializing database with seed data..."
docker-compose exec -T backend python scripts/init_db.py

echo ""
echo "=================================="
echo "✨ Setup Complete! ✨"
echo "=================================="
echo ""
echo "🌐 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/v1/docs"
echo ""
echo "👥 Test Users (all passwords: password123):"
echo "   • sarah@example.com - Young Professional"
echo "   • marcus@example.com - High Earner"
echo "   • jamie@example.com - Budget-Conscious Parent"
echo ""
echo "🧪 Test the API:"
echo "   curl http://localhost:8000/v1/health"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f backend"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
