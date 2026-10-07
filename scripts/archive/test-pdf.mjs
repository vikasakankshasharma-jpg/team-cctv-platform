import fetch from "node-fetch";
async function test() {
    const res = await fetch("http://localhost:3000/api/quote/QT-2026-15051/download");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
}
test();
