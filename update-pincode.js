const fs = require('fs');
let code = fs.readFileSync('components/landing/PincodeWidget.tsx', 'utf8');

const oldInputClass = 'className={`w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl pl-12 pr-12 outline-none text-ellipsis overflow-hidden whitespace-nowrap transition-all font-bold tracking-wider text-zinc-950 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 ${';
const newInputClass = 'className={`w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl pl-12 pr-12 outline-none text-ellipsis overflow-hidden whitespace-nowrap transition-all duration-500 font-bold tracking-wider text-zinc-950 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 ${pincode.length < 6 ? "ring-2 ring-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse" : ""} ${';
code = code.replace(oldInputClass, newInputClass);

const oldBtnClass = 'className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all shadow-xl touch-manipulation shrink-0 ${loading ? "opacity-70 cursor-wait" : "active:scale-95"} ${';
const newBtnClass = 'className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all duration-500 touch-manipulation shrink-0 ${loading ? "opacity-70 cursor-wait" : "active:scale-95"} ${pincode.length === 6 && !loading ? "shadow-[0_0_25px_rgba(59,130,246,0.8)] ring-2 ring-blue-400 scale-[1.02] animate-pulse" : "shadow-xl"} ${';
code = code.replace(oldBtnClass, newBtnClass);

fs.writeFileSync('components/landing/PincodeWidget.tsx', code);
console.log('Updated PincodeWidget.tsx');
