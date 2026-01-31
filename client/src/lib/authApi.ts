const API_BASE = "";

const AUTH_SIGNUP_URL = `${API_BASE}/api/auth/signup/`;
const AUTH_LOGIN_URL = `${API_BASE}/api/auth/login/`;

async function parseErrorResponse(res: Response, fallback: string): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { detail?: string; username?: string[]; password?: string[] };
    if (data.detail) return data.detail;
    const parts: string[] = [];
    if (Array.isArray(data.username)) parts.push(data.username.join(" "));
    if (Array.isArray(data.password)) parts.push(data.password.join(" "));
    return parts.length ? parts.join(". ") : fallback;
  } catch {
    return text.trim() || fallback;
  }
}

function buildAuthBody(username: string, password: string): string {
  return JSON.stringify({ username: username.trim(), password });
}

export type AuthSuccess = { username: string };

export type LoginResult = { ok: true; username: string } | { ok: false; error: string };

export async function loginApi(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(AUTH_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: buildAuthBody(username, password),
    });
    if (!res.ok) {
      const error = await parseErrorResponse(res, "Invalid username or password");
      return { ok: false, error };
    }
    const data = (await res.json()) as AuthSuccess;
    return { ok: true, username: data.username ?? username.trim() };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: message.includes("fetch") ? "Network error. Please try again." : message };
  }
}

export type RegisterResult = { ok: true; username: string } | { ok: false; error: string };

export async function registerApi(username: string, password: string): Promise<RegisterResult> {
  try {
    const res = await fetch(AUTH_SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: buildAuthBody(username, password),
    });
    if (!res.ok) {
      const error = await parseErrorResponse(res, "Sign up failed");
      return { ok: false, error };
    }
    const data = (await res.json()) as AuthSuccess;
    return { ok: true, username: data.username ?? username.trim() };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: message.includes("fetch") ? "Network error. Please try again." : message };
  }
}
