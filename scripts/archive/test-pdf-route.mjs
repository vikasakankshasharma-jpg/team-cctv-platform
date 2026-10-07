import fetch from "node-fetch";
async function test() {
    const res = await fetch("https://cctvquotation.com/api/quote/QT-2026-15051/pdf");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
}
test();
