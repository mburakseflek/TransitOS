const host = "www.seflektur.com";
const key = process.env.INDEXNOW_KEY || "7f09d4b0b5864c7db95c0ac2ac17b9d8";
const paths = [
  "/seflektur",
  "/seflektur/hizmetler",
  "/seflektur/filo",
  "/seflektur/vip",
  "/seflektur/ayricaliklar",
  "/seflektur/standartlar",
  "/seflektur/referanslar",
  "/seflektur/transitos",
  "/seflektur/iletisim",
  "/seflektur/tasimacilar",
  "/seflektur/teklif",
  "/llms.txt"
];

async function main() {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: paths.map((path) => `https://${host}${path}`)
    })
  });

  if (!response.ok) {
    throw new Error(`IndexNow bildirimi başarısız: HTTP ${response.status}`);
  }

  console.log(`IndexNow ${paths.length} güncel URL'yi kabul etti (HTTP ${response.status}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
