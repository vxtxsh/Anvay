# Anvay — Setup Guide

Anvay is a multi-tenant campus event management platform built with **Spring Boot 4** (Java 21) and **Angular 17**. This guide walks a new developer through setting up a GitHub Codespace, configuring secrets, and running the stack end-to-end.

---

## Repository Layout

```
ANVAY-POD-2/
├── anvay/anvay/                 # Spring Boot backend (Maven)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/resources/application.properties
└── frontend/anvay-app/          # Angular 17 frontend
    ├── package.json
    ├── proxy.conf.json          # Forwards /api → backend
    └── src/
```

> **Ports used:** Backend `8081`, Frontend `4200`.

---

## 1. GitHub Codespaces Initialization

### 1.1 Create / Open the Codespace
- [ ] On GitHub, click **Code → Codespaces → Create codespace on `main`**.
- [ ] Wait for the bottom-right toast to read **"Finished setting up codespace"** before opening any terminal. Post-create scripts install Java 21 and Node.js — running commands too early gives `command not found`.

### 1.2 Verify Toolchain
Run these in the integrated terminal once setup completes:

```bash
java -version       # expect 21.x
node -v             # expect 18.x or 20.x
npm -v
```

If `java -version` reports anything other than 21, run:

```bash
sudo update-alternatives --config java   # pick the java-21 entry
```

### 1.3 Recommended VS Code Extensions
Install these into the Codespace (they auto-sync per repo if added to `.devcontainer/devcontainer.json`):

- [ ] **Extension Pack for Java** (`vscjava.vscode-java-pack`)
- [ ] **Spring Boot Dashboard** (`vscjava.vscode-spring-boot-dashboard`)
- [ ] **Angular Language Service** (`Angular.ng-template`)
- [ ] **ESLint** (`dbaeumer.vscode-eslint`)

### 1.4 Database Service
Anvay uses a **managed Aiven MySQL instance** by default (see `application.properties`) — there is **no local MySQL to start** in the Codespace. You only need a working network connection and the `DB_PASSWORD` secret set.

If you switch to a local MySQL during development:

```bash
sudo service mysql start
sudo mysql -u root -p -e "CREATE DATABASE campus_management;"
```

…and uncomment the `localhost:3306` block in `application.properties`.

---

## 2. Backend Configuration (`application.properties`)

The file lives at `anvay/anvay/src/main/resources/application.properties`. Sensitive values must **never** be committed in plaintext.

### 2.1 Required Secrets
The application currently expects this environment variable:

| Variable      | Purpose                          | Where used in `application.properties` |
| ------------- | -------------------------------- | -------------------------------------- |
| `DB_PASSWORD` | Aiven MySQL password (`avnadmin`) | `spring.datasource.password=${DB_PASSWORD}` |

### 2.2 Set Secrets via Codespaces (Recommended)
1. Go to **GitHub → Repository → Settings → Secrets and variables → Codespaces**.
2. Click **New repository secret** and add `DB_PASSWORD` with the Aiven password.
3. **Rebuild** the Codespace (Command Palette → *Codespaces: Rebuild Container*) so the secret is injected into `$DB_PASSWORD`.
4. Verify inside the Codespace terminal:
   ```bash
   echo $DB_PASSWORD   # should print the password
   ```

> Codespace secrets are exposed as environment variables at runtime and are never written to disk — this is strictly better than hardcoding.

### 2.3 Adding More Secrets (Mail / API Keys)
When new integrations are added (mail, payment, third-party APIs):

1. Add a placeholder in `application.properties`, e.g.:
   ```properties
   spring.mail.password=${MAIL_PASSWORD}
   stripe.api.key=${STRIPE_API_KEY}
   ```
2. Add the matching secret in **Settings → Secrets and variables → Codespaces**.
3. Document it in the table above.

### 2.4 What You Should NOT Edit
- `app.jwt.secret` — only rotate in coordination with the team; changing it invalidates every active session.
- `app.superadmin.*` — hardcoded bootstrap admin used to seed the platform on first run.

---

## 3. Running the Application

### 3.1 Start the Backend (Spring Boot)
```bash
cd anvay/anvay
chmod +x mvnw          # one-time, Linux only
./mvnw spring-boot:run
```

- [ ] Watch for `Tomcat started on port(s): 8081` in the log.
- [ ] Verify Swagger UI: open `http://localhost:8081/swagger-ui.html` in the Codespaces preview.

### 3.2 Start the Frontend (Angular)
In a **second terminal**:

```bash
cd frontend/anvay-app
npm install            # first run only, ~2-3 minutes
npm start              # runs: ng serve --proxy-config proxy.conf.json
```

- [ ] Watch for `Application bundle generation complete` and `Local: http://localhost:4200/`.
- [ ] The dev proxy (`proxy.conf.json`) forwards `/api/**` → `http://localhost:8081`, so the frontend talks to the backend without CORS configuration in development.

### 3.3 Codespaces Port Forwarding
GitHub Codespaces auto-detects forwarded ports. Open the **PORTS** tab (bottom panel) and:

- [ ] Confirm `8081` and `4200` are listed.
- [ ] Right-click each → **Port Visibility → Public** *only if* you need to share the URL with someone outside the Codespace. For solo dev, leave them **Private** (default — secure, requires GitHub auth).
- [ ] Click the globe icon next to `4200` to open the Angular app in a browser tab.

> **Important:** the proxy uses `localhost:8081`, which works because both ports are on the same Codespace VM. Do not change the proxy target to a public Codespaces URL — it will break.

---

## 4. Troubleshooting

### 4.1 Verify Frontend ↔ Backend Connectivity
With both servers running, in the Angular app's browser tab open DevTools → Network. Trigger any login or page load:

- [ ] You should see requests to `/api/...` returning `200`/`401` (not `404`/`502`).
- [ ] In the Codespace terminal running Angular, `[HPM]` log lines (proxy debug) confirm requests are being forwarded.

Quick smoke test from the Codespace terminal:
```bash
curl -i http://localhost:8081/v3/api-docs   # should return JSON
curl -i http://localhost:4200/api/auth/health   # should hit backend via proxy
```

### 4.2 "Database Connection Refused" / `Communications link failure`

| Symptom                                   | Likely cause                                    | Fix |
| ----------------------------------------- | ----------------------------------------------- | --- |
| `Access denied for user 'avnadmin'`       | `DB_PASSWORD` secret missing or wrong           | Re-add the secret in repo Codespaces settings, then **rebuild** the Codespace (not just restart). |
| `Communications link failure`             | Codespace network blocked, or Aiven IP allowlist | Check Aiven dashboard → allow `0.0.0.0/0` for dev, or whitelist the Codespace egress IP. |
| `Unknown database 'defaultdb'`            | Aiven instance was recreated                    | Update `spring.datasource.url` host/port to the new endpoint. |
| Property placeholder `${DB_PASSWORD}` literal in error | Secret not exported into the shell    | Run `echo $DB_PASSWORD` — if empty, rebuild the Codespace. |

### 4.3 Backend port 8081 already in use
```bash
lsof -i :8081           # find PID
kill -9 <PID>
```

### 4.4 `ng serve` fails with `Cannot find module ...`
```bash
cd frontend/anvay-app
rm -rf node_modules package-lock.json
npm install
```

### 4.5 Stale Maven Build
```bash
cd anvay/anvay
./mvnw clean install -DskipTests
```

---

## Quick Start Checklist

- [ ] Codespace created and post-create scripts finished
- [ ] `DB_PASSWORD` added in repo Codespaces secrets
- [ ] Codespace rebuilt after adding secret
- [ ] `./mvnw spring-boot:run` shows `Tomcat started on port(s): 8081`
- [ ] `npm start` shows `Local: http://localhost:4200/`
- [ ] Login screen loads in the forwarded `4200` tab
- [ ] Sign in with seeded super admin: `admin@anvay.com` / `Admin@123`

You're ready to develop. Next, see `STARTUP_GUIDE.md` for application-specific workflows.
