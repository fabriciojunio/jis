-- V1__create_initial_schema.sql
-- Job Intelligence System - Schema Inicial

CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    glassdoor_score DECIMAL(2,1),
    glassdoor_reviews_count INT DEFAULT 0,
    size VARCHAR(50),
    funding_stage VARCHAR(50),
    verified_good BOOLEAN DEFAULT FALSE,
    blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(300) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    company_id BIGINT REFERENCES companies(id),
    company_name VARCHAR(200),
    description TEXT NOT NULL,
    link VARCHAR(1000) NOT NULL,
    source VARCHAR(50) NOT NULL,
    remote BOOLEAN DEFAULT FALSE,
    hybrid BOOLEAN DEFAULT FALSE,
    level VARCHAR(30),
    level_detected VARCHAR(30),
    techs TEXT[],
    salary_min INT,
    salary_max INT,
    salary_informed BOOLEAN DEFAULT FALSE,
    location VARCHAR(200),
    published_at TIMESTAMP,
    days_open INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_scores (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) UNIQUE NOT NULL,
    score_rules DECIMAL(5,2) DEFAULT 0,
    score_ml DECIMAL(5,2) DEFAULT 0,
    score_company DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2) DEFAULT 0,
    score_breakdown JSONB,
    notified BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) NOT NULL,
    applied_at TIMESTAMP,
    response_received BOOLEAN DEFAULT FALSE,
    response_at TIMESTAMP,
    stage VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    jobs_collected INT DEFAULT 0,
    jobs_scored INT DEFAULT 0,
    jobs_notified INT DEFAULT 0,
    applications_sent INT DEFAULT 0,
    responses_received INT DEFAULT 0,
    interviews_scheduled INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_active ON jobs(active);
CREATE INDEX idx_jobs_external ON jobs(external_id);
CREATE INDEX idx_scores_final ON job_scores(final_score DESC);
CREATE INDEX idx_scores_notified ON job_scores(notified);
CREATE INDEX idx_applications_stage ON applications(stage);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_metrics_date ON daily_metrics(date DESC);
