# FitSync

**Meta University Engineering Capstone Project**  
Intern: Jason Chimdinma Jason  
Intern Manager: Ameya Gawde  
Intern Director: Clare Yip  
Peer(s): Adam Chappell, Ishan Balar  

PROJECT PLAN: [Project Plan Link](https://docs.google.com/document/d/1yJAaHYRjUmNfyMlAP3B_knjqcTrbnj4WAi232rQQ_CU/edit?usp=sharing)

---

## Overview

FitSync is a personal fitness tracker that helps users log meals and workouts, view calorie intake and burn progress, and stay consistent with their fitness goals. It simplifies nutrition and exercise tracking by integrating trusted APIs, chart visualizations, and a beginner-friendly UI.

- Category: Health & Fitness  
- Story: Users sign up, log meals and workouts, track daily and weekly progress, and optionally receive AI-generated insights or reminders.  
- Market: College students, young professionals, and anyone seeking a lightweight alternative to premium fitness apps.  
- Habit: Used daily or multiple times per day for logging and checking progress.  
- Scope: MVP includes auth, meal/workout logging, summaries, and charts. Stretch features include AI, goals, dark mode, and export options.

---

## Product Spec

### Required (MVP)

- User can create an account (sign up)  
- User can log in and stay authenticated  
- User can search for foods using real nutrition data  
- User can log a meal with quantity and type  
- User can log a workout with duration and intensity  
- User can view calories in/out and net value for the day  
- User can view weekly progress in charts  
- User can edit or delete past meals/workouts  

### Optional / Stretch

- Chat with AI assistant (Gemini API) for personalized coaching  
- Set weekly calorie/workout goals and track progress  
- Export logs as PDF/CSV for coaches or doctors  
- Receive email reminders to log meals/workouts  
- Customize profile with photo and personal goals  
- Themed dashboard visuals, hover effects, and responsive loading states  

---

## User Stories

- As a user, I want to sign up with my email and password to access my tracker.  
- As a user, I want to stay logged in across sessions.  
- As a user, I want to search foods with real nutrition data to track what I eat.  
- As a user, I want to log meals with quantity and type to view my intake.  
- As a user, I want to log workouts with duration/intensity to track calories burned.  
- As a user, I want to view today’s calories in/out and net value.  
- As a user, I want to view weekly intake/burn progress in charts.  
- As a user, I want to view and edit past logs for accuracy.  
- (Stretch) As a user, I want personalized advice via AI assistant.  
- (Stretch) As a user, I want to set and track calorie/workout goals.

---

## Screen Archetypes

- Landing Page (stretch)  
- Login Page  
- Sign Up Page  
- Dashboard / Home – Summary, charts, optional AI  
- Meal Log Page – Search, log, and view meals  
- Workout Log Page – Input, log, and view workouts  
- Profile Page – Personal info, progress summary, goal settings  

---

## Data Model

### users
| Field          | Type     |
|----------------|----------|
| id             | integer (Primary Key) |
| email          | text     |
| password_hash  | text     |
| created_at     | date     |

### meals
| Field         | Type     |
|---------------|----------|
| id            | integer (Primary Key) |
| user_id       | integer (Foreign Key) |
| food_name     | text     |
| calories      | float    |
| protein       | float    |
| carbs         | float    |
| fat           | float    |
| quantity      | float    |
| meal_type     | text     |
| date          | date     |

### workouts
| Field            | Type     |
|------------------|----------|
| id               | integer (Primary Key) |
| user_id          | integer (Foreign Key) |
| workout_type     | text     |
| duration_minutes | float    |
| intensity        | text     |
| calories_burned  | float    |
| date             | date     |

### goals (stretch)
| Field               | Type     |
|---------------------|----------|
| id                  | integer (Primary Key) |
| user_id             | integer (Foreign Key) |
| weekly_calorie_goal | integer  |
| weekly_burn_goal    | integer  |

---

## Server Endpoints

| Method | Endpoint           | Description                         |
|--------|--------------------|-------------------------------------|
| POST   | /auth/register     | Create a new user                   |
| POST   | /auth/login        | Authenticate and return token       |
| GET    | /meals             | Fetch user’s meals                  |
| POST   | /meals             | Add a new meal log                  |
| PUT    | /meals/:id         | Edit an existing meal               |
| DELETE | /meals/:id         | Delete a meal                       |
| GET    | /workouts          | Fetch workout logs                  |
| POST   | /workouts          | Add a new workout                   |
| PUT    | /workouts/:id      | Edit a workout                      |
| DELETE | /workouts/:id      | Delete a workout                    |
| GET    | /summary/today     | Daily calorie summary               |
| GET    | /summary/weekly    | Weekly chart data                   |
| GET    | /profile           | Fetch user info and progress        |
| POST   | /goals (stretch)   | Set user goals                      |
| GET    | /goals (stretch)   | Retrieve current goals              |

---

## Project Requirements

- Full-stack app with React + Express + PostgreSQL  
- User authentication and route protection  
- RESTful API and state management  
- Relational data model with user logs  
- Clean, responsive, and styled frontend  
- Render deployment (frontend + backend)  
- Source control with GitHub  

---

## Database Integration

- Primary: PostgreSQL  
- ORM: Prisma  
- Alternatives: Sequelize, Knex.js if needed

---

## External APIs

- Nutritionix API – For food search and nutrition data  
- (Optional) Gemini/OpenAI API – For AI chat assistant features  

---

## Authentication

- JWT tokens stored in HTTP-only cookies  
- Auth middleware for protected endpoints  
- React Context to manage frontend auth state  
- Auth routes: `/auth/register`, `/auth/login`, `/logout`  

---

## Visuals and Interactions

- Hover effects on charts and dashboard elements  
- Custom UI components for calorie summaries and progress  
- Loading states with spinners or skeleton components  

---

## Timeline

| Week   | Deliverables                                       |
|--------|----------------------------------------------------|
| Week 4 | Project plan, data model, screen designs           |
| Week 5 | Auth setup, database schema, start meal logging    |
| Week 6 | Workout logging, summary views, profile page       |
| Week 7 | Charts, edit/delete, polish UI                     |
| Week 8 | Finalize MVP, stretch features, fix bugs           |
| Week 9 | Final deployment, documentation, showcase prep     |

---

Built during the Meta University Engineering Internship, Summer 2025.
