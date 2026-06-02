use dbtest
 
-- 1. INSTITUTIONS Table
CREATE TABLE Institutions (
    institution_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- 2. USERS Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    institution_id INT,
    FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);
 
-- 3. CLUBS Table
CREATE TABLE Clubs (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT,
    club_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    member_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);
 
-- 4. EVENTS Table
CREATE TABLE Events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    event_date DATE,
    location VARCHAR(255),
    participant_type VARCHAR(100),
    max_participants INT,
    registration_fee FLOAT DEFAULT 0.0,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);
 
-- 5. EVENT_PARTICIPANTS Table
CREATE TABLE Event_Participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    points_earned INT DEFAULT 0,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
 
-- 6. CLUB_MEMBERS Table
CREATE TABLE Club_Members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    user_id INT,
    role_in_club VARCHAR(100),
    status VARCHAR(50),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES Clubs(club_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
 
-- 7. ACHIEVEMENTS Table
CREATE TABLE Achievements (
    achievement_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    club_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INT DEFAULT 0,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (club_id) REFERENCES Clubs(club_id)
);
 
-- 8. PAYMENTS Table
CREATE TABLE Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_id INT,
    institution_id INT,
    payment_type VARCHAR(100),
    amount FLOAT NOT NULL,
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(50),
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (institution_id) REFERENCES Institutions(institution_id)
);
 
-- 9. LEADERSHIP_APPLICATIONS Table
CREATE TABLE Leadership_Applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    user_id INT,
    experience TEXT,
    status VARCHAR(50),
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES Clubs(club_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);