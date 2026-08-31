import fetch from "node-fetch";

async function wait() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://localhost:3000/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camera_count: 1, technology_preference: "IP", recording_days: 15, wants_remote_viewing: true })
      });
      if (res.ok) { console.log("UP"); return; }
    } catch(e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
}
wait();
