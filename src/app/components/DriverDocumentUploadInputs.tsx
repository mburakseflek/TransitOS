"use client";

import { useState } from "react";

export function DriverDocumentUploadInputs() {
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File | null) {
    if (!file) return;
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({}));
    setUploading(false);

    if (!response.ok || !payload.url) {
      setError(payload.message ?? "Evrak yüklenemedi.");
      return;
    }

    setFileUrl(payload.url);
    setFileName(payload.name ?? file.name);
  }

  const isPdf = fileUrl.toLowerCase().endsWith(".pdf");

  return (
    <div className="document-upload-box">
      <label className="field-row">
        <span>
          <strong>Evrak adı</strong>
          <small>Ruhsat, SRC, psikoteknik, sözleşme vb.</small>
        </span>
        <input name="title" defaultValue={fileName} placeholder="Örn. SRC belgesi" required />
      </label>
      <label className="field-row">
        <span>
          <strong>Dosya</strong>
          <small>PDF veya görsel evrak seçin.</small>
        </span>
        <input accept="application/pdf,image/*" type="file" onChange={(event) => upload(event.target.files?.[0])} />
      </label>
      <input name="fileUrl" type="hidden" value={fileUrl} />
      {uploading ? <p className="muted">Evrak yükleniyor...</p> : null}
      {error ? <p className="badge red">{error}</p> : null}
      {fileUrl ? (
        <div className="document-preview">
          {isPdf ? <iframe src={fileUrl} title="Evrak önizleme" /> : <img src={fileUrl} alt="Evrak önizleme" />}
          <a className="ghost compact-button" href={fileUrl} target="_blank" rel="noreferrer">Aç</a>
        </div>
      ) : null}
    </div>
  );
}
