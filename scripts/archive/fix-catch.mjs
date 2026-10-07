import fs from "fs";

let content = fs.readFileSync("app/api/quote/generate/route.ts", "utf8");

content = content.replace(
  /\s*\}\s*\}\s*$/,
  `
  } catch (error: any) {
    console.error("Quote generation error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}`
);

fs.writeFileSync("app/api/quote/generate/route.ts", content);
console.log("Fixed route.ts catch block");
