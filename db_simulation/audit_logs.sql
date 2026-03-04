CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), action VARCHAR(100), details JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMP DEFAULT NOW()); 
