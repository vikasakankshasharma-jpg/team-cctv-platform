import fetch from "node-fetch";

async function test() {
    const res = await fetch("https://cctvquotation.com/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            camera_count: 4,
            technology_preference: "HD",
            recording_days: 15,
            wants_remote_viewing: true
        })
    });
    
    const data = await res.json();
    console.log("Budget:", data.plans?.budget?.total_payable);
    console.log("Recommended:", data.plans?.recommended?.total_payable);
    console.log("Premium:", data.plans?.premium?.total_payable);
    console.log("Recommended Items:", JSON.stringify(data.plans?.recommended?.items.map(i => i.display_name), null, 2));
}
test();
