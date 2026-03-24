# PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL 12+ installed and running
- psql command-line tool available

## Setup Instructions

### 1. Create Database and User

```sql
-- Connect to PostgreSQL as admin
psql -U postgres

-- Create database
CREATE DATABASE nextgen;

-- Create user (replace 'password' with a secure password)
CREATE USER nextgen_user WITH PASSWORD 'password';

-- Grant privileges
ALTER ROLE nextgen_user SET client_encoding TO 'utf8';
ALTER ROLE nextgen_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE nextgen_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE nextgen TO nextgen_user;

-- Connect to the new database
\c nextgen
GRANT ALL PRIVILEGES ON SCHEMA public TO nextgen_user;

-- Exit
\q
```

### 2. Update .env File

Create or update `.env` in the `server/` directory:

```
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
DATABASE_URL=postgresql://nextgen_user:password@localhost:5432/nextgen
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

Replace `password` with the password you set above.

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Run Server

The application will automatically:
- Connect to PostgreSQL
- Create tables if they don't exist
- Start the API server

```bash
npm start
```

## Migration from MongoDB

All MongoDB code has been removed. The application now uses:
- PostgreSQL for data persistence
- JWT tokens for authentication
- UUID for user IDs
- Bcrypt for password hashing

## Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| display_name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Unique, required |
| password_hash | VARCHAR(255) | Required |
| role | VARCHAR(50) | Default: 'user' |
| biography | TEXT | Optional |
| avatar_color | VARCHAR(7) | Auto-generated HSL color |
| created_at | TIMESTAMP | Auto-set on insert |
| updated_at | TIMESTAMP | Auto-set on insert |

## Troubleshooting

**"DATABASE_URL not set"**
- Make sure `.env` file exists in the server directory
- Verify DATABASE_URL is set

**"Failed to connect to PostgreSQL"**
- Ensure PostgreSQL is running
- Check DATABASE_URL connection string
- Verify database and user exist
- Confirm user has proper permissions

**"Missing JWT secret"**
- Make sure JWT_SECRET is set in `.env`
