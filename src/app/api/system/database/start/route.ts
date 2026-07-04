import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  const hostHeader = request.headers.get("host") ?? "";
  const host = hostHeader.startsWith("[")
    ? hostHeader.slice(1, hostHeader.indexOf("]"))
    : hostHeader.split(":")[0];
  const isLocalHost = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host);

  if (process.env.NODE_ENV === "production" || !isLocalHost) {
    return NextResponse.json(
      { ok: false, message: "Veri merkezi yalnızca yerel geliştirme ortamında başlatılabilir." },
      { status: 403 }
    );
  }

  const projectRoot = process.cwd();
  const scriptPath = path.join(projectRoot, "scripts", "ensure-database.sh");

  try {
    const { stdout } = await execFileAsync("/bin/bash", [scriptPath], {
      cwd: projectRoot,
      env: process.env,
      timeout: 90_000,
      maxBuffer: 1024 * 1024
    });
    return NextResponse.json({
      ok: true,
      message: "TransitOS veri merkezi hazır.",
      detail: stdout.trim()
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Veri merkezi başlatılamadı.";
    console.error("[api/system/database/start] failed", { detail });
    return NextResponse.json(
      { ok: false, message: "Veri merkezi başlatılamadı.", detail },
      { status: 503 }
    );
  }
}
