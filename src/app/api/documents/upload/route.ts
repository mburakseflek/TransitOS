import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSessionToken } from "@/lib/auth";
import { canEditOperations } from "@/lib/permissions";
import { storeUpload } from "@/lib/upload-storage";

const maxFileSize = 10 * 1024 * 1024;

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export async function POST(request: Request) {
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (!canEditOperations(user)) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "PDF veya görsel evrak yükleyin." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ message: "Dosya boyutu 10 MB sınırını aşamaz." }, { status: 413 });
  }

  const storedFile = await storeUpload({ file, folder: "documents" });
  return NextResponse.json({ url: storedFile.url, name: storedFile.name });
}
