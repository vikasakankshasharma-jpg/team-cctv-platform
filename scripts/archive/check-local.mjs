import fetch from "node-fetch";

async function checkLocal() {
  try {
    await fetch("http://localhost:3000/");
    console.log("Local server is UP");
  } catch(e) {
    console.log("Local server is DOWN");
  }
}
checkLocal();
