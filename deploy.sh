# Production deployment script

# Frontend build
echo "Building frontend..."
npm install
npm run build:prod

# Backend setup
echo "Setting up backend..."
python -m pip install -r requirements.txt

# Start services
echo "Starting services..."
python ./backend/production.py
