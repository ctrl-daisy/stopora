
# Stopora 🚚

Stopora helps delivery riders and dispatchers plan the smartest order to visit their delivery stops, so they save time and fuel.

## The problem

A dispatcher with several deliveries (for example, six locations) has to decide which order to visit them in. A poor order means extra distance, extra fuel, and slower deliveries. Stopora works out a better order for them.

## How it works

1. The user adds their delivery stops (a name plus coordinates).
2. The stops are sent to the backend.
3. The backend calculates the best order to visit them and the total distance.
4. The result is shown to the user.

## Features

- [x] Flask backend serves the web page
- [x] "Add a delivery stop" form
- [x] Added stops appear in a list
- [ ] "Find best route" connected to the backend
- [ ] Route calculation (best order and total distance)
- [ ] Result page showing the ordered route and distance saved
- [ ] Saved routes (database)

## Tech stack

- **Front end:** HTML, CSS, JavaScript
- **Back end:** Python with Flask
- **Database:** SQLite (planned)

## Project structure

```
Stopora/
├── backend/     Flask app (Python)
├── frontend/    Web pages (HTML, CSS, JavaScript)
├── requirements.txt
└── README.md
```

## Getting started

1. Clone the repository:
```
   git clone https://github.com/[your-username]/stopora.git
   cd stopora
```
2. Create and activate a virtual environment:
```
   python3 -m venv venv
   source venv/bin/activate
```
3. Install the dependencies:
```
   pip install -r requirements.txt
```
4. Start the server:
```
   python3 backend/app.py
```
5. Open http://127.0.0.1:5000 in your browser.

## Route calculation (planned approach)

For a small number of stops, the backend will try every possible visiting order, measure the total straight-line distance for each, and pick the shortest one. This is a simple version of a classic problem called the Travelling Salesman Problem.

