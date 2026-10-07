import fetch from "node-fetch";

async function test() {
  const dlRes = await fetch("https://cctvquotation.com/api/quote/QT-2026-16351/download");
  const buffer = await dlRes.buffer();
  console.log("Size:", buffer.length);
  const text = buffer.toString('utf-8').slice(0, 50);
  console.log(text.replace(/\n/g, '\\n'));
}

test();
