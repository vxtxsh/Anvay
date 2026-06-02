# ANVAY — Multi-Tenant Campus Event & Club Management Platform
## Mentor Presentation Script (End-to-End)

**Team:** Swastika · Vitesh · Mathi · Likhitha · Mithun
**Project:** Anvay (Pod 2 — Cognizant MFRP)
**Stack:** Spring Boot 4 (Java 21) · Angular 17 · MySQL (Aiven) · JWT · BCrypt · SpringDoc OpenAPI

---

## How this presentation is divided

| Module | Owner | ~Duration | Theme |
| --- | --- | --- | --- |
| **Module 1** | **Swastika** | ~7 min | Project Overview, Architecture, Tech Stack, Backend Foundation (Entry point, Entities, Repositories — the data model) |
| **Module 2** | **Vitesh** | ~7 min | Security Layer — Spring Security, JWT, BCrypt, DataInitializer, Auth Controller; Frontend Bootstrapping (routes, guards, interceptors, AuthService, Login/Register screens) |
| **Module 3** | **Mathi** | ~7 min | Super Admin + Institution Domain — institution lifecycle, club CRUD, member approvals; Super Admin & Institution dashboards |
| **Module 4** | **Likhitha** | ~7 min | Event Lifecycle + Club Leader — event CRUD, registrations, winners workflow, scheduler, leadership applications; Club-Leader dashboard |
| **Module 5** | **Mithun** | ~7 min | Student Experience + Cross-Cutting — student services, chatbot, shared widgets (chat, toast), global exception handler, deployment & QA |

> Each module has: **(a) Context** (what we are about to show), **(b) Code-walk** (file-by-file explanation), **(c) Live demo flow**, **(d) Hand-off line** to the next presenter.

---

# MODULE 1 — SWASTIKA
### Project Overview, Architecture & The Data Foundation

---

## 1.1 Opening (Script — speak verbatim or paraphrase)

> "Good morning everyone. We are Pod 2 and the project we are presenting is **Anvay** — a multi-tenant campus event and club management platform.
>
> A single college today juggles dozens of clubs and events through WhatsApp groups, Google Forms and spreadsheets. Anvay replaces that chaos with one platform that supports **four distinct user roles** — *Super Admin*, *Institution Admin*, *Club Leader* and *Student* — all working off the same backend but seeing completely different dashboards.
>
> The word *multi-tenant* is important: every record in our database is scoped to an `institutionId`, so College-A's events, members and points never leak into College-B's view. The Super Admin sits above all institutions.
>
> Over the next few minutes I'll cover the architecture, the tech stack, and the data foundation that everything else sits on. Then Vitesh will take you through how we secure that data; Mathi through the Super Admin and Institution layer; Likhitha through events and the Club Leader; and Mithun will close with the Student experience and deployment."

## 1.2 High-Level Architecture (draw on whiteboard / show slide)

```
   ┌──────────────────────┐         ┌────────────────────────┐         ┌──────────────────┐
   │ Angular 17 Frontend  │ ──API──▶│ Spring Boot 4 Backend  │ ──JPA──▶│ MySQL (Aiven)    │
   │  - Standalone comps  │  /api   │  - REST controllers    │         │  9 tables        │
   │  - Lazy routes       │ ◀──JSON │  - Service layer       │         │                  │
   │  - JWT interceptor   │         │  - Repositories (JPA)  │         └──────────────────┘
   └──────────────────────┘         │  - Spring Security+JWT │
                                    │  - @Scheduled jobs     │
                                    └────────────────────────┘
```

**Key facts to call out:**
- Backend runs on **port 8081** locally, frontend on **4200**.
- `proxy.conf.json` forwards `/api/**` from 4200 → 8081 so we avoid CORS in development.
- For production deploy (Render), the frontend is bundled into the Spring Boot JAR — `SpaForwardingController` then forwards any non-API route to `index.html` so Angular's client-side router can take over.
- **DB credentials, JWT secret and CORS origins** are environment variables, not code.

## 1.3 Repository Tour

> "Let me show the folder layout first." Open [ANVAY-POD-2/](ANVAY-POD-2/).

```
ANVAY-POD-2/
├── anvay/anvay/                   # Spring Boot backend
│   ├── pom.xml                    # Maven build
│   ├── src/main/java/com/cts/mfrp/anvay/
│   │   ├── AnvayApplication.java  # main()
│   │   ├── config/                # DataInitializer, AppConfig, Swagger, SPA forwarder
│   │   ├── controller/            # 10 REST controllers
│   │   ├── dto/                   # 14 request/response DTOs
│   │   ├── entity/                # 8 JPA entities
│   │   ├── exception/             # Global handler + ErrorResponse
│   │   ├── repository/            # 8 Spring Data JPA interfaces
│   │   ├── scheduler/             # EventScheduler
│   │   ├── security/              # JWT + Spring Security wiring
│   │   └── service/ + service/impl/   # business logic
│   └── src/main/resources/
│       ├── application.properties
│       └── chatbot_responses.json
└── frontend/anvay-app/
    ├── proxy.conf.json
    └── src/app/
        ├── auth/         # login, register, register-institution, register-student
        ├── dashboard/    # super-admin, institution, club-leader, student
        ├── services/     # auth.service, club.service, chat.service, etc.
        ├── guards/       # authGuard + noAuthGuard
        ├── shared/       # chat-widget, toast
        └── app.routes.ts
```

## 1.4 Backend Bootstrap & Build

### [AnvayApplication.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/AnvayApplication.java)
> "Standard Spring Boot entry point. The two annotations to highlight are `@SpringBootApplication` (auto-configures the whole context) and `@EnableScheduling` — without that second one Likhitha's `EventScheduler` would never fire."

### [pom.xml](anvay/anvay/pom.xml)
> "Java 21, Spring Boot 4.0.4. Key dependencies:
> - `spring-boot-starter-data-jpa` + `mysql-connector-j` — database
> - `spring-boot-starter-security` — auth filter chain (Vitesh will go deep on this next)
> - `jjwt-api / impl / jackson` (v0.12.3) — JWT signing & parsing
> - `spring-boot-starter-validation` — `@Valid` and Bean Validation annotations on DTOs
> - `springdoc-openapi-starter-webmvc-ui` — auto-generates Swagger UI at `/swagger-ui.html`
> - `lombok` — kills boilerplate (`@Data`, `@Builder`, `@RequiredArgsConstructor`)
> - `spring-boot-starter-actuator` — `/actuator/health` for Render health probes"

### [application.properties](anvay/anvay/src/main/resources/application.properties)
> "Notice how every secret is `${ENV_VAR}` — `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS`. Nothing is hardcoded. The only literals are the seeded Super Admin email and password, which `DataInitializer` writes into the DB on first boot (Vitesh covers that)."

## 1.5 The 8 JPA Entities — The Data Model

> "Open the [entity package](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/). These 8 classes ARE our database schema — Hibernate creates / updates the tables on startup via `spring.jpa.hibernate.ddl-auto=update`."

| Entity | Table | Purpose | Key relationships |
| --- | --- | --- | --- |
| [User.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/User.java) | `users` | Every human in the system: super_admin / institution / club_leader / student. Holds `totalPoints`, `leadingClubId`, `profilePicture` (LONGTEXT base64) | ManyToOne Institution; OneToMany ClubMember, EventParticipant, Achievement |
| [Institution.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Institution.java) | `institutions` | A college / school tenant. `status` = pending / active / inactive | OneToMany Club, User |
| [Club.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Club.java) | `clubs` | Belongs to ONE institution. Has validation: `@NotBlank`, regex must contain a letter | ManyToOne Institution; OneToMany Event, ClubMember, Achievement |
| [ClubMember.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/ClubMember.java) | `club_members` | The join-table between users and clubs. `status` = PENDING / APPROVED / REJECTED | ManyToOne Club, User |
| [Event.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Event.java) | `events` | Owned by a Club. Holds 3 winner FKs (`winner1UserId`…), `winnersStatus` (pending/approved), `imageData` (LONGTEXT), `registrationDeadline`, validations | ManyToOne Club; OneToMany EventParticipant |
| [EventParticipant.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/EventParticipant.java) | `event_participants` | Registration record. `points_earned` filled when winners approved | ManyToOne Event, User |
| [Achievement.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Achievement.java) | `achievements` | Badge / certificate per user | ManyToOne User, Club |
| [LeadershipApplication.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/LeadershipApplication.java) | `leadership_applications` | A student applying to lead a club. `@PrePersist` defaults `status='pending'` and `appliedAt=now()` | ManyToOne User |

> **Important Swastika talking points:**
> - We use `@JsonIgnore` / `@JsonIgnoreProperties` aggressively to prevent infinite recursion when Jackson serialises bidirectional `@OneToMany`/`@ManyToOne` graphs.
> - `User.profilePicture` and `Event.imageData` are declared `columnDefinition = "LONGTEXT"` because we store base64-encoded images directly in the DB — no S3, no separate file server.
> - Bean validation lives on the entity itself: `Event.eventName` requires a letter (`^(?=.*[a-zA-Z]).+$`), `contactNumber` must be a valid Indian mobile (`^[6-9][0-9]{9}$`). The `@Valid` annotation on the controller triggers it automatically.

## 1.6 The Repository Layer

> "Each entity has a Spring Data JPA repository. Most are one-liners, but a few have custom JPQL that's worth seeing."

### [UserRepository.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/UserRepository.java)
> "Two custom queries earn their keep: `findStudentsByInstitutionId` and `findAllStudents` — both order by `totalPoints DESC NULLS LAST` so leaderboard ordering happens in SQL, not in Java. We treat `student` AND `club_leader` roles as 'students' for leaderboard purposes."

### [EventRepository.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/EventRepository.java)
> "Three queries worth a mention:
> - `findAllEventsWithRegistrationStatus(userId)` — LEFT JOIN against `EventParticipant` so the frontend gets `isRegistered` pre-computed.
> - `findByInstitutionId` — joins through `Club` because Event has no direct `institutionId`.
> - `countEventsByMonth()` — groups events by `MONTH(startDate)` to power the trend chart on the Super Admin dashboard."

### [ClubRepository.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/ClubRepository.java), [ClubMemberRepository](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/ClubMemberRepository.java), [LeadershipApplicationRepository](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/LeadershipApplicationRepository.java)
> "Mostly derived queries: `findByInstitutionId`, `countByClubIdAndStatus`, `findByClubIdAndStatus`. Tiny code, huge expressiveness — that's Spring Data JPA's superpower."

## 1.7 Config + Swagger

### [AppConfig.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/AppConfig.java)
> "One bean — a Jackson `ObjectMapper` that registers `JavaTimeModule` so `LocalDateTime` serialises as ISO strings instead of timestamp arrays."

### [SwaggerConfig.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/SwaggerConfig.java)
> "Configures the Swagger UI with four grouped API views — *Student API*, *Institution API*, *Super Admin API* and a global *All APIs* group — so reviewers can browse the endpoints relevant to each role. Also wires the `BearerAuth` security scheme so you can paste a JWT into the Swagger 'Authorize' dialog."

### [SpaForwardingController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/SpaForwardingController.java)
> "When we ship a single-service build (frontend bundled into the Spring JAR), this catch-all forwards every non-API, non-asset request to `index.html`. The regex `{path:[^\\.]*}` excludes anything with a dot, so `script.js` and `logo.png` still hit the static-resource handler. That's how `/dashboard/student` survives a page refresh in production."

## 1.8 Module 1 — Live Demo Flow

1. **Open the running stack** — backend log: `Tomcat started on port(s): 8081`. Frontend: `Local: http://localhost:4200/`.
2. **Open Swagger UI** at `http://localhost:8081/swagger-ui.html` — show the three groups (Student-API, Institution-API, Admin-API).
3. **Open a DB client (or Swagger GET)** → show the 9 tables that Hibernate auto-created from the entities.
4. **Run `curl /actuator/health`** → `{"status":"UP"}` — proof the data layer is live.

## 1.9 Hand-off

> "So that's the spine — Spring Boot 4, eight JPA entities, lean repositories, all backed by MySQL on Aiven. None of this matters unless it's properly secured though — every endpoint we ship has to know **who is calling it and what they are allowed to see**. **Vitesh** will walk you through how Anvay handles authentication, JWT and Spring Security."

---

# MODULE 2 — VITESH
### Security · Authentication · JWT · Frontend Bootstrapping

---

## 2.1 Opening

> "Thanks Swastika. Every API call into Anvay has to answer two questions: *Who is the caller?* and *Are they allowed to do this?* I'll cover both — the Spring Security filter chain and JWT plumbing on the backend, and how the Angular frontend wires authentication end-to-end."

## 2.2 The Spring Security Stack

### [SecurityConfig.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/SecurityConfig.java)
**Walk through line by line:**
- `csrf().disable()` — safe because we are stateless and JWT-based.
- `sessionCreationPolicy(STATELESS)` — no `JSESSIONID` cookie, every request is independently authenticated.
- `permitAll()` on `/api/auth/**` (login + register), `/api/institutions/active` (public list for the registration page), `/swagger-ui/**`, `/actuator/**`.
- `hasRole("SUPER_ADMIN")` on `/api/super-admin/**` — Spring maps to authority `ROLE_SUPER_ADMIN`.
- `anyRequest().authenticated()` — everything else needs a valid JWT.
- `addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)` — slots our filter into the chain so authentication happens before the default user/pass filter would have.
- `corsConfigurationSource()` — reads allowed origins from `app.cors.allowed-origins` (env var) so prod and dev have different lists.
- `@EnableMethodSecurity` lets us add `@PreAuthorize` annotations directly on controller methods or classes — Mathi uses this on `SuperAdminController`.
- `BCryptPasswordEncoder` bean — passwords are never stored in plaintext.

### [JwtUtil.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/JwtUtil.java)
> "This is the JWT factory.
> - `generateToken(email, role, userId, institutionId)` — produces an HS256-signed JWT with those four claims, expiring 24 hours later (`app.jwt.expiration-ms=86400000`). The role and `institutionId` are inside the token, so any controller can trust them without an extra DB lookup.
> - `extractAllClaims(token)` — parses + verifies signature on every protected request.
> - `isTokenValid(token)` — checks expiry. Returns false on any parsing exception, which translates to a 401 downstream."

### [JwtAuthenticationFilter.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/JwtAuthenticationFilter.java)
> "Extends `OncePerRequestFilter` so it runs exactly once per HTTP call. The logic:
> 1. Pull `Authorization` header → strip `Bearer ` prefix.
> 2. Validate signature & expiry via `JwtUtil`.
> 3. Load the `UserDetails` for that email (via `CustomUserDetailsService`).
> 4. Put the resulting `Authentication` into `SecurityContextHolder` so downstream controllers see the principal and role.
>
> If the header is missing or invalid we don't throw — we just don't populate the context, and `anyRequest().authenticated()` returns the 401."

### [CustomUserDetailsService.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/CustomUserDetailsService.java)
> "Bridges our `User` entity to Spring Security. Authority is `ROLE_` + uppercase role — `student` → `ROLE_STUDENT`, `super_admin` → `ROLE_SUPER_ADMIN`. That's how `@PreAuthorize("hasRole('SUPER_ADMIN')")` works on `SuperAdminController`."

### [DataInitializer.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/DataInitializer.java)
> "Runs on every boot via `CommandLineRunner`. Ensures one `super_admin` row exists in the DB seeded from `app.superadmin.*` properties. On subsequent boots it re-encodes the password from properties — that's a deliberate kill-switch so we can rotate the bootstrap password by changing an env var. Without this, no one could log in to bootstrap the platform."

## 2.3 The Authentication Flow

### [AuthController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/AuthController.java)
> "Four endpoints — all `permitAll()`:
> - `POST /api/auth/login` → `LoginResponse` (token + role + name + IDs).
> - `POST /api/auth/register/institution` → creates an `Institution` (status='pending') AND its admin `User`.
> - `POST /api/auth/register/student` → student account tied to an active institution.
> - `POST /api/auth/reset-password` → old password OR the master key (`Admin@123`) lets you reset.
>
> Errors are mapped: `BadCredentialsException` → 401 with a `message` field, `RuntimeException` → 400. The frontend uses that `message` to render a useful error toast."

### [UserServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/UserServiceImpl.java)
> "Key business rule: a student CANNOT log in if their institution's status is not 'active' — we throw `BadCredentialsException` with the message *'Your institution is not active. Please contact your administrator.'* This is what enforces the 'pending → approved' gate from the Super Admin's side. Without this, students of an unverified college could create accounts and slip through."

### [LoginResponse.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/LoginResponse.java)
> "Notice `leadingClubId` — populated only when a club leader logs in, so the frontend knows which club's dashboard to render. The JWT does the auth; the LoginResponse handles the UX routing."

## 2.4 Frontend Bootstrap

### [app.config.ts](frontend/anvay-app/src/app/app.config.ts)
> "Two HTTP interceptors chained in order:
> 1. **`apiPrefixInterceptor`** — when `environment.apiBaseUrl` is set, prepends it to every `/api/...` URL. This is how the same code works both in dev (empty base → proxy hands it off) and in split-prod (frontend on one Render service, backend on another).
> 2. **`jwtInterceptor`** — pulls the token from `AuthService` and adds `Authorization: Bearer ...` to every outbound request. This is why no individual `.get()` / `.post()` call has to think about auth headers.
>
> Order matters — prefix first, then attach the header."

### [app.routes.ts](frontend/anvay-app/src/app/app.routes.ts)
> "Lazy-loaded standalone components — Angular 17 style, no NgModules. Every dashboard has its own guarded route:
> - `/dashboard/super-admin` → `authGuard` with `data.role = 'super_admin'`
> - `/dashboard/institution` → role 'institution'
> - `/dashboard/student` → role 'student'
> - `/dashboard/leader` → role 'club_leader'
> - Login/signup routes have `noAuthGuard` — if you're already signed in they redirect to the correct dashboard.
> - Wildcard `**` → home page."

### [auth.guard.ts](frontend/anvay-app/src/app/guards/auth.guard.ts)
> "Two guards:
> - `authGuard` — checks for a token AND that `authService.getRole()` matches `route.data.role`. Wrong role = bounce to login.
> - `noAuthGuard` — the inverse: if you ARE logged in and you try to hit /login, it routes you to your role's dashboard."

### [auth.service.ts](frontend/anvay-app/src/app/services/auth.service.ts)
> "Three HTTP methods (`login`, `registerInstitution`, `registerStudent`), all using `.pipe(tap(storeUser))` to persist the response into `localStorage` under keys `anvay_token` and `anvay_user`. `getRole()` and `isLoggedIn()` read from there — that's how the guards know who you are without re-hitting the server."

### [login.component.ts](frontend/anvay-app/src/app/auth/login/login.component.ts)
> "Reactive form with email + password validators, plus a **Forgot Password** modal that calls `/api/auth/reset-password` with the master key. On success the `switch(response.role)` jumps to the right dashboard.
>
> Notice the local error-handling — `err.error?.message || 'Login failed.'` — that's why we made AuthController return `{message: ...}` for failures."

### [register.component.ts](frontend/anvay-app/src/app/auth/register/register.component.ts), [register-institution](frontend/anvay-app/src/app/auth/register-institution/register-institution.component.ts), [register-student](frontend/anvay-app/src/app/auth/register-student/register-student.component.ts)
> "The 'register' landing page lets the user choose between *Institution* and *Student*. The two sub-pages collect the right fields and POST to the matching backend endpoint. Student registration also fetches `/api/institutions/active` so the user can only pick a college that's been approved."

### [register-pending.component.ts](frontend/anvay-app/src/app/auth/register-pending/register-pending.component.ts)
> "After an institution registers, we route them here — a 'waiting for Super Admin approval' screen. They can also log in later and the institution dashboard will show the same banner until they're approved."

## 2.5 Module 2 — Live Demo Flow

1. **Show the home page** → click **Sign Up** → choose **Institution** → fill the form → submit. Show that the institution row exists with `status='pending'` (via Swagger or admin login later).
2. **Show DevTools → Network tab** during login — point out the `Authorization: Bearer eyJ...` header that the `jwtInterceptor` adds.
3. **Open Swagger UI** → expand any `/api/super-admin/*` endpoint → click 'Try it out' WITHOUT pasting a token → get **401**. Click 'Authorize', paste a Super Admin token, retry → **200**.
4. **Log in with the wrong password** → show the 401 with the localized message bubbling into the form.
5. **Log in as the institution admin (still pending)** → land on the institution dashboard, which detects `status !== 'active'` and shows the *Awaiting Approval* banner.
6. **Demonstrate the Forgot Password flow** → trigger reset using the master key.

## 2.6 Hand-off

> "So the platform now knows who you are and what role you have. The very first user who can do anything meaningful is the **Super Admin** — they decide which colleges go live, and they have the platform-wide analytics. **Mathi** will walk you through the Super Admin and Institution layer."

---

# MODULE 3 — MATHI
### Super Admin · Institution Lifecycle · Club Management

---

## 3.1 Opening

> "Thanks Vitesh. Once a user is authenticated, what they see depends on their role. I'll cover the two top-of-funnel roles — the **Super Admin** who governs the platform, and the **Institution Admin** who runs a single college. That means the institution approval workflow, club CRUD, member approvals, and the dashboards that drive them."

## 3.2 Super Admin (Backend)

### [SuperAdminController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/SuperAdminController.java)
> "All endpoints are class-level `@PreAuthorize("hasRole('SUPER_ADMIN')")` — anyone else gets 403. Endpoints:
> - `GET /api/super-admin/dashboard` — `DashboardStatsDto` (totals + top 5 colleges + monthly event trends)
> - `GET /api/super-admin/institutions?search=` — list/search all institutions
> - `GET /api/super-admin/institutions/{id}` — single institution
> - `GET /api/super-admin/institutions/{id}/events` and `/clubs`
> - `PUT /api/super-admin/institutions/{id}/approve` and `/deactivate`
> - `GET /api/super-admin/analytics` — platform-wide rankings"

### [SuperAdminServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/SuperAdminServiceImpl.java)
> "`getDashboardStats()` runs parallel counts (`countByStatus`, `countByRole`, `count()`) then `countEventsByMonth()` for the trend chart. Top-5 colleges are computed by ranking institutions by `studentCount`.
>
> `approveInstitution(id)` is the *one* state transition that unblocks everything — it flips status from `pending` → `active`, after which students of that college can register and log in.
>
> `mapToDto()` is doing real work — for every institution it counts students, events, clubs and sums points across `event_participants`."

## 3.3 Super Admin (Frontend)

### [super-admin.component.ts](frontend/anvay-app/src/app/dashboard/super-admin/super-admin.component.ts)
> "Single page, six tabbed views driven by `activeView`: **dashboard**, **colleges**, **events**, **analytics**, **approvals**, **settings**. Tab state is stored in the URL query param `?view=...` so refresh and deep-linking work.
>
> Three interesting bits:
> - `getTrendEntries()` — transforms the month-count map into a percentage bar chart purely in the template, no chart library.
> - **Colleges tab** — list of institutions with status badges and an Approve/Deactivate action. The Approve flow uses a confirmation modal with a 'I verified this institution' checkbox that must be ticked first — guardrail against accidental approvals.
> - **Approvals tab** — `loadPendingWinners()` calls `/api/events/pending-winners` for events where the institution has submitted winners awaiting Super Admin sign-off (Likhitha will demo this end-to-end)."

## 3.4 Institution Module (Backend)

### [InstitutionController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/InstitutionController.java)
> "Lightweight controller — most institution lifecycle (approve/deactivate) lives under Super Admin. This one exposes:
> - `GET /api/institutions` — full list
> - `GET /api/institutions/active` — only approved institutions (this is `permitAll()` so anonymous users can browse before signing up — used by the student registration screen Vitesh showed)
> - `GET /api/institutions/leaderboard` — institutions ranked by total points
> - `PUT /api/institutions/{id}` — admin updates institution details
> - `GET /api/institutions/{id}` — single institution lookup"

### [InstitutionServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/InstitutionServiceImpl.java)
> "`registerInstitution()` does **two** inserts atomically (the class is `@Transactional`):
> 1. New `Institution` row with `status='pending'`.
> 2. New `User` row with role='institution' (the admin), already linked via `institutionId`, password BCrypt-hashed.
>
> A JWT is generated and returned so the admin is auto-logged-in straight after registering, but the dashboard will display a 'pending approval' banner until Super Admin approves them."

## 3.5 Club Management (Backend)

### [ClubController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/ClubController.java)
> "This is the **biggest controller** in the project (~280 lines) because clubs are the hub of everything. I'll group endpoints by responsibility:
>
> **Club CRUD (institution admin)**
> - `POST /api/clubs` — create
> - `PUT /api/clubs/{id}` — update name / category
> - `DELETE /api/clubs/{id}` — delete (cascades to members and events)
> - `GET /api/clubs/institution/{institutionId}` — returns `ClubDashboardDTO[]` with members count, pending join requests count and pending leadership applications count — three SQL counts per club, done in `buildClubDashboardDTO()`.
>
> **Join Request workflow (student → institution / leader)**
> - `POST /api/clubs/{clubId}/join` — student requests to join (status PENDING)
> - `GET /api/clubs/{clubId}/join-requests` — admin sees PENDING requests
> - `PUT /api/clubs/{clubId}/join-requests/{memberId}/approve` — approve, also bumps `user.joinedClubsCount`
> - `PUT /api/clubs/{clubId}/join-requests/{memberId}/reject`
> - `GET /api/clubs/user/{userId}` — what clubs has this user joined / applied to?
>
> **Member management**
> - `GET /api/clubs/{clubId}/members` — all members
> - `GET /api/clubs/{clubId}/members/approved` — approved only (used by Club Leader's roster view)
> - `DELETE /api/clubs/{clubId}/members/{memberId}` — kick member, also decrements `joinedClubsCount`
> - `DELETE /api/clubs/{clubId}/leader/{userId}` — demote leader back to student (sets role='student', clears `leadingClubId`)"

### [ClubServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/ClubServiceImpl.java)
> "Marked `@Transactional` at class level so partial updates don't leak. The clever piece is `buildClubDashboardDTO()` — instead of one heavy join we run three lightweight counts (`countByClubIdAndStatus`) per club. For a college with 20 clubs that's 60 fast queries vs one giant join, and the result is rendered exactly in the shape the table needs."

### [ClubDashboardDTO.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/ClubDashboardDTO.java)
> "Notice we send `type` (the category) over the wire, not `category` — small thing but the frontend's `Club` interface expects `type`, so the DTO contract is what couples them."

## 3.6 Institution Dashboard (Frontend)

### [institution.component.ts](frontend/anvay-app/src/app/dashboard/institution/institution.component.ts)
> "~600 lines — let me walk through the structure rather than every method.
>
> **State at the top:** `activeView` (dashboard / events / clubs / students, URL-driven), `eventForm` and `clubForm` (Reactive Forms with matching backend validators), `selectedClub`, `selectedEvent` (sliding detail panels), `winnersModal` state.
>
> **Bootstrap (`ngOnInit`):**
> 1. Read user from `AuthService`, capture `institutionId`.
> 2. GET `/api/institutions/{id}` — if `status !== 'active'` we flip `isPending` and show a 'Awaiting Super Admin approval' banner instead of the dashboard.
>
> **Clubs tab features (the part I'll demo):**
> - Create / edit / delete club
> - View Members / Pending Join Requests / Leadership Applications via tabs in the right pane (`switchClubTab`)
> - **Approve modal** has a 'I verified this student' checkbox that must be ticked before the confirm button is enabled — same guardrail pattern as the Super Admin approvals.
> - Remove club leader (demotion modal)
>
> **Students tab:**
> - GET `/api/students/institution/{id}/leaderboard`, sorted by points descending.
> - Remove-from-institution action.
>
> Events tab is covered by Likhitha in the next module."

### [institution/club-mgmt/club-mgmt.ts](frontend/anvay-app/src/app/dashboard/institution/club-mgmt/club-mgmt.ts)
> "Granular club-management screen used inside the institution dashboard — the deeper view when you click into a single club."

## 3.7 Module 3 — Live Demo Flow

1. **Log in as Super Admin** (`admin@anvay.com` / `Admin@123`).
2. **Super Admin dashboard** — show total colleges, students, events, monthly trend bar chart, top-5 institutions.
3. **Colleges tab** — show the pending institution (the one Vitesh registered in his demo). Click **Approve** → tick the verification checkbox → confirm. Status flips to `active`, toast fires.
4. **Log out and log in as the institution admin** — landing page is now the live dashboard (no more pending banner).
5. **Clubs tab → Create Club** — name "Tech Club", category "Computer". Submit. New row appears with 0 members.
6. **Quickly create a student account** (other browser / incognito) → student picks the same institution → register.
7. **Student requests to join Tech Club** — toast 'Join request sent'.
8. **Back to institution admin** → Clubs → Tech Club → Pending Requests tab → **Approve** → verification check → confirm. Member count increments.

## 3.8 Hand-off

> "So now we've got an active institution, a club, and members in it. The whole point of clubs is to run **events** — and that's where points, winners, and the most interesting workflow live. **Likhitha** will take you through the Event lifecycle, the winners approval flow, and the Club Leader role."

---

# MODULE 4 — LIKHITHA
### Event Lifecycle · Winners Workflow · Scheduler · Leadership Applications · Club Leader Dashboard

---

## 4.1 Opening

> "Thanks Mathi. Anvay's reason-for-being is *events* — workshops, hackathons, cultural shows. I'll cover everything event-related: the controller, the registration flow, the winners-approval workflow, the background scheduler that auto-ends expired events, the leadership-application path that promotes a student to a Club Leader, and the Club Leader dashboard itself."

## 4.2 Event Management (Backend)

### [EventController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/EventController.java)
> "Endpoints — I'll group them:
>
> **CRUD (institution admin)**
> - `POST /api/events` — create
> - `PUT /api/events/{id}` — partial update (every field is null-checked in service)
> - `DELETE /api/events/{id}`
> - `GET /api/events/club/{clubId}` and `/institution/{institutionId}` — scoped lists
>
> **Student-facing**
> - `GET /api/events/feed?userId&institutionId` — returns `EventFeedDTO[]` with `isRegistered` pre-computed by SQL CASE
> - `POST /api/events/register` — student registers for an event
> - `GET /api/events/my-registrations?userId=` — student's own registrations
>
> **Winners workflow**
> - `GET /api/events/{eventId}/participants` — admin / club leader sees the roster to pick winners from
> - `POST /api/events/{eventId}/award-winners` — institution submits 1st/2nd/3rd (status = 'pending')
> - `POST /api/events/{eventId}/approve-winners` — Super Admin approves, points awarded
> - `GET /api/events/pending-winners` — feeds the Super Admin's Approvals tab
> - `PUT /api/events/{eventId}/end` — manual override to close an event"

### [EventServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/EventServiceImpl.java)
> "Three pieces worth explaining in depth:
>
> **1. `registerParticipant()`** — does TWO things in one transaction:
>   (a) save the `EventParticipant` record with status 'REGISTERED' and timestamp,
>   (b) increment `user.registeredEventsCount`.
>
> **2. Winners workflow** — `submitWinners` checks the event isn't already submitted (`winnersStatus` must be null), stores three FKs and sets status='pending'. `approveWinners` then calls `awardPoints(userId, 100|75|50)` for each, which bumps the user's `totalPoints` AND writes `points_earned` onto the participant row (so we have an audit trail of how many points each registration earned).
>
> **3. `getEventsForStudent()`** uses a custom JPQL — it does a LEFT JOIN against `EventParticipant` to compute `isRegistered` server-side, so the frontend doesn't need a second round-trip to know which buttons to disable. The query filters by `c.institutionId = :institutionId OR e.participantType = 'all'`, so events open to all institutions also surface."

### [EventScheduler.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/scheduler/EventScheduler.java)
> "This is what Swastika's `@EnableScheduling` was for. Every 5 minutes (`fixedRate = 300_000`), it scans for events whose `endDate` has passed and status isn't 'ended', and marks them ended. Without this, expired events would linger as 'active' until someone manually closed them. The method is `@Transactional` so the batch update is atomic."

## 4.3 Leadership Applications (Backend)

### [LeadershipApplicationController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/LeadershipApplicationController.java)
> "Tiny but powerful:
> - `POST /api/leadership-applications` — student submits experience essay
> - `GET /api/leadership-applications/club/{clubId}/pending` — admin sees pending apps for a club
> - `GET /api/leadership-applications/user/{userId}` — student sees their own apps
> - `PUT /api/leadership-applications/{id}/approve` — this is the **role promotion**: it sets `user.role='club_leader'` and `user.leadingClubId=clubId`. Next time that user logs in, the `noAuthGuard` routes them to `/dashboard/leader` instead of `/dashboard/student`.
> - `PUT /api/leadership-applications/{id}/reject`"

### [LeadershipApplication.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/LeadershipApplication.java)
> "The `@PrePersist` hook auto-fills `appliedAt = now()` and `status = 'pending'` so the frontend doesn't have to."

## 4.4 The Events Tab on the Institution Dashboard

### [institution.component.ts — Events portion](frontend/anvay-app/src/app/dashboard/institution/institution.component.ts)
> "Picking up where Mathi left off — the Events tab in the institution dashboard:
>
> - **Search** by name / category / location, **filters** by date range and category.
> - Three buckets: `upcomingEventsInst`, `currentEventsInst`, `pastEventsInst` — pure getters that re-filter on each render.
> - **Image upload** via `FileReader.readAsDataURL` → base64 string in `eventImageData`, sent as `imageData` field.
> - **Client-side validation**: end date must be after start date, registration deadline must be before start AND not in the past. The regex validators (`contactNumber`, `eventName`) mirror the entity validators — backend is the safety net, client-side keeps UX snappy.
> - **`maxParticipants` slider + input** — coupled so dragging the slider updates the input and vice-versa, clamped to [1, 1000].
> - **Per-event action menu**: Edit, End, Delete, View Participants, **Submit Winners** (only shown after the event ends and only once — `winnersStatus` freezes the modal).
> - **Winners modal** — pulls participants via `/api/events/{id}/participants`, three dropdowns for 1st/2nd/3rd, posts to `award-winners`. After submit, status='pending' and the row is locked until Super Admin approves."

## 4.5 Club Leader Dashboard (Frontend)

### [club-leader.component.ts](frontend/anvay-app/src/app/dashboard/club-leader/club-leader.component.ts)
> "A club leader is effectively a *student with extra powers*. The component reuses every student-side feature (events feed, leaderboard, profile) AND adds two new tabs:
>
> - **Requests** — pending join-requests for THEIR club only (`/api/clubs/{leadingClubId}/join-requests`). Approve / reject.
> - **Members** — current approved roster (`/api/clubs/{leadingClubId}/members/approved`).
>
> The promotion path is the magic: when a leadership application is approved by the institution admin, the user's existing JWT becomes stale. On next login they get a fresh token where `role='club_leader'`, and the `authGuard` then routes them to `/dashboard/leader`."

## 4.6 Module 4 — Live Demo Flow

1. **Continuing from Mathi's demo** — still logged in as institution admin.
2. **Events tab → Create Event** — name "Hackathon", category "Hackathon", attach to Tech Club, contact number, location, dates, max 50 participants, registration deadline tomorrow. Upload an image. Save → toast 'Event created!'.
3. **Switch to the student account** → Events tab → carousel shows the new Hackathon. Click → registration modal → confirm. Button turns green.
4. **Student submits a leadership application** → Clubs → Tech Club → 'Apply for Leadership' → enter experience text → submit.
5. **Admin approves the leadership application** → Tech Club → Leadership tab → Approve. Toast fires.
6. **Student logs out and back in** → now lands at `/dashboard/leader` automatically. Badge says 'Club Leader'.
7. **Club Leader → Requests tab** — show that they can independently approve future join requests for their own club.
8. **Back to admin** — go to an ended event (or end the Hackathon manually for the demo) → **Submit Winners** modal → pick three participants → submit. Status changes to 'pending — awaiting Super Admin approval'.
9. **Log in as Super Admin → Approvals tab** — the pending winner submission is visible → Approve. Backend awards 100/75/50 points.
10. **Show the scheduler in logs** — `log.info("Auto-ended {} expired event(s)", count)` appears every 5 minutes. (Or set an event's endDate to 1 minute ago, wait for the next tick, show the status flip in the DB.)

## 4.7 Hand-off

> "So institutions can now run events end-to-end, winners get rewarded with points, and we have a Club Leader role that can self-manage their club. But everything we've built feeds **one** user — the student. **Mithun** will close out with the student experience, the chatbot, the shared UI widgets, and how we deploy the whole stack."

---

# MODULE 5 — MITHUN
### Student Experience · Chatbot · Shared Widgets · Deployment

---

## 5.1 Opening

> "Thanks Likhitha. Everything we've built so far is plumbing — the real users of Anvay are the **students**, and they'll interact with this product more than any other role. In this module I'll walk through the student-side backend, the student dashboard, the shared widgets (the support chatbot and toast notifications), our global exception handling, and finally how we deploy the whole thing."

## 5.2 Student Module (Backend)

### [StudentController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/StudentController.java)
> "Six endpoints — every one of them is the source-of-truth for some piece of the student UI.
> - `GET /api/students/{id}/dashboard` — aggregate `StudentDashboardDTO` (the home page)
> - `GET /api/students/{id}/profile` — full profile
> - `GET /api/students/institution/{id}/leaderboard` — points-ranked classmates
> - `GET /api/students/leaderboard` — global leaderboard
> - `GET /api/students` — all students (admin)
> - `DELETE /api/students/{id}` — soft remove (nulls `institutionId`, doesn't delete the user)"

### [StudentServiceImpl.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/StudentServiceImpl.java)
> "`getFullDashboard()` is the key method. It assembles a single payload that drives the entire dashboard view:
> 1. Fetch the user.
> 2. Pull their `eventRegistrations` collection and map to up to 3 upcoming events.
> 3. Fetch their achievements via `AchievementRepository`.
> 4. **Compute rank** — pull the institution's students sorted by points and find this user's index + 1.
> 5. Return a flat DTO with firstName, institution, totalPoints, rank, registeredEventsCount, joinedClubsCount, achievementCount, upcomingEvents.
>
> The DTO is the contract — frontend doesn't need to know about JPA relationships or fetch types, just consumes the JSON."

### [StudentDashboardDTO.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/StudentDashboardDTO.java)
> "Notice the nested `EventRecord`, `ClubRecord`, `AchievementRecord` static classes — keeps the DTO self-contained and lets Lombok generate builders for each."

### [MemberController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/MemberController.java) + [AchievementController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/AchievementController.java)
> "Lightweight surfaces — `/api/members` mirrors `/api/students` for admin views, and `/api/achievements` is currently a stub we've scaffolded for a future iteration where students can earn certificate-style badges beyond winner points."

## 5.3 The Chatbot (Backend)

### [ChatController.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/ChatController.java)
> "Single endpoint `POST /api/chat`. Notice the rich Swagger annotations — when you open Swagger UI for this controller, you see the full description, example payload and example response. We made a deliberate choice to write good OpenAPI docs here because the chatbot's intent must be crystal clear."

### [ChatbotService.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/ChatbotService.java)
> "This is a **rule-based, offline chatbot** — no LLM, no external API, no cost.
>
> On startup (`@PostConstruct loadKnowledgeBase`) it reads [chatbot_responses.json](anvay/anvay/src/main/resources/chatbot_responses.json) — each entry has a `category`, a list of `keywords`, and a `response` string.
>
> `processMessage(text)`:
> 1. Lowercase, strip punctuation, collapse whitespace.
> 2. For each entry, for each keyword: short keywords (≤4 chars) match only as whole-word (regex `\b...\b`), longer ones use substring match.
> 3. First match wins.
> 4. No match → fallback: *'I can answer only the queries regarding the multi-tenant pod 2.'*
>
> The knowledge base can be hot-edited without recompiling — only a server restart is needed. This was a conscious decision to keep the bot purely platform-scoped and never hallucinate."

## 5.4 The Student Frontend

### [student.component.ts](frontend/anvay-app/src/app/dashboard/student/student.component.ts)
> "~540 lines, five tabbed views. Walk through what each tab does:
>
> **Dashboard tab** — GET `/api/students/{id}/dashboard` → tile cards (points, rank, registered events, joined clubs, achievements) + upcoming events list.
>
> **Events tab**
> - Two sub-tabs — 'Feed' and 'My Registrations'.
> - Feed: GET `/api/events/feed?userId&institutionId` — returns events from your institution + global 'all' events, each with `isRegistered` pre-computed.
> - **Search with debounce** — RxJS `Subject` + `debounceTime(300)` + `distinctUntilChanged` powers the live suggestions dropdown.
> - **Auto-rotating carousel** — `setInterval` every 3.5s, shows the next 4 featured upcoming events; pauses on hover.
> - **Wishlist** — purely client-side, persisted in `localStorage` keyed by user ID.
> - **Registration confirmation modal** — prevents accidental clicks.
> - **Three buckets**: upcoming / current / past, computed via getters.
> - **`isEventOpen()`** — encapsulates the rule 'event is not ended AND deadline hasn't passed'.
>
> **Clubs tab**
> - GET `/api/clubs/institution/{id}` (all clubs in your college)
> - GET `/api/clubs/user/{userId}` to know which clubs you're already in / have pending requests for.
> - Buttons change based on state: 'Join' / 'Pending' / 'Joined ✓' / 'Apply for Leadership'.
>
> **Leaderboard tab**
> - Three sub-tabs — My Institution, Global Students, Colleges (institutions ranked).
> - Pure GETs, sorted client-side as a defensive double-sort.
>
> **Profile tab**
> - GET `/api/students/{id}/profile`
> - Profile picture upload — base64 stored in `localStorage` (lightweight, no backend touch yet — known limitation on the backlog).
> - **SVG line chart of event trends** — `chartPoints` and `chartDots` getters compute the SVG `points` attribute directly from `eventTrendData`. No charting library, just SVG math.
>
> **Notifications** — `buildNotifications()` derives a list from current state (pending club requests, pending leadership apps). Bell icon shows count badge."

## 5.5 Shared Widgets

### [chat-widget.component.ts](frontend/anvay-app/src/app/shared/chat-widget/chat-widget.component.ts)
> "Imported by every dashboard component. A floating bubble in the corner that expands to a chat panel. Six **quick-reply chips** pre-seed common questions ('How do I register for an event?', 'How does the points system work?' etc.) so users don't have to type.
>
> Sends through [chat.service.ts](frontend/anvay-app/src/app/services/chat.service.ts) which POSTs `{message, userId, institutionId}` to `/api/chat`. Renders the reply in a chat bubble timeline. Scroll-to-bottom on every message via `AfterViewChecked`."

### [toast.component.ts](frontend/anvay-app/src/app/shared/toast/toast.component.ts) + [notification.service.ts](frontend/anvay-app/src/app/services/notification.service.ts)
> "Lightweight global toast system. The service exposes `showSuccess/showError/showWarning/showInfo`, holds a `BehaviorSubject<Toast[]>`, auto-dismisses each toast after 4–5 seconds. The `<app-toast>` element sits at the root of [app.component.ts](frontend/anvay-app/src/app/app.component.ts) so it's always mounted. Any component anywhere in the app can `inject(NotificationService)` and fire a toast."

## 5.6 Exception Handling

### [GlobalExceptionHandler.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/exception/GlobalExceptionHandler.java)
> "`@RestControllerAdvice` is wired across every controller. Three handlers:
> - `MethodArgumentNotValidException` → `{field: errorMessage}` map (so the frontend can highlight the offending input)
> - `IllegalArgumentException` → 400 with `ErrorResponse`
> - `ResourceNotFoundException` → 404
> - Catch-all `Exception` → 500 with a **generic** message — we deliberately don't leak stack traces to clients, only to server logs."

## 5.7 Deployment

### [Dockerfile](Dockerfile)
> "Single-service deploy: multi-stage build — stage one runs `mvnw package -DskipTests`, stage two is a slim JRE image running the fat JAR."

### [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
> "Documents how the app is hosted on Render — environment variables (`DB_URL`, `JWT_SECRET`, `APP_CORS_ALLOWED_ORIGINS`), `/actuator/health` as the health probe, and the trick where `server.port=${PORT:8080}` lets Render inject its assigned port while still defaulting to 8080 locally."

### [SETUP.md](SETUP.md)
> "End-to-end Codespaces walkthrough — adding the `DB_PASSWORD` secret, rebuilding the container, starting backend and frontend, troubleshooting the proxy and Aiven IP allowlist."

## 5.8 Module 5 — Live Demo Flow

> "Closing with the full student experience."

1. **Log in as a student.** Land on the dashboard.
2. **Dashboard tab** — show the 5 tiles (points, rank, registered events, joined clubs, achievements). Show the 'Upcoming Events' strip.
3. **Events tab → Feed** — show the auto-rotating carousel at the top, the search box with live suggestions, the three buckets below.
4. **Switch to 'My Registrations'** sub-tab → the events we registered for during Likhitha's demo are there.
5. **Clubs tab** — show the 'Joined ✓' / 'Pending' button states.
6. **Leaderboard tab** — institution / global / colleges sub-tabs. After the winners approval from Module 4, our points should now be ranked.
7. **Profile tab** — upload a profile picture (instant preview via base64). Show the SVG event-trend chart.
8. **Open the chat widget** (bottom-right) → click 'How do I register for an event?' quick-reply → bot pulls the answer from `chatbot_responses.json`. Then type `'foobar'` → fallback message.
9. **Show toast system** by triggering any action — toast slides in top-right and auto-dismisses.
10. **Open Swagger UI one final time** → show the `/api/chat` operation with 'Try it out' → POST `{"message":"how do points work?"}` → response appears.
11. **Wrap up** — `curl /actuator/health` returning `{"status":"UP"}` to confirm everything we've shown is one cohesive, healthy stack.

## 5.9 Closing Statement (whole team)

> "To recap what we showed you:
> - **Swastika** — the architecture, tech stack, and the 8-entity data model that everything sits on.
> - **Vitesh** — how we secure that data: Spring Security, JWT, BCrypt, and the auth flow end-to-end across backend and frontend.
> - **Mathi** — the Super Admin and Institution Admin layer: institution lifecycle, club CRUD, member approvals.
> - **Likhitha** — events end-to-end: create, register, winners workflow, the auto-end scheduler, the leadership application that promotes students to Club Leader.
> - **Mithun** — the Student experience: events feed with carousel and wishlist, leaderboard across three scopes, profile with SVG analytics, the offline support chatbot, toast notifications, global exception handling and deployment.
>
> Anvay is **one codebase, four roles, one shared database, four completely tailored UIs**. We're happy to take questions on any part of the stack."

---

# Appendix A — File Index by Module

### Module 1 — Swastika (Foundation)
- Backend: [AnvayApplication.java](anvay/anvay/src/main/java/com/cts/mfrp/anvay/AnvayApplication.java), [pom.xml](anvay/anvay/pom.xml), [application.properties](anvay/anvay/src/main/resources/application.properties), all 8 entities ([User](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/User.java), [Institution](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Institution.java), [Club](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Club.java), [ClubMember](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/ClubMember.java), [Event](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Event.java), [EventParticipant](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/EventParticipant.java), [Achievement](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/Achievement.java), [LeadershipApplication](anvay/anvay/src/main/java/com/cts/mfrp/anvay/entity/LeadershipApplication.java)), all repositories ([User](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/UserRepository.java), [Institution](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/InstitutionRepository.java), [Club](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/ClubRepository.java), [ClubMember](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/ClubMemberRepository.java), [Event](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/EventRepository.java), [EventParticipant](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/EventParticipantRepository.java), [Achievement](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/AchievementRepository.java), [LeadershipApplication](anvay/anvay/src/main/java/com/cts/mfrp/anvay/repository/LeadershipApplicationRepository.java)), [AppConfig](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/AppConfig.java), [SwaggerConfig](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/SwaggerConfig.java), [SpaForwardingController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/SpaForwardingController.java).

### Module 2 — Vitesh (Security & Auth)
- Backend: [SecurityConfig](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/SecurityConfig.java), [JwtUtil](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/JwtUtil.java), [JwtAuthenticationFilter](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/JwtAuthenticationFilter.java), [CustomUserDetailsService](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/CustomUserDetailsService.java), [DataInitializer](anvay/anvay/src/main/java/com/cts/mfrp/anvay/config/DataInitializer.java), [AuthController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/AuthController.java), [UserServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/UserServiceImpl.java), [LoginRequest](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/LoginRequest.java), [LoginResponse](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/LoginResponse.java), [RegisterStudentRequest](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/RegisterStudentRequest.java), [RegisterInstitutionRequest](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/RegisterInstitutionRequest.java).
- Frontend: [app.routes.ts](frontend/anvay-app/src/app/app.routes.ts), [app.config.ts](frontend/anvay-app/src/app/app.config.ts), [auth.guard.ts](frontend/anvay-app/src/app/guards/auth.guard.ts), [auth.service.ts](frontend/anvay-app/src/app/services/auth.service.ts), [login.component.ts](frontend/anvay-app/src/app/auth/login/login.component.ts), [register.component.ts](frontend/anvay-app/src/app/auth/register/register.component.ts), [register-institution.component.ts](frontend/anvay-app/src/app/auth/register-institution/register-institution.component.ts), [register-student.component.ts](frontend/anvay-app/src/app/auth/register-student/register-student.component.ts), [register-pending.component.ts](frontend/anvay-app/src/app/auth/register-pending/register-pending.component.ts), [home.component.ts](frontend/anvay-app/src/app/home/home.component.ts), [user.model.ts](frontend/anvay-app/src/app/models/user.model.ts).

### Module 3 — Mathi (Super Admin + Institution + Clubs)
- Backend: [SuperAdminController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/SuperAdminController.java), [SuperAdminServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/SuperAdminServiceImpl.java), [InstitutionController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/InstitutionController.java), [InstitutionServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/InstitutionServiceImpl.java), [ClubController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/ClubController.java), [ClubServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/ClubServiceImpl.java), [ClubDashboardDTO](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/ClubDashboardDTO.java), [InstitutionDto](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/InstitutionDto.java), [DashboardStatsDto](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/DashboardStatsDto.java), [AnalyticsDto](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/AnalyticsDto.java).
- Frontend: [super-admin.component.ts](frontend/anvay-app/src/app/dashboard/super-admin/super-admin.component.ts), [institution.component.ts](frontend/anvay-app/src/app/dashboard/institution/institution.component.ts) (Clubs + Students tabs), [club-mgmt.ts](frontend/anvay-app/src/app/dashboard/institution/club-mgmt/club-mgmt.ts), [club.service.ts](frontend/anvay-app/src/app/services/club.service.ts), [club.model.ts](frontend/anvay-app/src/app/models/club.model.ts).

### Module 4 — Likhitha (Events + Leadership + Club Leader)
- Backend: [EventController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/EventController.java), [EventServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/EventServiceImpl.java), [EventScheduler](anvay/anvay/src/main/java/com/cts/mfrp/anvay/scheduler/EventScheduler.java), [LeadershipApplicationController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/LeadershipApplicationController.java), [ApplicationServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/ApplicationServiceImpl.java), [EventFeedDTO](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/EventFeedDTO.java), [WinnersApprovalDTO](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/WinnersApprovalDTO.java).
- Frontend: [institution.component.ts](frontend/anvay-app/src/app/dashboard/institution/institution.component.ts) (Events tab + Winners modal), [club-leader.component.ts](frontend/anvay-app/src/app/dashboard/club-leader/club-leader.component.ts), [leadership.service.ts](frontend/anvay-app/src/app/services/leadership.service.ts).

### Module 5 — Mithun (Student + Chatbot + Cross-Cutting)
- Backend: [StudentController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/StudentController.java), [StudentServiceImpl](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/impl/StudentServiceImpl.java), [MemberController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/MemberController.java), [AchievementController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/AchievementController.java), [ChatController](anvay/anvay/src/main/java/com/cts/mfrp/anvay/controller/ChatController.java), [ChatbotService](anvay/anvay/src/main/java/com/cts/mfrp/anvay/service/ChatbotService.java), [chatbot_responses.json](anvay/anvay/src/main/resources/chatbot_responses.json), [StudentDashboardDTO](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/StudentDashboardDTO.java), [ChatRequest](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/ChatRequest.java), [ChatResponse](anvay/anvay/src/main/java/com/cts/mfrp/anvay/dto/ChatResponse.java), [GlobalExceptionHandler](anvay/anvay/src/main/java/com/cts/mfrp/anvay/exception/GlobalExceptionHandler.java), [ErrorResponse](anvay/anvay/src/main/java/com/cts/mfrp/anvay/exception/ErrorResponse.java), [ResourceNotFoundException](anvay/anvay/src/main/java/com/cts/mfrp/anvay/exception/ResourceNotFoundException.java).
- Frontend: [student.component.ts](frontend/anvay-app/src/app/dashboard/student/student.component.ts), [student-dashboard.component.ts](frontend/anvay-app/src/app/dashboard/student/student-dashboard/student-dashboard.component.ts), [event-feed.component.ts](frontend/anvay-app/src/app/dashboard/student/event-feed/event-feed.component.ts), [leaderboard.component.ts](frontend/anvay-app/src/app/dashboard/student/leaderboard/leaderboard.component.ts), [student-profile.component.ts](frontend/anvay-app/src/app/dashboard/student/student-profile/student-profile.component.ts), [chat-widget.component.ts](frontend/anvay-app/src/app/shared/chat-widget/chat-widget.component.ts), [chat.service.ts](frontend/anvay-app/src/app/services/chat.service.ts), [toast.component.ts](frontend/anvay-app/src/app/shared/toast/toast.component.ts), [notification.service.ts](frontend/anvay-app/src/app/services/notification.service.ts).
- Cross-cutting: [Dockerfile](Dockerfile), [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md), [SETUP.md](SETUP.md), [STARTUP_GUIDE.md](anvay/anvay/STARTUP_GUIDE.md).

---

# Appendix B — Expected Q&A Cheatsheet

| Likely question | Answer |
| --- | --- |
| "Why JWT instead of sessions?" | Stateless backend → easy horizontal scaling on Render. No sticky-session config needed. |
| "Why BCrypt?" | Industry standard, adaptive cost factor, salt per password. We never compare plaintext. |
| "How do you prevent cross-tenant data leaks?" | Every entity owns `institutionId`. Every relevant query filters by it. JWT carries `institutionId` so we can defend at the controller layer too. |
| "What happens if Aiven goes down?" | The app fails fast on boot (the `${DB_URL}` placeholder forces it). For running instances, the actuator health probe goes red and Render restarts the service. |
| "Why a rule-based chatbot, not an LLM?" | Three reasons: zero recurring cost, deterministic answers scoped to our product, no hallucinations. The knowledge base is hot-editable JSON. |
| "How do you handle image storage?" | Base64 in MySQL `LONGTEXT`. Simple, transactional with the rest of the record. Not optimal at huge scale — we'd move to S3 in a future iteration. |
| "What's the testing story?" | A bootstrap test exists at [AnvayApplicationTests.java](anvay/anvay/src/test/java/com/cts/mfrp/anvay/AnvayApplicationTests.java); component `.spec.ts` files are scaffolded on the frontend. Expanded unit/integration coverage is a near-term roadmap item. |
| "How would you add OAuth / Google Sign-In?" | Add `spring-boot-starter-oauth2-client` + OAuth2 resource-server config, plug the resolved user into our existing `User` entity by email. Frontend gains a 'Sign in with Google' button. |
| "How does role promotion (student → club leader) actually work?" | When `/api/leadership-applications/{id}/approve` is called, the user's `role` is set to `club_leader` and `leadingClubId` is populated. They get a fresh JWT on next login, the `authGuard` reads the new role from `localStorage` and routes them to `/dashboard/leader`. |
| "What happens after Super Admin approves winners?" | `EventServiceImpl.approveWinners` calls `awardPoints` for each winner (100/75/50) which bumps `user.totalPoints` AND writes `points_earned` onto the participant row for audit. `winnersStatus` is set to `'approved'` so it can't be re-submitted. |
