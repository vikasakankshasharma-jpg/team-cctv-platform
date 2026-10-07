import fs from "fs";

let content = fs.readFileSync("components/admin/AddonsClient.tsx", "utf8");

const renderStockHtml = `
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-zinc-500 font-bold">
                          {item.stock_quantity === -1 ? "N/A" : item.stock_quantity ?? "Unlimited"}
                        </span>
                      </td>
`;

content = content.replace(
  /                          \)\}\n                        <\/div>\n                      <\/td>\n                      <td className="px-8 py-6">/,
  `                          )}\n                        </div>\n                      </td>\n                      <td className="px-8 py-6">\n                        <span className="text-zinc-500 font-bold">\n                          {item.stock_quantity === -1 ? "N/A" : item.stock_quantity ?? "Unlimited"}\n                        </span>\n                      </td>\n                      <td className="px-8 py-6">`
);

// We need to add the header as well
content = content.replace(
  /<th className="px-8 py-5 text-left text-\[10px\] font-black text-zinc-500 uppercase tracking-\[0\.2em\]">Price<\/th>/,
  `<th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Stock</th>\n                  <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Price</th>`
);

fs.writeFileSync("components/admin/AddonsClient.tsx", content);
console.log("Updated AddonsClient with stock column");
