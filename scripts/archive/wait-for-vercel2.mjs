import { execSync } from 'child_process';

async function wait() {
  for (let i = 0; i < 30; i++) {
    const out = execSync("npx vercel ls").toString();
    const building = out.split('\n').find(line => line.includes("Building") && line.includes("Production"));
    if (!building) {
        const ready = out.split('\n').find(line => line.includes("Ready") && line.includes("Production") && line.includes("43ba7f2"));
        if(ready) {
           console.log("Build is ready!");
           return;
        } else if (out.includes("Building")) {
            console.log("Still building (found 'Building' somewhere)...");
        } else {
             console.log("No production builds in progress... wait.");
        }
    } else {
        console.log("Still building...");
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}
wait();
