-- Database schema for medication reminder app

-- Users table for both carers and dependants
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('carer', 'dependant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships between carers and dependants
CREATE TABLE carer_dependant_relationships (
    id SERIAL PRIMARY KEY,
    carer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dependant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(carer_id, dependant_id)
);

-- Medications table
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    instructions TEXT,
    dependant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    carer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication schedules
CREATE TABLE medication_schedules (
    id SERIAL PRIMARY KEY,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    time_of_day TIME NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- Array of days (0=Sunday, 1=Monday, etc.)
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications sent to dependants
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    dependant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES medication_schedules(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('medication_reminder', 'schedule_update')),
    read BOOLEAN DEFAULT FALSE,
    scheduled_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medication confirmations with photos
CREATE TABLE medication_confirmations (
    id SERIAL PRIMARY KEY,
    dependant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES medication_schedules(id) ON DELETE CASCADE,
    photo_path VARCHAR(500) NOT NULL,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_by_carer BOOLEAN DEFAULT FALSE,
    carer_confirmed_at TIMESTAMP,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_medications_dependant ON medications(dependant_id);
CREATE INDEX idx_schedules_medication ON medication_schedules(medication_id);
CREATE INDEX idx_notifications_dependant ON notifications(dependant_id);
CREATE INDEX idx_confirmations_dependant ON medication_confirmations(dependant_id);
CREATE INDEX idx_confirmations_medication ON medication_confirmations(medication_id);