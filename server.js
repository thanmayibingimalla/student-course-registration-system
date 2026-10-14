
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "student_course_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper for error responses
function handleError(res, error, message) {
    console.error(message + ":", error.message);
    res.status(500).json({
        success: false,
        message: message
    });
}

// ==========================================
// 1. DATABASE STATUS
// ==========================================
app.get("/api/status", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            success: true,
            message: "Server and database connected successfully"
        });
    } catch (error) {
        handleError(res, error, "Database connection failed");
    }
});

// ==========================================
// 2. GET ALL STUDENTS
// ==========================================
app.get("/api/students", async (req, res) => {
    try {
        const [students] = await pool.query(`
            SELECT
                id,
                id AS student_id,
                student_name,
                student_name AS name,
                email,
                department,
                department AS branch,
                semester
            FROM students
            ORDER BY student_name
        `);

        res.json(students);
    } catch (error) {
        handleError(res, error, "Unable to fetch students");
    }
});

// ==========================================
// 3. ADD STUDENT
// ==========================================
app.post("/api/students", async (req, res) => {
    try {
        const student_name = req.body.student_name || req.body.name;
        const { email, department, branch, semester } = req.body;
        const studentDepartment = department || branch || null;

        if (!student_name || !email) {
            return res.status(400).json({
                message: "Student name and email are required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO students
                (student_name, email, department, semester)
                VALUES (?, ?, ?, ?)`,
            [
                student_name,
                email,
                studentDepartment,
                semester || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Student added successfully",
            id: result.insertId,
            student_id: result.insertId
        });
    } catch (error) {
        handleError(res, error, "Unable to add student");
    }
});

// ==========================================
// 4. UPDATE STUDENT
// ==========================================
app.put("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const student_name = req.body.student_name || req.body.name;
        const { email, department, branch, semester } = req.body;
        const studentDepartment = department || branch || null;

        if (!student_name || !email) {
            return res.status(400).json({
                message: "Student name and email are required"
            });
        }

        const [result] = await pool.query(
            `UPDATE students
             SET student_name = ?,
                 email = ?,
                 department = ?,
                 semester = ?
             WHERE id = ?`,
            [
                student_name,
                email,
                studentDepartment,
                semester || null,
                studentId
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                "SELECT id FROM students WHERE id = ?",
                [studentId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Student updated successfully"
        });
    } catch (error) {
        handleError(res, error, "Unable to update student");
    }
});

// ==========================================
// 5. DELETE STUDENT
// ==========================================
app.delete("/api/students/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM students WHERE id = ?",
            [studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student deleted successfully"
        });
    } catch (error) {
        handleError(
            res,
            error,
            "Unable to delete student. Check whether registrations reference this student."
        );
    }
});

// ==========================================
// 6. GET ALL COURSES
// ==========================================
app.get("/api/courses", async (req, res) => {
    try {
        const [courses] = await pool.query(`
            SELECT
                id,
                id AS course_id,
                course_code,
                course_name,
                department,
                semester,
                credits
            FROM courses
            ORDER BY semester, course_code
        `);

        res.json(courses);
    } catch (error) {
        handleError(res, error, "Unable to fetch courses");
    }
});

// ==========================================
// 7. ADD COURSE
// ==========================================
app.post("/api/courses", async (req, res) => {
    try {
        const {
            course_code,
            course_name,
            department,
            semester,
            credits
        } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({
                message: "Course code and course name are required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO courses
                (course_code, course_name, department, semester, credits)
             VALUES (?, ?, ?, ?, ?)`,
            [
                course_code,
                course_name,
                department || null,
                semester || null,
                credits || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Course added successfully",
            id: result.insertId,
            course_id: result.insertId
        });
    } catch (error) {
        handleError(res, error, "Unable to add course");
    }
});

// ==========================================
// 8. UPDATE COURSE
// ==========================================
app.put("/api/courses/:id", async (req, res) => {
    try {
        const courseId = req.params.id;
        const {
            course_code,
            course_name,
            department,
            semester,
            credits
        } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({
                message: "Course code and course name are required"
            });
        }

        const [result] = await pool.query(
            `UPDATE courses
             SET course_code = ?,
                 course_name = ?,
                 department = ?,
                 semester = ?,
                 credits = ?
             WHERE id = ?`,
            [
                course_code,
                course_name,
                department || null,
                semester || null,
                credits || null,
                courseId
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                "SELECT id FROM courses WHERE id = ?",
                [courseId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: "Course not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Course updated successfully"
        });
    } catch (error) {
        handleError(res, error, "Unable to update course");
    }
});

// ==========================================
// 9. DELETE COURSE
// ==========================================
app.delete("/api/courses/:id", async (req, res) => {
    try {
        const courseId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM courses WHERE id = ?",
            [courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        handleError(
            res,
            error,
            "Unable to delete course. Check whether registrations reference this course."
        );
    }
});

// ==========================================
// 10. GET ALL REGISTRATIONS
// ==========================================
app.get("/api/registrations", async (req, res) => {
    try {
        const [registrations] = await pool.query(`
            SELECT
                r.id,
                r.id AS registration_id,
                r.student_id,
                r.course_id,
                r.registration_date,
                s.student_name,
                s.student_name AS name,
                s.email,
                c.course_code,
                c.course_name,
                c.credits,
                c.department,
                c.semester
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            ORDER BY r.registration_date DESC
        `);

        res.json(registrations);
    } catch (error) {
        handleError(res, error, "Unable to fetch registrations");
    }
});

// ==========================================
// 11. REGISTER STUDENT FOR A COURSE
// ==========================================
app.post("/api/registrations", async (req, res) => {
    try {
        const { student_id, course_id } = req.body;

        if (!student_id || !course_id) {
            return res.status(400).json({
                message: "Student ID and course ID are required"
            });
        }

        const [students] = await pool.query(
            "SELECT id FROM students WHERE id = ?",
            [student_id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const [courses] = await pool.query(
            "SELECT id FROM courses WHERE id = ?",
            [course_id]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        const [existing] = await pool.query(
            `SELECT id FROM registrations
             WHERE student_id = ? AND course_id = ?`,
            [student_id, course_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "This student is already registered for this course"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO registrations (student_id, course_id)
             VALUES (?, ?)`,
            [student_id, course_id]
        );

        res.status(201).json({
            success: true,
            message: "Course registration successful",
            id: result.insertId,
            registration_id: result.insertId
        });
    } catch (error) {
        handleError(res, error, "Unable to register student");
    }
});

// ==========================================
// 12. DELETE REGISTRATION
// ==========================================
app.delete("/api/registrations/:id", async (req, res) => {
    try {
        const registrationId = req.params.id;

        const [result] = await pool.query(
            "DELETE FROM registrations WHERE id = ?",
            [registrationId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        res.json({
            success: true,
            message: "Registration deleted successfully"
        });
    } catch (error) {
        handleError(res, error, "Unable to delete registration");
    }
});

// ==========================================
// 13. DASHBOARD COUNTS
// ==========================================
app.get("/api/dashboard", async (req, res) => {
    try {
        const [[studentCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM students"
        );

        const [[courseCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM courses"
        );

        const [[registrationCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM registrations"
        );

        res.json({
            totalStudents: studentCount.total,
            totalCourses: courseCount.total,
            totalRegistrations: registrationCount.total
        });
    } catch (error) {
        handleError(res, error, "Unable to load dashboard");
    }
});

// ==========================================
// 14. HOME PAGE
// ==========================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

// ==========================================
// 15. START SERVER
// ==========================================
async function startServer() {
    try {
        const connection = await pool.getConnection();
        console.log("MySQL database connected successfully");
        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        console.error("Check your .env file and MySQL settings.");
    }
}

startServer();
