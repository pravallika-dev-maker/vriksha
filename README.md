# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



Add a Project Details page that opens when a project card is clicked.

Data Sources (Google Sheets – live data only):
Projects_Deals:
https://opensheet.elk.sh/1aqZD7MbMN_EJwnjVP6bBsXvt4NB0AN_Hk4LdNXFARP0/Projects_Deals

Resources:
https://opensheet.elk.sh/1aqZD7MbMN_EJwnjVP6bBsXvt4NB0AN_Hk4LdNXFARP0/Resources

Stage_Master:
https://opensheet.elk.sh/1aqZD7MbMN_EJwnjVP6bBsXvt4NB0AN_Hk4LdNXFARP0/Stage_Master

--------------------------------
CLICK & PAGE BEHAVIOR
--------------------------------

1) On project card click:
- Navigate to a new page / route
- Pass record_id of the clicked project

2) Fetch data dynamically:
- From Projects_Deals → get full project details using record_id
- From Resources → get team members where assigned_record_id = record_id
- From Stage_Master → get ordered stages for progress bar

--------------------------------
PAGE LAYOUT (ATTRACTIVE & CLEAN)
--------------------------------

TOP SECTION:
- Project / Client Name (title)
- Project Owner Name (clearly highlighted)
- Current Stage (status badge)
- Potential Amount (deal_value, formatted currency)

--------------------------------
PROGRESS BAR (VERY IMPORTANT)
--------------------------------

Display a horizontal progress bar at the top showing project journey.

Stages (ordered using Stage_Master):
- Negotiation (Project)
- Project Started
- Execution In Progress
- Revenue / Billing
- Account Active / Renewal

For each stage:
- Show stage name
- Show start date and end date (if available)
- Color coding:
  - Completed stages → green
  - Current stage → blue
  - Future stages → grey

Dates must come from:
- negotiation_completed_date
- project_started_date
- billing_completed_date
(and current stage inferred from current_stage_name)

--------------------------------
PROJECT DETAILS SECTION
--------------------------------

Show detailed information:
- Start date
- Current stage
- Next stage
- Next stage expected date
- Deal status
- Execution status

--------------------------------
RESOURCES / TEAM SECTION
--------------------------------

Display a list or grid of people working on this project:
- Resource name
- Role
- Assigned project

Do NOT show team count only — show full list.

--------------------------------
UI / UX GUIDELINES
--------------------------------

- Modern SaaS-style layout
- Clear visual hierarchy
- Cards, soft shadows, rounded corners
- Progress bar must stand out visually
- Responsive (desktop first)

--------------------------------
TECHNICAL RULES
--------------------------------

- React functional components
- useParams for record_id
- useEffect for data fetching
- No hardcoded data
- Read-only page
- No backend yet

--------------------------------
OUTPUT EXPECTATION
--------------------------------

Provide:
- ProjectDetails component
- ProgressBar component
- API service functions
- Basic CSS or Tailwind styles
- Clear comments explaining logic

This page should feel like a real enterprise project-tracking screen suitable for management.
uvicorn backend.app.main:app --reload