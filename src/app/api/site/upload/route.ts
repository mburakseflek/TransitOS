import { NextResponse } from "next/server";
import { storeUpload } from "@/lib/upload-storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
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
