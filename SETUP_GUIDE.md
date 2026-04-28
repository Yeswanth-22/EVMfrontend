# Complete Setup Guide for Election Management EVM Project

## 📋 Table of Contents
1. [Backend Setup](#backend-setup)
2. [Database Setup](#database-setup)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Running the Application](#running-the-application)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)

## Backend Setup

### Prerequisites
- Java 21 JDK installed
- Maven 3.8 or higher
- MySQL 8.0 or MariaDB 10.5+
- MySQL Workbench (optional)

### Step 1: Install Java 21

**Windows:**
```bash
# Using Chocolatey
choco install openjdk21

# Or download from https://jdk.java.net/21/
# Add JAVA_HOME to environment variables
```

**macOS:**
```bash
brew install openjdk@21
```

**Linux:**
```bash
sudo apt-get install openjdk-21-jdk
```

### Step 2: Install Maven

**Windows/macOS/Linux:**
```bash
# Download from https://maven.apache.org/download.cgi
# Extract and add to PATH
export PATH=$PATH:/path/to/maven/bin
```

Verify installation:
```bash
mvn --version
java --version
```

## Database Setup

### Step 1: Install MySQL

**Windows:**
- Download from https://dev.mysql.com/downloads/mysql/
- Run installer and follow wizard
- Set root password, e.g., `root`

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### Step 2: Create Database

```bash
# Login to MySQL
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE election_evm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE election_evm;
EXIT;
```

Or using MySQL Workbench:
1. Open MySQL Workbench
2. Create new connection with:
   - Hostname: localhost
   - Port: 3306
   - Username: root
   - Password: (your password)
3. Create new schema named `election_evm`

### Step 3: Verify Connection

```bash
mysql -u root -p election_evm -e "SELECT 1;"
```

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name: "Election Management EVM"
4. Click "Create"

### Step 2: Enable Google+ API

1. In the console, search for "Google+ API"
2. Click on it and select "ENABLE"

### Step 3: Create OAuth 2.0 Credentials

1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Choose "Web application"
3. Set Authorized JavaScript origins:
  - `${API_URL}`
   - `http://localhost:3000`
   - `http://localhost:5173`
4. Set Authorized redirect URIs:
  - `${API_URL}/api/login/oauth2/code/google`
   - `http://localhost:3000/oauth2/redirect`
   - `http://localhost:5173/oauth2/redirect`
5. Click "Create"
6. Copy your Client ID and Client Secret

## Backend Configuration

### Step 1: Clone/Download Project

```bash
cd d:\2025-2026\evensem\FSAD\S-2\PROJECTEMS\election-mangement-evm-main\backend
```

### Step 2: Configure application.yml

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/election_evm?useSSL=false&serverTimezone=UTC
    username: root
    password: root  # Your MySQL password
  
  jpa:
    hibernate:
      ddl-auto: update  # on first run, use 'create' then change to 'update'
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: YOUR_GOOGLE_CLIENT_ID
            client-secret: YOUR_GOOGLE_CLIENT_SECRET

jwt:
  secret: generate_a_long_random_string_of_at_least_256_characters
  expiration: 86400000  # 24 hours in milliseconds
```

### Step 3: Generate JWT Secret

```bash
# Generate a strong random string for JWT secret
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..256 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) } | Join-Object '')))

# On Linux/Mac:
openssl rand -base64 128
```

## Running the Application

### Step 1: Build the Project

```bash
cd backend
mvn clean install -DskipTests
```

### Step 2: Run Spring Boot Application

```bash
mvn spring-boot:run
```

Or:

```bash
mvn package
java -jar target/evm-backend-1.0.0.jar
```

### Step 3: Verify Backend is Running

```bash
curl ${API_URL}/api
```

Response should show API endpoints or a default page.

### Step 4: Check Database

Verify tables were created:

```bash
mysql -u root -p election_evm
SHOW TABLES;
DESC users;
EXIT;
```

## Frontend Integration

### Step 1: Configure React Frontend

Edit your React app's API configuration:

```javascript
// src/config/api.js
export const API_BASE_URL = `${API_URL}/api`;

// Or set in .env
VITE_API_URL=${API_URL}/api
```

### Step 2: Update CORS Settings

The backend is already configured for CORS. If you need to add more origins, edit:

```java
// src/main/java/com/election/evm/EvmBackendApplication.java
corsConfiguration.addAllowedOrigin("http://your-frontend-url");
```

### Step 3: Test API Endpoint

```bash
# Register a new user
curl -X POST ${API_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "confirmPassword": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "voterId": "VOTER123"
  }'
```

## Testing

### Test Authentication

#### 1. Register User
```bash
curl -X POST ${API_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@test.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "firstName": "John",
    "lastName": "Citizen",
    "voterId": "VOTER001"
  }'
```

#### 2. Login
```bash
curl -X POST ${API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@test.com",
    "password": "Password123"
  }'
```

Response will include JWT token. Use it for subsequent requests:

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..." # From login response

# Protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  ${API_URL}/api/auth/me
```

### Test Elections Endpoint
```bash
curl ${API_URL}/api/elections
```

### Load Sample Data

```bash
# Login to MySQL
mysql -u root -p election_evm < init-sample-data.sql
```

## Troubleshooting

### Issue: "Access denied for user 'root'@'localhost'"
**Solution:** Verify MySQL password in `application.yml` matches your MySQL root password.

### Issue: "Unknown database 'election_evm'"
**Solution:** Create database first using the commands above.

### Issue: "Could not resolve all dependencies"
**Solution:** 
```bash
mvn clean install -U
```

### Issue: OAuth redirect URI mismatch
**Solution:** Ensure URIs in Google Console exactly match your backend URLs.

### Issue: Port 8080 already in use
**Solution:** Change port in `application.yml`:
```yaml
server:
  port: 8081
```

### Issue: JWT validation fails
**Solution:** Ensure `jwt.secret` is properly configured and consistent.

## Production Deployment

1. Change `jwt.secret` to a very strong random key
2. Use environment variables for sensitive data
3. Set `spring.jpa.hibernate.ddl-auto: validate` in production
4. Enable HTTPS/TLS
5. Configure proper CORS origins for production domain
6. Use a production-grade database with backups
7. Implement rate limiting
8. Add monitoring and logging

## Next Steps

1. Configure frontend authentication flow
2. Implement unit and integration tests
3. Set up CI/CD pipeline
4. Deploy to cloud (Azure, AWS, etc.)
5. Monitor application health and logs

## Support

For detailed API documentation, refer to `README.md` in the backend folder.

For issues, check:
- Application logs in `logs/` directory
- MySQL error logs
- Browser console for frontend errors
