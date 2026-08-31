import fetch from "node-fetch";

async function test() {
  const dlRes = await fetch("http://localhost:3000/api/quote/QT-2026-16351/download");
  const text = await dlRes.text();
  const nextData = text.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
  if (nextData) {
      const parsed = JSON.parse(nextData[1]);
      console.log(parsed.err?.message || "No err.message");
  } else {
      console.log("No NEXT_DATA");
  }
}
test();
