import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { storeUpload } from "@/lib/upload-storage";
import { canManageSite, readSessionToken } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (!canManageSite(user)) return NextResponse.json({ message: "Yetkisiz işlem." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "Yalnızca görsel dosyası yüklenebilir." }, { status: 400 });
  }

  const storedFile = await storeUpload({ file, folder: "uploads" });
  return NextResponse.json({ url: storedFile.url });
}
