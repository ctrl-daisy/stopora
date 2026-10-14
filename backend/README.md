# Stopora Backend

The backend is a Flask (Python) app. It serves the front end pages and will handle the route calculation.

## What's in this folder

- `app.py`: the Flask app

## What it does now

- Serves `frontend/index.html` when you visit the home page (`/`)

## Planned

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Serves the main page |
| `/api/route` | POST | Receives a list of stops and returns the best order and total distance |
| `/api/routes` | GET | Returns saved routes |

## Run it

From the main project folder, with the virtual environment active:

```
python3 backend/app.py
```

The app runs at http://127.0.0.1:5000. Stop it with Ctrl + C.

## Notes

- The virtual environment (`venv`) must be active, or Flask won't be found.
- Dependencies are listed in `requirements.txt` in the main folder.