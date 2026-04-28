# Election Management EVM - Complete Backend Implementation

## Project Overview

Your election management system now includes a fully-featured Spring Boot backend with:

✅ **Spring Boot 3.2** with Java 21  
✅ **MySQL Database** integration with JPA/Hibernate  
✅ **Google OAuth 2.0** authentication  
✅ **JWT Token** based authorization  
✅ **Role-Based Access Control** (Admin, Analyst, Citizen, Observer)  
✅ **RESTful APIs** for elections, votes, candidates, fraud reports  
✅ **Security Configuration** with Spring Security  
✅ **CORS enabled** for frontend integration  

## 📁 Project Structure

```
election-mangement-evm-main/
├── backend/                           # Spring Boot Backend
│   ├── src/main/java/com/election/evm/
│   │   ├── EvmBackendApplication.java # Main application entry
│   │   ├── config/
│   │   │   ├── SecurityConfig.java     # Spring Security configuration
│   │   │   └── RoleInitializer.java    # Initialize roles on startup
│   │   ├── controller/
│   │   │   ├── AuthController.java     # Authentication endpoints
│   │   │   ├── ElectionController.java # Election management
│   │   │   ├── CandidateController.java # Candidate management
│   │   │   ├── VoteController.java     # Voting system
│   │   │   ├── FraudReportController.java # Fraud reporting
│   │   │   └── AdminUserController.java # User management
│   │   ├── entity/
│   │   │   ├── User.java               # User entity
│   │   │   ├── Role.java               # Role entity
│   │   │   ├── Election.java           # Election entity
│   │   │   ├── Candidate.java          # Candidate entity
│   │   │   ├── Vote.java               # Vote entity
│   │   │   └── FraudReport.java        # Fraud report entity
│   │   ├── dto/
│   │   │   ├── RegisterRequest.java    # Registration DTO
│   │   │   ├── LoginRequest.java       # Login DTO
│   │   │   ├── AuthResponse.java       # Auth response DTO
│   │   │   ├── UserDTO.java            # User DTO
│   │   │   ├── ElectionDTO.java        # Election DTO
│   │   │   ├── CandidateDTO.java       # Candidate DTO
│   │   │   └── FraudReportDTO.java     # Fraud report DTO
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── RoleRepository.java
│   │   │   ├── ElectionRepository.java
│   │   │   ├── CandidateRepository.java
│   │   │   ├── VoteRepository.java
│   │   │   └── FraudReportRepository.java
│   │   ├── service/
│   │   │   ├── AuthService.java        # Authentication logic
│   │   │   ├── UserService.java        # User management logic
│   │   │   ├── ElectionService.java    # Election logic
│   │   │   ├── CandidateService.java   # Candidate logic
│   │   │   ├── VoteService.java        # Voting logic
│   │   │   └── FraudReportService.java # Fraud report logic
│   │   └── security/
│   │       ├── JwtTokenProvider.java   # JWT token generation
│   │       ├── JwtAuthenticationFilter.java # JWT filter
│   │       └── CustomUserDetailsService.java # User details service
│   ├── src/main/resources/
│   │   └── application.yml             # Application configuration
│   ├── src/test/java/
│   ├── pom.xml                         # Maven dependencies
│   ├── .gitignore
│   ├── .env.example                    # Environment template
│   ├── README.md                       # Backend documentation
│   └── init-sample-data.sql            # Sample data script
│
├── SETUP_GUIDE.md                      # Complete setup instructions
├── src/                                # React Frontend (existing)
└── package.json                        # Frontend config (existing)
```

## 🚀 Quick Start

### 1. Database Setup (2 minutes)

**Windows - MySQL Command Line:**
```cmd
mysql -u root -p
```

**In MySQL prompt:**
```sql
CREATE DATABASE election_evm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Or use MySQL Workbench:**
- Open MySQL Workbench
- Right-click on "Databases" → "Create New Schema"
- Name: `election_evm`, Character Set: `utf8mb4`

### 2. Backend Configuration (3 minutes)

1. **Edit `backend/src/main/resources/application.yml`:**
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/election_evm
       username: root
       password: root  # Change to your MySQL password
     
     security:
       oauth2:
         client:
           registration:
             google:
               client-id: YOUR_GOOGLE_CLIENT_ID
               client-secret: YOUR_GOOGLE_CLIENT_SECRET
   ```

2. **Generate strong JWT secret:**
   - Windows PowerShell: `$([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString())`
   - Linux/Mac: `openssl rand -base64 32`

### 3. Build Backend (2 minutes)

```bash
cd backend
mvn clean install -DskipTests
```

### 4. Run Backend (1 minute)

```bash
mvn spring-boot:run
```

Expected output:
```
Started EvmBackendApplication in X.XXX seconds
Tomcat started on port(s): 8080
```

### 5. Verify Installation

Open browser and go to: `${API_URL}/api/elections`

Should return JSON array (empty initially): `[]`

## 🔐 Google OAuth Setup (5 minutes)

1. Visit: https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web app)
5. Add authorized URIs (localhost versions):
  - `${API_URL}`
6. Add redirect URIs:
  - `${API_URL}/api/login/oauth2/code/google`
7. Copy Client ID & Secret to `application.yml`

## 📱 API Endpoints

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123",
  "firstName": "John",
  "lastName": "Doe",
  "voterId": "VOTER123"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Pass@123"
}

# OAuth (handled by Google)
POST /api/auth/oauth2/success
```

### Elections (Public)
```bash
# Get all elections
GET /api/elections

# Get election by ID
GET /api/elections/{id}

# Get by status
GET /api/elections/status/ONGOING

# Get by region
GET /api/elections/region/National
```

### Voting (Requires CITIZEN role)
```bash
# Cast vote
POST /api/votes/cast?userId=1&electionId=1&candidateId=1

# Get vote count for candidate
GET /api/votes/candidate/{candidateId}/count

# Check if user already voted
GET /api/votes/user/{userId}/election/{electionId}/has-voted
```

### Candidates
```bash
# Get candidates for election
GET /api/candidates/election/{electionId}

# Get candidate details
GET /api/candidates/{id}

# Add candidate (ADMIN only)
POST /api/candidates/election/{electionId}

# Update candidate (ADMIN only)
PUT /api/candidates/{id}

# Delete candidate (ADMIN only)
DELETE /api/candidates/{id}
```

### User Management (ADMIN only)
```bash
# Get all users
GET /api/admin/users

# Get user by ID
GET /api/admin/users/{id}

# Assign role
POST /api/admin/users/{userId}/roles/{roleName}

# Remove role
DELETE /api/admin/users/{userId}/roles/{roleName}

# Deactivate user
POST /api/admin/users/{userId}/deactivate

# Verify user
POST /api/admin/users/{userId}/verify
```

### Fraud Reports
```bash
# Register fraud report (OBSERVER only)
POST /api/fraud-reports/report?userId=1&electionId=1&title=...&description=...

# Get reports by election
GET /api/fraud-reports/election/{electionId}

# Get reports by status (ADMIN only)
GET /api/fraud-reports/status/OPEN

# Assign to handler (ADMIN only)
POST /api/fraud-reports/{reportId}/assign/{adminId}

# Update status (ADMIN only)
PUT /api/fraud-reports/{reportId}/status?status=RESOLVED&resolution=...
```

## 🔄 Frontend Integration

### Using with React

1. **Set API URL:**
   ```javascript
   // src/config/api.js
  const API_URL = `${API_URL}/api`;
   ```

2. **Store JWT Token:**
   ```javascript
   // After login
   const response = await fetch(`${API_URL}/auth/login`, {...});
   const data = await response.json();
   localStorage.setItem('token', data.token);
   ```

3. **Use Token in Requests:**
   ```javascript
   // Protected endpoints
   fetch(`${API_URL}/protected-endpoint`, {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
   });
   ```

4. **Update AuthContext.jsx:**
   ```javascript
   // Reference the backend API instead of mock data
   const loginUser = async (email, password) => {
     const res = await fetch(`${API_URL}/auth/login`, {
       method: 'POST',
       body: JSON.stringify({email, password})
     });
     const data = await res.json();
     setUser(data.user);
     setToken(data.token);
   };
   ```

## 🔒 Role-Based Access

| Role | Permissions |
|------|-------------|
| **ADMIN** | Create/update elections, manage users, handle fraud reports |
| **ANALYST** | View election statistics and analysis |
| **CITIZEN** | Vote in elections |
| **OBSERVER** | Report fraud, monitor elections |

## 📊 Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- first_name (VARCHAR)
- last_name (VARCHAR)
- voter_id (VARCHAR, UNIQUE)
- is_verified (BOOLEAN)
- is_active (BOOLEAN)
- oauth_provider (VARCHAR)
- oauth_id (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Elections Table
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- start_date (DATETIME)
- end_date (DATETIME)
- status (VARCHAR) - UPCOMING, ONGOING, COMPLETED, CANCELLED
- region (VARCHAR)
- total_voters (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Votes Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- election_id (INT, FOREIGN KEY)
- candidate_id (INT, FOREIGN KEY)
- ip_address (VARCHAR)
- device_info (VARCHAR)
- verified (BOOLEAN)
- created_at (TIMESTAMP)
```

## 📝 Key Features

✅ **JWT Authentication** - Stateless, token-based auth  
✅ **Google OAuth2** - One-click sign-in  
✅ **Secure Password** - BCrypt hashing  
✅ **Role-Based Access** - Fine-grained permissions  
✅ **Duplicate Vote Prevention** - One vote per user per election  
✅ **Fraud Reporting** - Observer can report suspicious activity  
✅ **Real-time Vote Count** - Updates on vote cast  
✅ **CORS Enabled** - Cross-origin requests from frontend  

## 🛠️ Technologies Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Java 21 JDK |
| **Framework** | Spring Boot 3.2 |
| **Security** | Spring Security, OAuth2, JWT |
| **Database** | MySQL 8.0, JPA/Hibernate |
| **Build** | Maven 3.8+ |
| **Additional** | Lombok, Validation Api |

## 📦 Dependencies

Key Maven dependencies included:
- `spring-boot-starter-web` - Web framework
- `spring-boot-starter-data-jpa` - Database ORM
- `spring-boot-starter-security` - Authentication
- `spring-security-oauth2-client` - OAuth2 support
- `jjwt` - JWT token generation
- `mysql-connector-java` - MySQL driver
- `spring-boot-devtools` - Hot reload
- `lombok` - Code generation

## ⚠️ Important Configuration Items

**Before Running in Production:**

1. ✅ Change `jwt.secret` to a strong random key
2. ✅ Use environment variables for DB credentials
3. ✅ Set `spring.jpa.hibernate.ddl-auto: validate`
4. ✅ Enable HTTPS/TLS
5. ✅ Configure production OAuth URIs
6. ✅ Set appropriate CORS origins
7. ✅ Implement rate limiting
8. ✅ Add monitoring & logging

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Change `server.port` in `application.yml` |
| Database connection error | Check MySQL is running, credentials match |
| JWT validation fails | Verify `jwt.secret` is configured |
| OAuth redirect mismatch | Add exact URI in Google Cloud Console |
| CORS errors | Check `corsConfiguration.addAllowedOrigin()` in code |

## 📚 Documentation

- **Detailed Setup:** See `./SETUP_GUIDE.md`
- **Backend API Docs:** See `./backend/README.md`
- **SQL Sample Data:** See `./backend/init-sample-data.sql`

## 🎯 Next Steps

1. ✅ Configure MySQL database
2. ✅ Get Google OAuth credentials
3. ✅ Update `application.yml` with credentials
4. ✅ Build backend: `mvn clean install`
5. ✅ Run backend: `mvn spring-boot:run`
6. ✅ Update React frontend to use backend APIs
7. ✅ Test authentication flow
8. ✅ Load sample data: `mysql ... < init-sample-data.sql`
9. ✅ Deploy to production

## 📞 Support Resources

- Spring Boot Docs: https://spring.io/projects/spring-boot
- Spring Security: https://spring.io/projects/spring-security
- MySQL Documentation: https://dev.mysql.com/doc/
- OAuth2 Flow: https://tools.ietf.org/html/rfc6749
- JWT Documentation: https://tools.ietf.org/html/rfc7519

## 📄 License

This project is organized as part of your FSAD coursework.

---

**Backend Implementation Complete! ✨**

Your Spring Boot backend is fully configured and ready to:
- Handle user authentication (JWT + OAuth)
- Manage elections and candidates
- Process votes securely
- Report fraud incidents
- Serve your React frontend

Proceed with Setup Guide for detailed installation steps.
