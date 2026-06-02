# 🚀 Anvay Spring Boot Application - Startup Guide

## Prerequisites

Before starting the application, make sure you have:

1. **Java 20** installed
   ```powershell
   java -version
   # Output: java version "20.0.2" or higher
   ```

2. **MySQL Database** running
   ```powershell
   # On Windows with MySQL installed:
   mysql -u root -p
   
   # Create the database if it doesn't exist:
   CREATE DATABASE campus_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Maven** (included via mvnw.cmd)

---

## Step 1: Build the Application

Navigate to the project directory and build:

```powershell
cd d:\Anvay\ANVAY-POD-2\anvay\anvay

# Clean and build (skip tests)
.\mvnw.cmd clean compile -DskipTests

# Or package it as a JAR
.\mvnw.cmd clean package -DskipTests
```

**Expected Output:**
```
[INFO] BUILD SUCCESS
[INFO] Total time: X.XXX s
```

---

## Step 2: Configure Database

Update the database connection in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/campus_management
spring.datasource.username=root
spring.datasource.password=Mathi@2427
spring.jpa.hibernate.ddl-auto=update
server.port=8080
```

**Ensure:**
- ✅ MySQL is running on `localhost:3306`
- ✅ Database `campus_management` exists
- ✅ Username and password are correct

---

## Step 3: Start the Application

### Option A: Run from IDE (Recommended for development)
```powershell
# Using Maven
cd d:\Anvay\ANVAY-POD-2\anvay\anvay
.\mvnw.cmd spring-boot:run
```

### Option B: Run JAR directly
```powershell
cd d:\Anvay\ANVAY-POD-2\anvay\anvay\target
java -jar anvay-0.0.1-SNAPSHOT.jar
```

### Option C: Run in VS Code
1. Open the project in VS Code
2. Press `Ctrl+Shift+D` to open Debug view
3. Select **Spring Boot** from the run configurations
4. Press `F5` or click the **Play** button

---

## Step 4: Verify Application Started

Look for these messages in the console:

```
[INFO] Starting AnvayApplication v0.0.1-SNAPSHOT using Java 20.0.2
[INFO] The following profiles are active: 
[INFO] Tomcat started on port(s): 8080 (http) with context path ''
[INFO] Started AnvayApplication in X.XXX seconds (JVM running for X.XXX)
```

**Success! Application is running at:** `http://localhost:8080`

---

## Step 5: Test the Application

### Using Swagger UI (if enabled)
Visit: `http://localhost:8080/swagger-ui.html`

### Using Postman
1. Open **Postman**
2. Click **Import**
3. Select **Anvay-API-Collection.postman_collection.json**
4. Run any request to test the API

### Using cURL
```powershell
# Test health endpoint
curl http://localhost:8080/actuator/health

# Get all clubs
curl -X GET "http://localhost:8080/api/clubs/institution/1"
```

---

## Useful Endpoints to Test

### 🎯 Club Management (US16P2_12 & US16P2_13)

**Get Clubs Dashboard:**
```
GET http://localhost:8080/api/clubs/institution/1
```
Returns: `clubId`, `clubName`, `type`, `membersCount`, `joinRequestsCount`, `leadershipAppsCount`, `createdDate`

**Create Club:**
```
POST http://localhost:8080/api/clubs
Content-Type: application/json

{
  "institutionId": 1,
  "clubName": "Tech Club",
  "category": "TECHNOLOGY"
}
```

**Update Club:**
```
PUT http://localhost:8080/api/clubs/1
Content-Type: application/json

{
  "clubName": "Updated Club Name",
  "category": "SPORTS"
}
```

**Get Club Members:**
```
GET http://localhost:8080/api/clubs/1/members
```

---

## Troubleshooting

### Issue: `Port 8080 is already in use`
```powershell
# Find the process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with the actual PID)
taskkill /PID <PID> /F

# Or change the port in application.properties
# server.port=8081
```

### Issue: `Cannot connect to MySQL`
```powershell
# Check if MySQL is running
mysql -u root -p

# Test the connection string
# Verify: host, port, database name, username, password
```

### Issue: `Class not found` during startup
```powershell
# Clean Maven cache and rebuild
cd d:\Anvay\ANVAY-POD-2\anvay\anvay
.\mvnw.cmd clean

# Remove .m2 cache if needed
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $env:USERPROFILE\.m2\repository
.\mvnw.cmd clean compile
```

### Issue: `403 Forbidden` or Security errors
Check if Spring Security is configured. Update `application.properties`:
```properties
# Allow all endpoints (dev only)
management.endpoints.web.exposure.include=*
```

---

## Environment Variables (Optional)

Set these for production:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/campus_management"
$env:DB_USER="root"
$env:DB_PASSWORD="Mathi@2427"
$env:SERVER_PORT="8080"
```

---

## Next Steps

After starting the application:

1. ✅ Test endpoints using Postman collection
2. ✅ View logs in console for debugging
3. ✅ Run unit tests: `.\mvnw.cmd test`
4. ✅ Build for production: `.\mvnw.cmd package`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `.\mvnw.cmd clean compile` | Compile only |
| `.\mvnw.cmd clean package` | Build JAR |
| `.\mvnw.cmd spring-boot:run` | Run application |
| `.\mvnw.cmd test` | Run tests |
| `java -jar target/anvay-0.0.1-SNAPSHOT.jar` | Execute JAR |

---

**Need Help?** Check the console logs or review the [API documentation](http://localhost:8080/swagger-ui.html)
