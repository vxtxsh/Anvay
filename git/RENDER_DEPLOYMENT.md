# Anvay — Render.com Deployment Guide

End-to-end walkthrough for deploying the Anvay platform on **Render.com**:

- **Backend** — Spring Boot 4 (Java 21) → Render **Web Service**
- **Frontend** — Angular 17 → Render **Static Site**
- **Database** — Aiven managed MySQL (already provisioned, see `application.properties`)

> **Stack note:** This project is on Spring Boot **4** with Java **21** and Angular **17**, not the Spring Boot 3 commonly assumed in Render templates. Use Java 21 in every backend setting.

---

## Prerequisites

- [ ] Code pushed to a GitHub repo (Render pulls from GitHub).
- [ ] `mvnw`, `mvnw.cmd`, **and the `.mvn/` directory** are committed (the wrapper needs `.mvn/wrapper/maven-wrapper.properties` to bootstrap Maven on Render's clean build VMs).
- [ ] Aiven MySQL credentials available (URL, username, password).
- [ ] A free or paid [Render account](https://render.com).

Verify `.mvn/` is tracked:

```bash
git ls-files anvay/anvay/.mvn | head
# expect at least: anvay/anvay/.mvn/wrapper/maven-wrapper.properties
```

If empty, the build will fail with `./mvnw: No such file or directory` on Render. Push the folder before proceeding.

---

## 1. Backend — Render Web Service

### 1.1 Create the Service
1. **Render Dashboard → New + → Web Service**.
2. Connect the GitHub repo and select branch (e.g., `main`).
3. **Root Directory:** `anvay/anvay` *(crucial — the Maven project is nested two levels deep).*
4. **Runtime:** `Native Environment` → choose **Java**.
5. **Region / Plan:** pick the closest region; Free tier is fine for staging.

### 1.2 Build & Start Commands

| Field             | Value                                          |
| ----------------- | ---------------------------------------------- |
| **Build Command** | `./mvnw clean package -DskipTests`             |
| **Start Command** | `java -jar target/*.jar`                       |

> Render auto-detects `target/*.jar`. If you have multiple jars (rare), pin it explicitly: `java -jar target/anvay-0.0.1-SNAPSHOT.jar`.

### 1.3 Environment Variables

In **Settings → Environment → Add Environment Variable**, add each row exactly as named — the keys must match the `${...}` placeholders in `application.properties` (case-sensitive).

| Key            | Example value                                                                       | Notes                                           |
| -------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `JAVA_VERSION` | `21`                                                                                | Forces Render to provision a Java 21 toolchain. |
| `DB_URL`       | `jdbc:mysql://anvay-...aivencloud.com:12534/defaultdb?ssl-mode=REQUIRED`            | Full JDBC URL from Aiven.                       |
| `DB_USERNAME`  | `avnadmin`                                                                          | Aiven default admin.                            |
| `DB_PASSWORD`  | *(your Aiven password)*                                                             | Mark as **Secret** in Render UI.                |
| `JWT_SECRET`   | a 64+ char random string                                                            | Replaces `app.jwt.secret` for prod.             |
| `PORT`         | *(do NOT set — Render injects this automatically)*                                  | See §1.5.                                       |

Then update `application.properties` to read URL & secret from env where they aren't already:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
app.jwt.secret=${JWT_SECRET}
```

> The repo today has the URL and username hardcoded for the Aiven endpoint — switching them to env-driven before deploy keeps prod and dev configs portable.

### 1.4 First Deploy
Click **Create Web Service**. Render will:
1. Clone the repo at the chosen root.
2. Run `./mvnw clean package -DskipTests` (≈ 3–5 min on free tier).
3. Boot with `java -jar target/*.jar`.
4. Assign a public URL like `https://anvay-api.onrender.com`.

Watch the **Logs** tab for `Tomcat started on port(s):` — Render expects the app to bind to `0.0.0.0:$PORT`.

### 1.5 Critical: Bind to Render's Injected `$PORT`

Render injects `PORT` (commonly `10000`) and routes traffic to it. The current `application.properties` has `server.port=8081` hardcoded — that **will not** work on Render. Change it to:

```properties
server.port=${PORT:8081}
```

This keeps `8081` for local dev and uses Render's `$PORT` in production. Without this, the deploy will pass build but the app will be **unreachable** ("502 Bad Gateway").

---

## 2. Frontend — Render Static Site

### 2.1 Create the Static Site
1. **Render Dashboard → New + → Static Site**.
2. Connect the same GitHub repo.
3. **Root Directory:** `frontend/anvay-app`.

### 2.2 Build Settings

| Field                 | Value                                      |
| --------------------- | ------------------------------------------ |
| **Build Command**     | `npm install && npm run build`             |
| **Publish Directory** | `dist/anvay-app/browser`                   |

> **Important corrections vs. Render templates:**
> - Angular 17's `application` builder outputs to `dist/<project>/browser/` (note the `browser/` subdirectory) — this project's path is `dist/anvay-app/browser`, **not** `dist/anvay/browser`.
> - Drop the `--prod` flag — it has been **deprecated since Angular 12**. Production is the default for `ng build`. Using `npm run build --prod` will silently fall through and ship a dev bundle.

### 2.3 Point the Frontend at the Render Backend

The repo currently uses a dev-only proxy (`proxy.conf.json`) to forward `/api` → `localhost:8081`. In production there is no proxy, so the frontend must call the backend's full URL.

Create or update `frontend/anvay-app/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://anvay-api.onrender.com'   // ← your Render backend URL
};
```

…and a matching dev file `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: ''   // empty: dev proxy handles /api in localhost
};
```

Wire it into HTTP calls (or use an `HttpInterceptor` to prepend `apiBaseUrl` to every `/api` request). If services currently use bare paths like `/api/auth/login`, the simplest pattern is an interceptor:

```typescript
@Injectable()
export class ApiPrefixInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/api') && environment.apiBaseUrl) {
      req = req.clone({ url: environment.apiBaseUrl + req.url });
    }
    return next.handle(req);
  }
}
```

Register it in `app.config.ts` providers.

### 2.4 SPA Routing — Rewrite Rule (Critical)

Without this rule, **every page refresh on a route other than `/` returns 404** because Render serves static files literally and Angular's client-side router never gets to handle the URL.

In **Render Dashboard → your Static Site → Redirects/Rewrites → Add Rule**:

| Field         | Value         |
| ------------- | ------------- |
| **Source**    | `/*`          |
| **Destination** | `/index.html` |
| **Action**    | **Rewrite**   |

> Make sure the action is **Rewrite**, not **Redirect**. Redirect changes the URL in the browser; Rewrite serves `index.html` while preserving the URL so Angular can read it.

Equivalent declarative form (commit a `_redirects` file or `render.yaml`):

```
# frontend/anvay-app/public/_redirects   (Render reads this from publish dir)
/*    /index.html   200
```

---

## 3. Database — Aiven IP Allowlist

Render uses **dynamic egress IPs** that change frequently, so you can't pin them. Two options:

### Option A — Open access (fastest, lower security)
1. Aiven Console → your MySQL service → **Allowed IP Addresses**.
2. Add `0.0.0.0/0`.
3. Confirm SSL is **enforced** at the service level — without SSL, an open allowlist is a major risk.

### Option B — VPC Peering (recommended for production)
Aiven supports **VPC peering** with AWS / GCP. If your Aiven plan allows it, peer it with a Render private VPC and skip the public allowlist entirely. See Aiven's [VPC peering docs](https://aiven.io/docs/platform/howto/vpc) — this is the production-grade path.

For the current free-tier Aiven instance, Option A is the practical default. **Always keep `ssl-mode=REQUIRED` in `DB_URL`.**

---

## 4. CORS — Allow the Frontend's Render Origin

The current `SecurityConfig.java` ([anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/SecurityConfig.java:63](anvay/anvay/src/main/java/com/cts/mfrp/anvay/security/SecurityConfig.java#L63)) only allows `localhost`:

```java
config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
```

**This will block every frontend request from Render.** Update it before deploying:

```java
config.setAllowedOriginPatterns(List.of(
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://anvay-frontend.onrender.com",        // ← prod frontend
    "https://*.onrender.com"                       // optional: covers PR previews
));
config.setAllowCredentials(true);
config.setAllowedHeaders(List.of("*"));
```

> Use `setAllowedOriginPatterns` (not `setAllowedOrigins`) when `allowCredentials = true` and you need wildcards — Spring Security blocks the combination of `*` and credentials.

Also audit individual controllers — `EventController.java` and `StudentController.java` have their own `@CrossOrigin` annotations that may shadow `SecurityConfig`. If they hardcode `http://localhost:4200`, change them to read from a property:

```java
@CrossOrigin(origins = "${app.cors.frontend-url}")
```

…and set `app.cors.frontend-url=https://anvay-frontend.onrender.com` via Render env vars.

---

## 5. Render Deployment Order

1. **Backend first.** You need its URL before configuring the frontend.
2. Note the backend URL (e.g., `https://anvay-api.onrender.com`).
3. Update `environment.prod.ts` with that URL → commit → push.
4. Update `SecurityConfig.java` CORS with the *expected* frontend URL → commit → push (you can use a wildcard `https://*.onrender.com` if you don't know the exact name yet).
5. **Frontend second.** Render assigns its URL on creation.
6. If the frontend URL differs from your wildcard, add the exact origin to CORS and redeploy the backend.

---

## 6. Troubleshooting

### 6.1 "Access Denied" on every API call (CORS)
**Symptom:** Browser DevTools → Console: `CORS policy: No 'Access-Control-Allow-Origin' header...`

**Fixes (in order):**
1. Confirm the frontend's exact origin is in `setAllowedOriginPatterns`.
2. Confirm the backend is **actually redeployed** — Render does not auto-redeploy on every push unless **Auto-Deploy** is on.
3. Check `Network` tab: a `401` is auth, not CORS. CORS errors show the request as **failed** with no status.
4. Look for the `Access-Control-Allow-Origin` header in the OPTIONS preflight response. If missing, Spring is rejecting the preflight before CORS runs — verify `.cors(cors -> cors.configurationSource(...))` is wired before `.authorizeHttpRequests(...)`.

### 6.2 "404 on Refresh" (SPA routing)
**Symptom:** Hard-refresh on `/dashboard/student` → Render 404 page.
**Fix:** Add the `/* → /index.html` Rewrite rule (§2.4). The Redirect/Rewrite tab is per-Static-Site; double-check action is **Rewrite**.

### 6.3 Backend deploys but returns "502 Bad Gateway"
- App didn't bind to `$PORT`. Fix `server.port=${PORT:8081}` (§1.5).
- Or the app crashed at boot — check the **Logs** tab for stack traces.

### 6.4 Build fails: `./mvnw: No such file or directory`
The `.mvn` folder isn't pushed. Run:
```bash
git add anvay/anvay/.mvn anvay/anvay/mvnw anvay/anvay/mvnw.cmd
git commit -m "chore: include Maven wrapper for Render build"
git push
```

### 6.5 `Access denied for user 'avnadmin'` at startup
- `DB_PASSWORD` env var typo or missing.
- Aiven IP allowlist doesn't include `0.0.0.0/0` (or your Render VPC).
- Variable name mismatch: env var is `DB_PASSWORD` but `application.properties` says `${DB_PASS}`. Names are **case-sensitive** and must match exactly.

### 6.6 Free-tier "cold start" — 60s spinner before login works
Render's free tier puts services to sleep after 15 minutes idle. The first request wakes them, taking 30–60s. Mitigations:
- Add a loading state to the Angular login flow that shows "Waking up server..." after 5s of pending request.
- Set up an external uptime monitor (UptimeRobot, etc.) to ping `/actuator/health` every 10 min — keeps the dyno warm but **uses your free hours faster**.
- Upgrade backend to Render's $7/mo Starter plan — no sleep.

```typescript
// Suggested loading-state pattern in login.component.ts
private slowLoginTimer: any;
onSubmit() {
  this.loading = true;
  this.slowLoginTimer = setTimeout(() => this.slowLoginMessage = 'Waking up the server, this may take up to a minute...', 5000);
  this.authService.login(...).subscribe({
    next: () => clearTimeout(this.slowLoginTimer),
    error: () => clearTimeout(this.slowLoginTimer),
  });
}
```

### 6.7 `dist/anvay-app/browser` not found at publish time
Confirm Angular 17's `application` builder is in use (it is — see `angular.json:14`). If you've configured a custom `outputPath`, match the publish dir to whatever `outputPath` + `/browser` resolves to. The `browser` subdirectory is added automatically by the application builder.

---

## Quick Deploy Checklist

**Pre-flight:**
- [ ] `.mvn/`, `mvnw`, `mvnw.cmd` committed
- [ ] `server.port=${PORT:8081}` in `application.properties`
- [ ] `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` driven by env vars
- [ ] `SecurityConfig.java` CORS includes `https://*.onrender.com`
- [ ] `environment.prod.ts` points at the Render backend URL

**Render setup:**
- [ ] Backend Web Service created with Root Directory `anvay/anvay`, `JAVA_VERSION=21`, all env vars set
- [ ] Frontend Static Site created with Root Directory `frontend/anvay-app`, Publish Dir `dist/anvay-app/browser`
- [ ] Rewrite rule `/* → /index.html` added to Static Site
- [ ] Aiven allowlist set to `0.0.0.0/0` (or VPC peered)

**Smoke test:**
- [ ] `curl https://anvay-api.onrender.com/v3/api-docs` returns JSON
- [ ] Frontend home page loads
- [ ] Login as `admin@anvay.com` / `Admin@123` succeeds
- [ ] Hard-refresh on `/dashboard/super-admin` works (no 404)
