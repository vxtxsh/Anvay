# # syntax=docker/dockerfile:1.7
# #
# # Anvay — Multi-stage Dockerfile (single-service deploy on Render)
# #
# # Stage 1 (frontend-builder)  → Builds the Angular 17 app
# # Stage 2 (backend-builder)   → Bakes Angular output into Spring Boot's static
# #                                resources, then packages the fat JAR
# # Stage 3 (runtime)           → ~80 MB JRE-only image that runs the JAR
# #
# # The frontend is served by Spring Boot from /, eliminating CORS entirely.
# # Render injects $PORT — bind via `server.port=${PORT:8080}` in
# # application.properties so this image is portable.

# # ─────────────────────────────────────────────────────────────────────────────
# # STAGE 1 — Frontend (Angular 17 → static bundle)
# # ─────────────────────────────────────────────────────────────────────────────
# FROM node:20-alpine AS frontend-builder
# WORKDIR /frontend

# # Copy lockfile first to maximize Docker layer cache: dependency installs
# # only re-run when package*.json changes, not on every source edit.
# COPY frontend/anvay-app/package.json frontend/anvay-app/package-lock.json ./
# RUN npm ci --no-audit --no-fund

# # Now copy the rest of the Angular source.
# COPY frontend/anvay-app/ ./

# # Angular 17's `application` builder produces dist/<project>/browser.
# # Note: the legacy `--prod` flag was removed in Angular 12; production is the
# # default for `ng build` and `npm run build` here.
# RUN npm run build

# # Verify the expected output path exists — fails fast if angular.json's
# # outputPath was changed without updating this Dockerfile.
# RUN test -d /frontend/dist/anvay-app/browser

# # ─────────────────────────────────────────────────────────────────────────────
# # STAGE 2 — Backend (Maven + Java 21 → fat JAR with embedded UI)
# # ─────────────────────────────────────────────────────────────────────────────
# FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
# WORKDIR /backend

# # Cache Maven deps independently of source: copy POM + wrapper, fetch deps,
# # *then* copy source. This keeps `mvn package` fast on incremental builds.
# COPY anvay/anvay/.mvn ./.mvn
# COPY anvay/anvay/mvnw anvay/anvay/pom.xml ./
# RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

# # Copy backend source.
# COPY anvay/anvay/src ./src

# # Embed the Angular bundle into Spring Boot's classpath static resources.
# # Spring Boot auto-serves files from src/main/resources/static at /, so
# # index.html and bundled JS/CSS ship inside the JAR — same origin, no CORS.
# COPY --from=frontend-builder /frontend/dist/anvay-app/browser ./src/main/resources/static

# # Build the JAR. Tests are skipped here; run them in CI before image build.
# RUN ./mvnw clean package -DskipTests -B

# # Sanity check + normalize the artifact name so the runtime stage is stable.
# RUN cp target/*.jar /backend/app.jar && ls -lh /backend/app.jar

# # ─────────────────────────────────────────────────────────────────────────────
# # STAGE 3 — Runtime (JRE only, no Maven, no Node, no source)
# # ─────────────────────────────────────────────────────────────────────────────
# FROM eclipse-temurin:21-jre-alpine
# WORKDIR /app

# # Run as a non-root user — best practice for container security.
# RUN addgroup -S anvay && adduser -S anvay -G anvay
# USER anvay

# # Pull only the final JAR from the builder. Nothing else makes it into the
# # runtime image: ~80 MB total instead of >500 MB if we kept the full builder.
# COPY --from=backend-builder --chown=anvay:anvay /backend/app.jar /app/app.jar

# # Documentation only — Render routes traffic to whatever $PORT the app binds.
# # To run locally: `docker run -p 8080:8080 -e PORT=8080 -e DB_PASSWORD=... anvay`
# EXPOSE 8080

# # Note: every config value (DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, PORT)
# # is read from environment variables at runtime — no secrets baked in.
# # Pass JAVA_OPTS at runtime if you need GC/heap tuning:
# #   -e JAVA_OPTS="-Xmx512m -XX:+UseG1GC"
# ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# Stage 1: build
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN mkdir -p /tmp/uploads
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
