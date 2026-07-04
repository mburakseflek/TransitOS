import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const file = await prisma.storedFile.findUnique({ where: { id } });

  if (!file) {
    return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 404 });
  }

  const body = Uint8Array.from(file.data);

  return new Response(body.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeFileName(file.fileName)}"`,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

function encodeFileName(fileName: string) {
  return fileName.replace(/["\\\r\n]/g, "_");
}
