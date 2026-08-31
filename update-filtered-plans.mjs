import fs from "fs";

let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

const oldCode = `  const filteredPlans = useMemo(() => {
     let result = Object.entries(plans).filter(([key, plan]) => key.includes("_" + activeTech + "_"));
     
     if (activeBrand !== "All") {
        result = result.filter(([key, plan]) => {
           return key.startsWith(activeBrand + "_");
        });
     }
     
     // Sort by MP resolution (2MP < 5MP < 8MP)
     return result.sort((a, b) => {
        const mpA = parseInt(a[0].split("_")[1].replace("MP", "")) || 0;
        const mpB = parseInt(b[0].split("_")[1].replace("MP", "")) || 0;
        return mpA - mpB;
     });
  }, [plans, activeTech, activeBrand]);`;

const newCode = `  const filteredPlans = useMemo(() => {
     let result = Object.entries(plans).filter(([key, plan]) => key.includes("_" + activeTech + "_"));
     
     result = result.filter(([key, plan]) => key.startsWith(activeBrand + "_"));
     
     // Sort by MP resolution (e.g. Budget_HD_2MP -> index 2)
     return result.sort((a, b) => {
        const mpA = parseInt(a[0].split("_")[2]?.replace("MP", "") || "0");
        const mpB = parseInt(b[0].split("_")[2]?.replace("MP", "") || "0");
        return mpA - mpB;
     });
  }, [plans, activeTech, activeBrand]);`;

content = content.replace(oldCode, newCode);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Updated filteredPlans precisely");
