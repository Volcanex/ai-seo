# AI SEO Tool

## Setup Requirements
- adminsdk.json in backend directory
- Node.js and npm
- Python 3.11+
- Docker and docker-compose
- Apache2

## Development
```bash
# Frontend (localhost:3000)
cd frontend
npm install
npm run dev

# Backend (localhost:5000)
cd backend
python app.py
```

## Production Deployment
1. Build Frontend:
```bash
cd frontend
rm -rf .next out  # Clean old builds
npm run build     # Builds to 'out' directory
```

2. Start Backend:
```bash
cd backend
docker-compose down
docker-compose up --build -d
```
In production on the linux server use the scripts in backend/scripts

3. Apache serves:
- Frontend: Static files from /frontend/out
- Backend: Proxies /api to Docker container (port 8000)

## Common Issues
- Double check API_URL in config.ts (should be empty string or '/api')
- Clear .next and out directories before rebuilding
- Check Apache logs: `sudo tail -f /var/log/apache2/error.log`
- Check Docker logs: `docker-compose logs -f`

## Architecture
```
Development:
Frontend (3000) → Backend (8000)?

Production:
         (/api)
Client → Apache (80/443) → Static Files (Frontend)
                        → Proxy → Docker (8000) → Flask
```

## Maintenance
- SSL renewal is automatic
- Monitor logs in /var/log/apache2/
- Docker container auto-restarts
- Backend health check: gabrielpenman.com/api/health