const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = "http://127.0.0.1:5500"; // schimba daca folose?ti alt port

  const urls = [
    `${base}/familiile.html`,
    `${base}/familiile-familie.html?family=740f6b7a-4629-4c58-a2d7-e35beef3c2a2`,
    `${base}/genealogie-familie.html?family=740f6b7a-4629-4c58-a2d7-e35beef3c2a2`,
    `${base}/dashboard.html`
  ];

  page.on("console", msg => {
    if (["error", "warning"].includes(msg.type())) {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  for (const url of urls) {
    console.log(`\n=== ${url} ===`);
    const resp = await page.goto(url, { waitUntil: "networkidle" });
    console.log("HTTP:", resp ? resp.status() : "no-response");
  }

  await browser.close();
})();
