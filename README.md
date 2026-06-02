# Anvay — Multi-Tenant Event Management Platform

> A secure, role-driven platform that unifies event orchestration across educational institutions, built with Angular, Spring Boot, and MySQL.

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Deployed on Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Security Design](#security-design)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Agile Development Process](#agile-development-process)
- [Team](#team)

---

## Overview

In academic environments, events are typically coordinated through fragmented channels — emails, notice boards, and informal messaging. Anvay replaces this chaos with a **unified, multi-tenant platform** where each institution operates in its own isolated data space, with role-specific dashboards tailored for every participant in the event lifecycle.

The platform was developed as a major project during an SDET internship program (Jan 31 – Jun 2, 2026), following strict Agile practices across three sprints.

---

## Features

**For Super Admins**
- Manage institutional onboarding and review pending registration requests
- Monitor platform-wide metrics and maintain global control

**For Institution Admins**
- Configure college-level settings and branding
- Approve club profiles and oversee student and leader registrations

**For Club Leaders**
- Create, edit, and schedule club events
- Manage participant registrations and view event analytics

**For Students**
- Browse a dynamic, personalized event feed
- Register for events with one click
- Access a personal dashboard showing upcoming schedules

---

## Architecture

Anvay follows a **decoupled client-server architecture** with a clean separation between the Angular SPA frontend and the Spring Boot REST API backend. Multi-tenancy is enforced at the data layer, ensuring complete institutional isolation.

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│      Angular Frontend        │        │       Spring Boot Backend         │
│                             │        │                                  │
│  ┌─────────────────────┐   │        │  ┌────────────────────────────┐  │
│  │  AuthGuard          │   │◄──────►│  │  JwtAuthenticationFilter   │  │
│  │  AuthInterceptor    │   │  REST  │  │  Spring Security Config     │  │
│  │  Standalone Comps   │   │  API   │  │  Controller → Service Layer │  │
│  │  RxJS Observables   │   │        │  │  JPA / Hibernate ORM        │  │
│  └─────────────────────┘   │        │  └────────────┬───────────────┘  │
└─────────────────────────────┘        └───────────────┼──────────────────┘
                                                        │
                                               ┌────────▼────────┐
                                               │   MySQL Database  │
                                               │  (per-tenant     │
                                               │   data isolation) │
                                               └──────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Details |
|---|---|
| Framework | Angular 17+ (TypeScript) |
| Architecture | Standalone Component Architecture (no `NgModules`) |
| Reactive Layer | RxJS — Observables, `tap` operators |
| Styling | HTML5, CSS3, JavaScript |

### Backend
| Technology | Details |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Web Layer | Spring Core, Spring MVC, Spring REST |
| Security | Spring Security + JJWT (`HS256` signed tokens) |
| Data Access | Spring Data JPA / Hibernate ORM |
| Database | MySQL 8.0 |

### DevOps & Infrastructure
| Technology | Details |
|---|---|
| Containerization | Docker & Docker Compose |
| Deployment | Render (Backend), Vercel (Frontend) |
| CI/CD | Jenkins, Azure (Basics) |
| Version Control | Git |

### Testing (SDET)
| Area | Tools & Techniques |
|---|---|
| Functional Testing | Manual test case design and execution |
| Automation | Selenium WebDriver, TestNG, POM + PageFactory |
| API Testing | Rest Assured |
| BDD | Cucumber |
| Data-Driven Testing | Excel-based parameterization with TestNG Data Providers |

---

## Security Design

Anvay implements a **stateless, zero-trust authentication model** across every layer of the stack.

### 1. JWT-Based Authentication
On successful login, the backend generates a signed JSON Web Token using the `HS256` algorithm. The token carries custom claims (`role`, `email`) and is stored client-side in `localStorage`.

### 2. Angular — Automatic Token Injection
- **`AuthInterceptor.ts`** — Intercepts every outbound HTTP request and appends the token as an `Authorization: Bearer <token>` header, so no individual service needs to handle this manually.
- **`AuthGuard.ts`** — Protects route access using Angular's router guard interface. If a user's token claims don't match the required role for a route, they are immediately redirected.

### 3. Spring — Server-Side Filtering
- **`JwtAuthenticationFilter.java`** — Extends `OncePerRequestFilter` to intercept, decode, and validate tokens on every incoming request before it reaches any controller.
- **`SecurityContextHolder`** — Valid tokens are used to establish an authenticated context bound to the current thread, making the verified user identity available throughout the request lifecycle.

### 4. Password Security
User passwords are hashed using Spring Security's `BCryptPasswordEncoder`, which applies a randomly generated salt per password, eliminating rainbow table vulnerabilities.

---

## User Roles

Anvay enforces strict **Role-Based Access Control (RBAC)** across four distinct personas:

| Role | Responsibilities |
|---|---|
| **Super Admin** | Global platform control — institution onboarding, request approvals, platform metrics |
| **Institution Admin** | College-level management — club approvals, student/leader registrations |
| **Club Leader** | Event lifecycle management — creation, scheduling, participant tracking |
| **Student** | Event discovery, registration, personal dashboard |

---

## Project Structure

```
anvay/
├── anvay-frontend/               # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/             # AuthGuard, AuthInterceptor, services
│   │   │   ├── features/         # Feature modules (super-admin, institution, club, student)
│   │   │   └── shared/           # Shared components, pipes, directives
│   │   └── environments/
│   └── proxy.conf.json           # Dev proxy routing /api → backend
│
└── anvay-backend/                # Spring Boot REST API
    └── src/main/
        ├── java/
        │   └── com/anvay/
        │       ├── config/       # Security config, CORS, JWT setup
        │       ├── controller/   # REST controllers per role
        │       ├── service/      # Business logic layer
        │       ├── repository/   # Spring Data JPA repositories
        │       ├── model/        # JPA entities
        │       ├── dto/          # Data Transfer Objects (flattened payloads)
        │       ├── security/     # JwtFilter, JwtUtil, SecurityContext
        │       └── init/         # DataInitializer (CommandLineRunner)
        └── resources/
            └── application.properties
```

---

## Getting Started

### Prerequisites

Make sure the following are installed before running Anvay locally:

- Java Development Kit (JDK 21)
- Node.js v18+ and Angular CLI 17+
- MySQL Server 8.0+
- Maven

---

### Step 1 — Database Setup

Start MySQL and initialize the Anvay database:

```bash
sudo service mysql start
sudo mysql -u root
```

Inside the MySQL shell:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS anvay;
EXIT;
```

> The `SUPER_ADMIN` account is seeded automatically on the first backend startup via the `DataInitializer` module — no manual inserts required.

---

### Step 2 — Backend Setup

Navigate to the backend directory and make the Maven wrapper executable:

```bash
cd anvay-backend
chmod +x mvnw
```

Verify `src/main/resources/application.properties` is configured correctly:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/anvay
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
```

Start the Spring Boot server:

```bash
./mvnw clean spring-boot:run
```

The backend will be available at `http://localhost:8081`.

---

### Step 3 — Frontend Setup

In a new terminal window:

```bash
cd anvay-frontend
npm install
npm start
```

Ensure `proxy.conf.json` is routing `/api` calls to `http://localhost:8081` (already configured). The Angular dev server will be available at `http://localhost:4200`.

---

### Docker (Optional)

To run the full stack via Docker Compose:

```bash
docker-compose up --build
```

---

### Deployment - Render

Url - https://anvay-pod-2-1.onrender.com/

## Agile Development Process

Anvay was built across **3 Sprints** following Scrum methodology:

| Sprint | Focus Areas |
|---|---|
| **Sprint 1** | Project setup, database schema, JWT auth, Super Admin flows |
| **Sprint 2** | Institution Admin, Club Leader, and Student feature modules; Angular routing and guards |
| **Sprint 3** | Integration, DTO refinement, security hardening, Docker deployment, testing |

Each sprint involved:
- Story point estimation and distribution across team members
- Functional test case mapping alongside feature development
- Regular sync-ups with mentors and the broader 42-member cohort

---

## Team

This project was built as part of an SDET internship program at [Organization], Jan 31 – Jun 2, 2026.

| Member |
|---|
| **Vitesh** |
| **SivaSelva Mathi** |
| **Mithun** |
| **Swastika** |

**Mentorship & Guidance**

| Name | Role |
|---|---|
| Selvin | HR Coach |
| Mahes | Trainer |
| Viji | Trainer |

---

*Part of a broader SDET internship program — developed alongside the [Zuply Testing Project](../zuply-testing/README.md).*
