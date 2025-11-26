# EMS Frontend

React + Vite frontend for the Employee Management System (EMS).

## Requirements

- Node.js v16+ (recommended).  
- npm (comes with Node).
- The backend API running and accessible (default `http://localhost:5001/api`).

## Setup

1. Clone / copy the repository and go to frontend folder:
cd ems-frontend

2. Install dependencies:

npm install

3. Create environment file (optional). By default the frontend will call http://localhost:5001/api. To change it create a .env file at project root:

VITE_API_BASE_URL=http://localhost:5001/api

4. Start dev server:

npm run dev
