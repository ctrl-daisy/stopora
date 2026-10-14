# Stopora Front End

The front end is the part users see and click. It is built with plain HTML, CSS and JavaScript, and is served by the Flask backend.

## What's in this folder

- `index.html`: the page structure (heading, stop form, stops list, buttons)
- `style.css`: the styling (layout, colours, buttons)
- `script.js`: the behaviour (what happens when buttons are clicked)

## What it does now

- Shows a form where the user enters a stop name, latitude and longitude
- Checks that all three fields are filled in correctly
- Adds the stop to the "Your stops" list on the page
- Clears the form so another stop can be added

## How it works

1. `script.js` finds the page elements using their `id`s (for example `stop-name` and `add-stop`).
2. When "Add stop" is clicked, it reads the typed values and validates them.
3. The stop is saved in a JavaScript list and displayed on the page.

## Planned

- [ ] Send the stops to the backend when "Find best route" is clicked
- [ ] Show the ordered route and total distance
- [ ] Saved routes page

## View it

Start the backend (see the main README), then open http://127.0.0.1:5000. After editing a front end file, save it and refresh the browser (Ctrl + Shift + R).