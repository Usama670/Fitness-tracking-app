# FITTRACK

FITTRACK is a premium, portfolio-ready fitness dashboard built with vanilla HTML, CSS, and JavaScript. It gives users a polished view of workouts, weekly goals, progress trends, recovery focus, and lifestyle stats in a clean, modern interface.

## Live Demo

This project is set up for GitHub Pages deployment.

## Features

- Responsive fitness dashboard layout
- Weekly workout goal tracking
- Workout type breakdown and activity analytics
- Progress cards for calories, duration, streaks, and averages
- Theme toggle for a cleaner dashboard experience
- Demo data persistence using localStorage
- Professional, mobile-friendly UI designed for portfolio presentation

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Chart.js
- Font Awesome

## Project Structure

- `index.html` – app shell and layout
- `styles.css` – premium dashboard styling and responsive design
- `app.js` – data model, UI rendering, and interactivity

## Run Locally

You can open the project directly in a browser or run a quick local server:

```bash
cd Fitness-tracking-app
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## GitHub Pages Setup

This repo includes a GitHub Actions workflow for deployment:

- `.github/workflows/deploy.yml`

To enable Pages in GitHub:

1. Open the repository on GitHub
2. Go to Settings -> Pages
3. Under Source, select GitHub Actions
4. Push to the `main` branch to trigger deployment

## Portfolio Notes

FITTRACK is designed to look like a realistic product dashboard that can be showcased in a developer portfolio, while staying lightweight and easy to maintain.

## License

This project is for educational and portfolio use.
