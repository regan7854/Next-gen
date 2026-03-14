# PostgreSQL Setup for NextGen

## Quick Start (Local Development)

### Option 1: Using Docker (Easiest)
```bash
docker run --name nextgen-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nextgen \
  -p 5432:5432 \
  -d postgres:15
```

### Option 2: Install PostgreSQL Locally
**Windows**: Download from https://www.postgresql.org/download/windows/

### Setup Database

1. **Open pgAdmin or psql** (comes with PostgreSQL)

2. **Create Database and User**:
```sql
-- Connect as postgres user
CREATE DATABASE nextgen;

CREATE USER nextgen_user WITH PASSWORD 'password';

-- Grant privileges
ALTER ROLE nextgen_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE nextgen TO nextgen_user;

-- Connect to nextgen database
\c nextgen

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO nextgen_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nextgen_user;
```

3. **Update .env** in server directory:
```
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
DATABASE_URL=postgresql://nextgen_user:password@localhost:5432/nextgen
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

4. **Start Server**:
```bash
cd server
npm install
npm run prisma:migrate -- --name init
npm start
```

Prisma will create/update all tables from `server/prisma/schema.prisma`.

## Verify Connection

```bash
psql -U nextgen_user -d nextgen -h localhost
# Type your password when prompted
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| "FATAL: Database unavailable" | Check DATABASE_URL format |
| "connection refused" | PostgreSQL not running |
| "password authentication failed" | Check password in .env |
| "database nextgen does not exist" | Run CREATE DATABASE command above |

## Production (Optional)
Use managed PostgreSQL services:
- AWS RDS
- Heroku Postgres
- DigitalOcean
- Railway
- Supabase

Just update DATABASE_URL in `.env`!
