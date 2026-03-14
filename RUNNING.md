# Run NextGen (Simple)

## One-time setup

From workspace root (`D:\\NextGen`):

```powershell
npm install
npm run setup
```

## Run both backend + frontend

```powershell
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Run only backend

```powershell
npm run backend
```

## Run only frontend

```powershell
npm run frontend
```

## Notes

- If `server/.env` does not exist, it is created automatically with development defaults.
- You can edit `server/.env` later to set your own `JWT_SECRET` and `PORT`.
