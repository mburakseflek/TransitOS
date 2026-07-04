import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

type StoredUpload = {
  url: string;
  name: string;
};

type StoreUploadOptions = {
  file: File;
  folder: "uploads" | "documents";
};

export async function storeUpload({ file, folder }: StoreUploadOptions): Promise<StoredUpload> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name) || defaultExtension(file.type);
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension.toLowerCase()}`;

  if (shouldStoreInDatabase()) {
    const storedFile = await prisma.storedFile.create({
      data: {
        fileName: file.name || safeName,
        mimeType: file.type || "application/octet-stream",
        data: bytes
      }
    });
    return { url: `/api/files/${storedFile.id}`, name: file.name };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder === "documents" ? "documents" : "");
  const uploadPath = path.join(uploadDir, safeName);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, bytes);

  return {
    url: folder === "documents" ? `/uploads/documents/${safeName}` : `/uploads/${safeName}`,
    name: file.name
  };
}

function shouldStoreInDatabase() {
  return process.env.VERCEL === "1" || process.env.TRANSITOS_STORE_FILES_IN_DB === "true";
}

function defaultExtension(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}
