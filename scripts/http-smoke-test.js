const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const baseUrl = process.env.TRANSITOS_TEST_URL || "http://127.0.0.1:3100";
const adminId = process.env.ADMIN_LOGIN_ID || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "";
let failures = 0;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  failures += ok ? 0 : 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
}

function sessionCookie(response) {
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}

async function main() {
  for (const path of ["/", "/seflektur", "/login", "/api/market", "/api/macos/health"]) {
    const response = await request(path);
    check(`Genel uç erişilebilir: ${path}`, response.ok, `HTTP ${response.status}`);
  }

  for (const path of ["/transitos/dashboard", "/transitos/projects", "/transitos/settings"]) {
    const response = await request(path);
    check(`Oturumsuz sayfa korunuyor: ${path}`, response.status >= 300 && response.status < 400, `HTTP ${response.status}`);
  }

  const anonymousDashboard = await request("/api/dashboard");
  check("Oturumsuz dashboard API engelleniyor", anonymousDashboard.status === 401, `HTTP ${anonymousDashboard.status}`);

  const anonymousUpload = await request("/api/documents/upload", { method: "POST", body: new FormData() });
  check("Oturumsuz evrak yükleme engelleniyor", anonymousUpload.status === 401, `HTTP ${anonymousUpload.status}`);

  const invalidLogin = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "MANAGER", loginId: adminId, password: "__wrong_password__" })
  });
  check("Hatalı giriş reddediliyor", invalidLogin.status === 401, `HTTP ${invalidLogin.status}`);

  if (!adminPassword) {
    throw new Error("HTTP giriş testi için ADMIN_PASSWORD tanımlı olmalı.");
  }

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "MANAGER", loginId: adminId, password: adminPassword })
  });
  const cookie = sessionCookie(login);
  check("Yönetici girişi başarılı", login.status === 200 && Boolean(cookie), `HTTP ${login.status}`);

  for (const path of [
    "/transitos/dashboard",
    "/transitos/projects",
    "/transitos/vehicles",
    "/transitos/drivers",
    "/transitos/subcontractors",
    "/transitos/expenses",
    "/transitos/finance",
    "/transitos/calendar",
    "/transitos/earnings",
    "/transitos/surveys",
    "/transitos/settings"
  ]) {
    const response = await request(path, { headers: { cookie } });
    check(`Yönetici sayfası açılıyor: ${path}`, response.ok, `HTTP ${response.status}`);
  }

  const dashboard = await request("/api/dashboard", { headers: { cookie } });
  const dashboardBody = dashboard.ok ? await dashboard.json() : null;
  check("Yetkili dashboard API çalışıyor", dashboard.ok && Boolean(dashboardBody?.summary), `HTTP ${dashboard.status}`);

  const logout = await request("/api/auth/logout", { method: "POST", headers: { cookie } });
  check("Çıkış yönlendirmesi çalışıyor", logout.status === 303 && logout.headers.get("location")?.endsWith("/login"), `HTTP ${logout.status}`);

  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`HTTP_TEST_FAILED ${error.message}`);
  process.exitCode = 1;
});
