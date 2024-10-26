
npm install 

cd frontend
npm run dev

cd backend
python app.py

Backend needs adminsdk.json 

.env stores a var for the api url, delete this or change it /api before building for production

Frontend: 

Development                     Production
Frontend → localhost:5000       Frontend → /api

Backend: 

Client → Apache (Port 80) → Proxy Module → Docker (Internal Port 8000?) → Python App

cd backend then run: 
docker compose down
docker compose up --build

it'll run on port 8000

Internet → Port 80 → Apache → Proxy to Docker (8000)
                       ↳ Serves static frontend files