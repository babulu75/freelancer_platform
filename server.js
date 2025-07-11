// MultipleFiles/server.js
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer"); // Import multer
const app = express();
const PORT = 3000;
require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// Serve uploaded files statically from a new 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // NEW LINE

const db = new sqlite3.Database("./freelancer_platform.db", (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create an 'uploads' directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true }); // Ensure directory exists
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage }); // Initialize multer with storage

// ======================== AUTH =========================
app.post("/signup-employer", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  db.get(
    "SELECT * FROM signup_employer WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result)
        return res.status(400).json({ error: "Email already exists" });

      db.run(
        "INSERT INTO signup_employer(name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        function (err) {
          if (err) return res.status(500).json({ error: "Insert error" });
          res.status(201).json({ message: "Signup successful" });
        }
      );
    }
  );
});

app.post("/signup-freelancer", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  db.get(
    "SELECT * FROM signup_freelancer WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result)
        return res.status(400).json({ error: "Email already exists" });

      db.run(
        "INSERT INTO signup_freelancer(name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        function (err) {
          if (err) return res.status(500).json({ error: "Insert error" });
          res.status(201).json({ message: "Signup successful" });
        }
      );
    }
  );
});

app.post("/loginFreelancer", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  db.get(
    "SELECT * FROM signup_freelancer WHERE email = ?",
    [email],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!user)
        return res.status(404).json({ message: "User  not found" });
      if (user.password === password)
        res.status(200).json({ message: "Login success", data: user });
      else res.status(401).json({ message: "Invalid password" });
    }
  );
});

app.post("/login-employer", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  db.get(
    "SELECT * FROM signup_employer WHERE email = ?",
    [email],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!user)
        return res.status(404).json({ error: "User  not found" });
      if (user.password === password)
        res.status(200).json({ message: "Login success", data: user });
      else res.status(401).json({ error: "Invalid password" });
    }
  );
});

// =================== POST A JOB ======================
app.put("/addpost", (req, res) => {
  const { title, description, skills, money, date, employerId } = req.body;
  if (!title || !description || !employerId)
    return res.status(400).json({ error: "Missing fields" });

  db.get(
    "SELECT id FROM signup_employer WHERE id = ?",
    [employerId],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!result)
        return res.status(400).json({ error: "Employer not found" });

      db.run(
        "INSERT INTO posts (employer_id, title, description, skills, money, posted_date) VALUES (?, ?, ?, ?, ?, ?)",
        [employerId, title, description, skills, money, date],
        function (err) {
          if (err) return res.status(500).json({ error: "Insert error" });
          res.status(201).json({ message: "Post added" });
        }
      );
    }
  );
});

// =================== FREELANCER PROFILE ======================
app.put("/updateDetails", (req, res) => {
  const {
    phoneNumber,
    location,
    skills,
    experience,
    portfolio,
    glink,
    availablity,
    rate,
    freelancerId
  } = req.body;

  if (!freelancerId) {
    return res.status(400).json({ error: "Freelancer ID is required" });
  }

  db.get(
    "SELECT * FROM freelancer_profiles WHERE freelancer_id = ?",
    [freelancerId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });

      if (results) {
        db.run(
          `UPDATE freelancer_profiles SET
           phone = ?, location = ?, skills = ?, experience = ?,
           portfolio_url = ?, github_link = ?, availability = ?, hourly_rate = ?
           WHERE freelancer_id = ?`,
          [
            phoneNumber,
            location,
            skills,
            experience,
            portfolio,
            glink,
            availablity,
            rate,
            freelancerId
          ],
          function (err) {
            if (err) return res.status(500).json({ error: "Update error" });
            res.status(200).json({ message: "Details updated successfully" });
          }
        );
      } else {
        db.run(
          `INSERT INTO freelancer_profiles
           (freelancer_id, phone, location, skills, experience, portfolio_url, github_link, availability, hourly_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            freelancerId,
            phoneNumber,
            location,
            skills,
            experience,
            portfolio,
            glink,
            availablity,
            rate
          ],
          function (err) {
            if (err) return res.status(500).json({ error: "Insert error" });
            res.status(201).json({ message: "Details added successfully" });
          }
        );
      }
    }
  );
});

// =================== VIEW DATA ======================
app.post('/emp_posts', (req, res) => {
    const { employerId } = req.body;

    if (!employerId) {
        return res.status(400).json({ error: "Employer ID is required" });
    }

    const query = `
        SELECT p.*, e.name AS employer_name
        FROM posts p
        JOIN signup_employer e ON p.employer_id = e.id
        WHERE p.employer_id = ?
        ORDER BY p.posted_date DESC
    `;

    db.all(query, [employerId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(results);
    });
});

app.post('/posts', (req, res) => {
    const query = `
        SELECT p.*, e.name AS employer_name, e.id AS EMPLOYER_ID
        FROM posts p
        JOIN signup_employer e ON p.employer_id = e.id
        ORDER BY p.posted_date DESC
    `;

    db.all(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.status(200).json(results);
    });
});

// =================== APPLY TO A JOB ======================
app.post("/apply", (req, res) => {
  const { post_id, freelancer_email } = req.body;
  if (!post_id || !freelancer_email)
    return res.status(400).json({ error: "Missing data" });

  db.get(
    "SELECT id FROM signup_freelancer WHERE email = ?",
    [freelancer_email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!result)
        return res.status(400).json({ error: "Freelancer not found" });
      const freelancer_id = result.id;

      db.get(
        "SELECT * FROM applications WHERE post_id = ? AND freelancer_id = ?",
        [post_id, freelancer_id],
        (err, existingApplication) => {
          if (err) return res.status(500).json({ error: "DB error" });
          if (existingApplication)
            return res.status(409).json({ error: "Already applied to this post" });

          const q = "INSERT INTO applications(post_id, freelancer_id, status, applied_date) VALUES (?, ?, 'pending', datetime('now'))";
          db.run(q, [post_id, freelancer_id], function (err) {
            if (err) return res.status(500).json({ error: "DB error" });
            res.status(201).json({ message: "Application sent" });
          });
        }
      );
    }
  );
});

app.get("/applied-posts/:email", (req, res) => {
  const email = req.params.email;
  db.get(
    "SELECT id FROM signup_freelancer WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!result)
        return res.status(400).json({ error: "Freelancer not found" });
      const freelancer_id = result.id;
      db.all(
        "SELECT post_id FROM applications WHERE freelancer_id = ?",
        [freelancer_id],
        (err, rows) => {
          if (err) return res.status(500).json({ error: "DB error" });
          const postIds = rows.map((r) => r.post_id);
          res.status(200).json({ postIds });
        }
      );
    }
  );
});

// NEW ENDPOINT: Fetch all applications for a specific freelancer
app.get("/freelancer-applications/:freelancerId", (req, res) => {
    const freelancerId = req.params.freelancerId;
    if (!freelancerId) {
        return res.status(400).json({ error: "Freelancer ID is required" });
    }

    const query = `
        SELECT application_id, post_id, status, completion_file_path
        FROM applications
        WHERE freelancer_id = ?;
    `;

    db.all(query, [freelancerId], (err, results) => {
        if (err) {
            console.error("Error fetching freelancer applications:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json(results);
    });
});

app.get("/applicants-for-post/:postId", (req, res) => {
    const postId = req.params.postId;
    if (!postId) {
        return res.status(400).json({ error: "Post ID is required" });
    }

    const query = `
        SELECT
            a.freelancer_id,
            sf.name AS freelancer_name,
            sf.email AS freelancer_email,
            a.status,
            a.applied_date,
            a.completion_file_path -- Include the new column
        FROM
            applications a
        JOIN
            signup_freelancer sf ON a.freelancer_id = sf.id
        WHERE
            a.post_id = ?
        ORDER BY
            a.applied_date DESC;
    `;

    db.all(query, [postId], (err, results) => {
        if (err) {
            console.error("Error fetching applicants for post:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json(results);
    });
});

// =================== FILE UPLOAD FOR PROJECT COMPLETION ======================
app.post('/upload-completion/:applicationId', upload.single('completionFile'), (req, res) => {
    const applicationId = req.params.applicationId;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!filePath) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    // Update the application status and file path
    const query = `
        UPDATE applications
        SET status = 'completed', completion_file_path = ?, completed_date = datetime('now')
        WHERE application_id = ?;
    `;

    db.run(query, [filePath, applicationId], function (err) {
        if (err) {
            console.error("Error updating application with completion file:", err);
            // If DB update fails, you might want to delete the uploaded file
            require('fs').unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting failed upload file:", unlinkErr);
            });
            return res.status(500).json({ error: "Failed to update application with completion file." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Application not found." });
        }
        res.status(200).json({ message: "Project completion file uploaded successfully!", filePath: filePath });
    });
});

// =================== CHAT MESSAGES ======================
app.get("/messages", (req, res) => {
  const { post_id, freelancer_id, employer_id } = req.query;
  if (!post_id || (!freelancer_id && !employer_id))
    return res.status(400).json({ error: "Missing post_id or user IDs" });

  let query;
  let params;

  // Determine which user is the "other party" for the query
  if (freelancer_id && employer_id) {
      query = `
          SELECT m.*
          FROM messages m
          WHERE m.post_id = ?
            AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
          ORDER BY m.timestamp ASC;
      `;
      params = [post_id, freelancer_id, employer_id, employer_id, freelancer_id];
  } else {
      return res.status(400).json({ error: "Both freelancer_id and employer_id are required for chat context." });
  }

  db.all(query, params, (err, results) => {
    if (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});

app.post("/messages", (req, res) => {
  const { post_id, sender_id, receiver_id, message } = req.body;
  if (!post_id || !sender_id || !receiver_id || !message)
    return res.status(400).json({ error: "Missing fields" });

  const query = `
    INSERT INTO messages (post_id, sender_id, receiver_id, message, timestamp)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;
  db.run(query, [post_id, sender_id, receiver_id, message], function (err) {
    if (err) {
        console.error("Message insert failed:", err);
        return res.status(500).json({ error: "Message insert failed" });
    }
    res.status(201).json({ message: "Message sent" });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
