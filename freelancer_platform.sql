-- freelancer_platform.sql

-- Drop database if it exists to ensure a clean start
DROP DATABASE IF EXISTS freelancer_platform;

-- Create the database
CREATE DATABASE freelancer_platform;

-- Use the created database
USE freelancer_platform;

-- Table for Employer Signups
CREATE TABLE signup_employer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Freelancer Signups
CREATE TABLE signup_freelancer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Job Posts by Employers
CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    skills VARCHAR(255),
    money DECIMAL(10, 2),
    posted_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES signup_employer(id) ON DELETE CASCADE
);

-- Table for Freelancer Profiles (additional details)
CREATE TABLE freelancer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT NOT NULL UNIQUE,
    phone VARCHAR(20),
    location VARCHAR(255),
    skills TEXT,
    experience INT, -- Years of experience
    portfolio_url VARCHAR(255),
    github_link VARCHAR(255),
    availability VARCHAR(50), -- e.g., 'full-time', 'part-time', 'freelance'
    hourly_rate DECIMAL(10, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (freelancer_id) REFERENCES signup_freelancer(id) ON DELETE CASCADE
);

-- Table for Job Applications
CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., 'pending', 'accepted', 'rejected'
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, freelancer_id), -- A freelancer can apply to a post only once
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES signup_freelancer(id) ON DELETE CASCADE
);

-- Table for Chat Messages
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    sender_id INT NOT NULL, -- Can be employer_id or freelancer_id
    receiver_id INT NOT NULL, -- Can be employer_id or freelancer_id
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Note: sender_id and receiver_id are generic.
    -- In application logic, you'll determine if they refer to employer or freelancer.
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
    -- No direct foreign keys to signup_employer or signup_freelancer for sender/receiver
    -- as a message can be from either to either. Application logic handles this.
);

-- Optional: Add some sample data for testing
INSERT INTO signup_employer (name, email, password) VALUES
('Employer One', 'employer1@example.com', 'password123'),
('Employer Two', 'employer2@example.com', 'securepass');

INSERT INTO signup_freelancer (name, email, password) VALUES
('Freelancer Alice', 'alice@example.com', 'alicepass'),
('Freelancer Bob', 'bob@example.com', 'bobpass');

INSERT INTO posts (employer_id, title, description, skills, money, posted_date) VALUES
(1, 'Build E-commerce Website', 'Need a full-stack developer for an e-commerce platform.', 'React, Node.js, MongoDB', 150000.00, '2024-03-01'),
(1, 'Design Mobile App UI', 'Looking for a UI/UX designer for an iOS/Android app.', 'Figma, Sketch, UI/UX', 50000.00, '2024-03-05'),
(2, 'Content Writer for Blog', 'Seeking a creative content writer for tech blog posts.', 'Content Writing, SEO, English', 20000.00, '2024-03-10');

INSERT INTO applications (post_id, freelancer_id, status) VALUES
(1, 1, 'pending'), -- Alice applied to E-commerce
(2, 1, 'pending'), -- Alice applied to Mobile App UI
(3, 2, 'pending'); -- Bob applied to Content Writer

-- Sample messages (for testing chat)
-- Employer 1 (ID 1) messages Freelancer Alice (ID 1) about Post 1
INSERT INTO messages (post_id, sender_id, receiver_id, message) VALUES
(1, 1, 1, 'Hi Alice, I saw your application for the e-commerce project. Can we discuss your experience with React?'),
(1, 1, 1, 'I am Employer 1, you are Freelancer Alice');

-- Freelancer Alice (ID 1) replies to Employer 1 about Post 1
INSERT INTO messages (post_id, sender_id, receiver_id, message) VALUES
(1, 1, 1, 'Hi Employer One, absolutely! I have 3 years of experience with React and have built several e-commerce components.'),
(1, 1, 1, 'I am Freelancer Alice, you are Employer 1');

-- Employer 2 (ID 2) messages Freelancer Bob (ID 2) about Post 3
INSERT INTO messages (post_id, sender_id, receiver_id, message) VALUES
(3, 2, 2, 'Hello Bob, your writing samples look great for the blog post. What is your availability next week?');

-- Freelancer Bob (ID 2) replies to Employer 2 about Post 3
INSERT INTO messages (post_id, sender_id, receiver_id, message) VALUES
(3, 2, 2, 'Hi Employer Two, I am available for a call any time on Tuesday or Wednesday.');
