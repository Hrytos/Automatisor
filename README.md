# WareIQ — Warehouse Automation Advisor

Independent warehouse automation advisor landing page, built with Node.js + Express.

## Project Structure

```
wareiq/
├── server.js              # Express server
├── package.json
├── views/
│   └── index.html         # Main HTML page
└── public/
    ├── css/
    │   └── styles.css     # All styles + responsive breakpoints
    └── js/
        └── main.js        # Diagnostic stepper, mobile nav, interactions
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open http://localhost:3000 in your browser.

## Responsive Breakpoints

| Breakpoint    | Layout changes                                      |
|---------------|-----------------------------------------------------|
| ≤ 1024px      | Hero narrows, benchmark grid reflows to 2 columns   |
| ≤ 768px       | Single-column layout, hamburger nav activates       |
| ≤ 480px       | Stacked CTA buttons, benchmark stats go full-width  |

## Features

- Sticky navigation with mobile hamburger drawer
- Interactive diagnostic card with option selection + progress bar
- Fully responsive across all viewports (mobile → widescreen)
- Semantic HTML with ARIA roles and labels
- Smooth scroll for anchor links
- External CSS and JS (no inline styles or scripts)
