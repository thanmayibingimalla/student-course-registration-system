# CampusLoop — Student Course Registration System

A mini project for managing college courses and student registrations. It uses **HTML, CSS, vanilla JavaScript, Node.js, Express, and MySQL**.

## Features

- Browse all courses offered by the college.
- Search courses by name, code, or department.
- Filter by semester and department.
- Register a student for a course using dropdowns.
- Prevent duplicate registration for the same student and course.
- View registration records for one student or all students.
- Admin can add, edit, and delete courses.
- Add sample students and courses with the SQL setup file.
- Responsive layout with a plum, peach, mint, and warm-neutral visual theme.

## Project structure

```text
student-course-registration-system/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── database.sql
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Requirements

Install these on your computer:
1. **Node.js** (LTS version)
2. **MySQL Server** and MySQL Workbench (or another MySQL client)
3. VS Code (recommended)

## Setup instructions (Windows)

### Step 1 — Create the database

1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database.sql` from this project folder.
3. Click the lightning bolt **Execute** button.
4. Refresh the Schemas list. You should see `student_course_db` with the `students`, `courses`, and `registrations` tables.

The SQL file creates the database, tables, foreign keys, a duplicate-registration rule, and sample records.

### Step 2 — Configure the database password

1. In VS Code, open this project folder.
2. Copy `.env.example` and rename the copy to `.env` (make sure the filename is exactly `.env`, not `.env.txt`).
3. Open `.env` and enter your MySQL details. For example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=student_course_db
PORT=3000
```

Replace `your_actual_mysql_password` with the password you use to connect to MySQL. If your MySQL root account has no password, leave `DB_PASSWORD=` blank.

### Step 3 — Install packages

In VS Code, open **Terminal → New Terminal** and make sure the terminal is in this project folder. Run:

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use **Command Prompt** as your VS Code terminal, or run `npm.cmd install` in PowerShell. You do not need to change your system execution policy.

### Step 4 — Start the app

```bash
npm start
```

When the terminal says `Student Course Registration System running at http://localhost:3000`, open this address in your browser:

`http://localhost:3000`

Keep the terminal open while using the app. To stop the server, press `Ctrl + C`.

### Step 5 — Try the features

- **Course catalogue:** search and filter the sample courses.
- **Register for a course:** choose a sample student and course, then confirm.
- **Registration records:** see all registrations or filter by student.
- **Course administration:** add a course, use Edit to update it, or Delete to remove it.
- To test a new student, add a row to the `students` table in MySQL Workbench. The app includes a `POST /api/students` endpoint, but no student-management screen.

## Sample student profiles

- Aarav Sharma — `CSE24001`
- Mira Reddy — `CSE24002`
- Ishaan Kumar — `ECE24001`

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/students` | List students |
| POST | `/api/students` | Add a student |
| GET | `/api/courses` | List courses |
| POST | `/api/courses` | Add a course |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |
| POST | `/api/registrations` | Register a student for a course |
| GET | `/api/registrations` | List all registrations |
| GET | `/api/registrations?student_id=1` | List registrations for one student |

## Database design

- `students.student_id` is the primary key.
- `courses.course_id` is the primary key.
- `registrations.registration_id` is the primary key.
- `registrations.student_id` references `students.student_id`.
- `registrations.course_id` references `courses.course_id`.
- A unique constraint on `(student_id, course_id)` prevents duplicate course registration.

## Notes

- Course photos and Google Fonts use external URLs, so those visual assets require an internet connection. The core app runs locally, but the remote images/fonts may not load offline.
- This is an educational mini project. The “Course administration” view is not protected by a login, so do not deploy it publicly as-is.
- If port 3000 is already in use, change `PORT=3001` in `.env` and open `http://localhost:3001`.
