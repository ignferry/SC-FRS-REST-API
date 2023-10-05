const dotenv = require("dotenv");
dotenv.config();

// Express Setup
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Postgres Setup
const { Client } = require('pg');
const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});
client.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// Setup endpoints

// Check class availability
const selectClassQuery = "SELECT class_name, max_students FROM class WHERE class_id = $1";
const findNumberOfStudentsQuery = "SELECT COUNT(*)::int AS total_students FROM class_students WHERE class_id = $1";
app.get("/class/:classId", async (req, res) => {
    console.log("GET /class/:classId");

    let classId = req.params.classId;

    let selectClassRes = await client.query(selectClassQuery, [classId]);
    let classAttributes = selectClassRes.rows[0];

    let numberOfStudentsRes = await client.query(findNumberOfStudentsQuery, [classId]);
    let totalStudents = numberOfStudentsRes.rows[0].total_students;

    res.status(200).json(
        {
            class_id: classId,
            class_name: classAttributes.class_name,
            total_students: totalStudents,
            max_students: classAttributes.max_students
        }
    );
});

// Register student to class
const insertClassParticipantQuery = "INSERT INTO class_students(class_id, nim) VALUES($1, $2)"
app.post("/class/register", async (req, res) => {
    console.log("POST /class/register");

    let nim = req.body.nim;
    let classId = req.body.class_id;
    let className = req.body.class_name;

    await client.query(insertClassParticipantQuery, [classId, nim]);

    res.status(200).json(
        {
            output_message: `You have been successfully enrolled to ${classId} ${className}.`
        }
    )
});

// Set class full Message
app.get("/message/class/full", (req, res) => {
    console.log("GET /message/class/full");

    let classId = req.query.class_id;
    let className = req.query.class_name;

    res.status(200).json(
        {
            output_message: `Registration failed. Class ${classId} ${className} is full.`
        }
    )
});

// Set timeout message
app.get("/message/class/timeout", (req, res) => {
    console.log("GET /message/class/timeout");

    res.status(200).json(
        {
            output_message: "Registration failed. Maximum processing time reached."
        }
    )
});

app.listen(PORT, () => {
    console.log("FRS REST API Server running at port " + PORT);
});
