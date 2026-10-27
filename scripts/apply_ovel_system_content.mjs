import fs from "fs";

console.log("Starting deep content transformation for Ovel...");

// =========================================================================
// 1. UPDATE index-Bdh81gzm.js
// =========================================================================
let indexJs = fs.readFileSync("public/assets/index-Bdh81gzm.js", "utf8");

// Hero Headline
indexJs = indexJs.replaceAll('Spaces that Breathe', 'Commerce that Breathes');
indexJs = indexJs.replaceAll('a3=[[{text:"Spaces"}],[{text:"that",italic:!0},{text:" "},{text:"Breathe"}]]', 'a3=[[{text:"Commerce"}],[{text:"that",italic:!0},{text:" "},{text:"Breathes"}]]');
indexJs = indexJs.replaceAll('a3=[[{text:"Spaces"}],[{text:"that",italic:!0},{text:" "},{text:"Breathe"}]]', 'a3=[[{text:"Commerce"}],[{text:"that",italic:!0},{text:" "},{text:"Breathes"}]]');

// Hero Kicker
indexJs = indexJs.replaceAll('FORMA · Architecture studio', 'OVEL · BOOKING-TO-PAID PLATFORM');
indexJs = indexJs.replaceAll('OVEL · Operating Platform', 'OVEL · BOOKING-TO-PAID PLATFORM');

// Hero Lede
indexJs = indexJs.replaceAll(
  'We design immersive homes where architecture, nature and the people who live in them are held in quiet balance.',
  'The sovereign flat-price operating system unifying Quote → Book → Remind → Invoice → Settle for salons, clinics, studios, and specialists. 0% take-rate.'
);

// Hero Side
indexJs = indexJs.replaceAll(
  'Architecture, interiors & landscape — since 2009',
  'Quote → Book → Remind → Invoice → Settle · 0% Take-Rate'
);

// Hero Build Kicker & Caption
indexJs = indexJs.replaceAll('Cliff House · built live', 'Ovel Core Engine · Live Architecture');
indexJs = indexJs.replaceAll('From soil to sanctuary', 'From inquiry to settlement');
indexJs = indexJs.replaceAll('Cliff House · live model', 'Ovel Commerce Engine · Live Architecture');

// Hero Navigation Chapters
indexJs = indexJs.replaceAll(
  '{n:"01",label:"Architecture",href:"#featured"},{n:"02",label:"Interiors",href:"#living"},{n:"03",label:"Experiences",href:"#approach"}',
  '{n:"01",label:"Engines",href:"#living"},{n:"02",label:"Features",href:"#details"},{n:"03",label:"Workflow",href:"#approach"}'
);
indexJs = indexJs.replaceAll(
  '{n:"01",label:"Atelier",href:"#featured"},{n:"02",label:"Engines",href:"#living"},{n:"03",label:"Process",href:"#approach"}',
  '{n:"01",label:"Engines",href:"#living"},{n:"02",label:"Features",href:"#details"},{n:"03",label:"Workflow",href:"#approach"}'
);

// Navigation Links
indexJs = indexJs.replaceAll(
  'Sy=[{label:"Projects",href:"#projects"},{label:"Studio",href:"#studio"},{label:"Approach",href:"#approach"},{label:"Contact",href:"#contact"}]',
  'Sy=[{label:"Engines",href:"#living"},{label:"Features",href:"#details"},{label:"Showroom",href:"#projects"},{label:"Workflow",href:"#approach"},{label:"Sign In",href:"/login"}]'
);

indexJs = indexJs.replaceAll('children:["Let’s talk "', 'children:["Get Started "');
indexJs = indexJs.replaceAll('children:["Explore projects "', 'children:["Explore Showroom "');

// 4 Storefront Showcases in h3
const oldH3Match = indexJs.match(/h3=\[\{id:"cliff-house"[\s\S]*?\}\];function K1/);
if (oldH3Match) {
  const newH3 = `h3=[{id:"cliff-house",title:"Vance Production Loft",type:"Hourly Daylight Cyc Studio Rentals",year:"Scale Tier",location:"Arts District",area:"4,500 sq ft",...Qc("project-cliff"),summary:"Hourly daylight cyc bookings with custom equipment add-ons, dynamic milestone quotes, automated WhatsApp entry codes, and zero transaction fees."},{id:"stillwater",title:"L'Éclat Boutique",type:"Aesthetic & Clinical Care",year:"Scale Tier",location:"Mayfair & Colombo",area:"100% Settle",...Qc("project-stillwater"),summary:"Curated high-end treatments, upfront card deposit collection, automated reminder sequences, and direct settlement with zero commission deductions."},{id:"solace",title:"Apex Auto Lab",type:"Paint Correction & Detailing Studio",year:"Growth Tier",location:"Industrial Bay 4",area:"Card on File",...Qc("project-solace"),summary:"Multi-stage paint correction and bespoke ceramic coating bookings with digital work orders, itemized package options, and card-on-file penalty protection."},{id:"courtyard",title:"Velvet Crumb Bakes",type:"Artisanal Custom Bakery & Tastings",year:"Starter Tier",location:"Confectionery Atelier",area:"Free Forever",...Qc("project-courtyard"),summary:"Custom multi-tier wedding cake estimates, tasting appointment scheduling, and automated WhatsApp payment links with zero platform commission."}];function K1`;
  indexJs = indexJs.replace(oldH3Match[0], newH3);
}

fs.writeFileSync("public/assets/index-Bdh81gzm.js", indexJs);
console.log("Updated public/assets/index-Bdh81gzm.js");


// =========================================================================
// 2. UPDATE Below-CqmAFXQi.js
// =========================================================================
let belowJs = fs.readFileSync("public/assets/Below-CqmAFXQi.js", "utf8");

// Section 1: Philosophy / Harmony
belowJs = belowJs.replaceAll(
  'ue="We believe meaningful architecture exists in balance with its surroundings. Every space is an exploration of light, material, landscape and the rituals of the people who live there."',
  'ue="We believe sovereign merchants should own their customer relationships and retain 100% of their earnings. Ovel replaces take-rate marketplaces with a flat-price booking-to-paid operating system."'
);

belowJs = belowJs.replaceAll(
  'T=[{name:"Nature",photo:E("philosophy-nature")},{name:"People",photo:E("philosophy-people")},{name:"Material",photo:E("philosophy-material")},{name:"Light",photo:E("philosophy-light")},{name:"Harmony",photo:E("philosophy")}]',
  'T=[{name:"Sovereign",photo:E("philosophy-nature")},{name:"Trust",photo:E("philosophy-people")},{name:"Estimates",photo:E("philosophy-material")},{name:"Automation",photo:E("philosophy-light")},{name:"Harmony",photo:E("philosophy")}]'
);

belowJs = belowJs.replaceAll('children:"Philosophy"', 'children:"Our Philosophy"');
belowJs = belowJs.replaceAll('children:"in Harmony."', 'children:"Commerce in Harmony."');

// Section 2: Cliff / Featured Architecture
belowJs = belowJs.replaceAll('lines:["The","Cliff House"]', 'lines:["The","Commerce Engine"]');
belowJs = belowJs.replaceAll('children:"Featured project"', 'children:"Core Architecture"');
belowJs = belowJs.replaceAll(
  'children:"A modern retreat perched above the horizon, designed to blur the line between architecture and nature."',
  'children:"A sovereign commerce atelier engineered to unify client bookings, upfront deposit collection, and instant bank settlement with zero commission take-rate."'
);
belowJs = belowJs.replaceAll(
  'children:"A sovereign daylight cyc studio engineered to unify client bookings, equipment add-ons, and instant settlement with zero commission take-rate."',
  'children:"A sovereign commerce atelier engineered to unify client bookings, upfront deposit collection, and instant bank settlement with zero commission take-rate."'
);

// Viewpoints V
const oldVMatch = belowJs.match(/V=\[\{id:"exterior"[\s\S]*?zoom:1\.35\}\}\]/);
if (oldVMatch) {
  const newV = `V=[{id:"exterior",n:"01",label:"Storefront",note:"The sovereign storefront interface (ovel.lk/l/[slug]), presenting your services with high-touch elegance and zero commission.",photo:{fx:.55,fy:.5,zoom:1.14}},{id:"structure",n:"02",label:"Architecture",note:"Under the hood: multi-installment Net credit terms, real-time client autosuggestion, and automatic deposit deductions.",photo:{fx:.47,fy:.66,zoom:1.55}},{id:"interior",n:"03",label:"Experience",note:"Direct 2-way WhatsApp automation dispatches receipts and reminders. Clients confirm in one tap with zero app downloads.",photo:{fx:.56,fy:.45,zoom:1.35}}]`;
  belowJs = belowJs.replace(oldVMatch[0], newV);
}

belowJs = belowJs.replaceAll('children:"Live model · blue hour"', 'children:"Live System Architecture"');
belowJs = belowJs.replaceAll('children:"Drag to explore"', 'children:"Drag to inspect architecture"');

// Section 3: Living (3 System Engines)
belowJs = belowJs.replaceAll('children:"The art of living"', 'children:"System Engines"');
belowJs = belowJs.replaceAll('lines:["The Art",e.jsx("em",{children:"of Living"},"o")]', 'lines:["The Art",e.jsx("em",{children:"of Sovereign Trade"},"o")]');
belowJs = belowJs.replaceAll(
  'Three ideas guide every house we draw. Not a style — a way of paying attention to where, and how, people live.',
  'Three sovereign engines power every merchant storefront. 0% take-rate, automated WhatsApp reminders, and friction-free payment settlement.'
);
belowJs = belowJs.replaceAll(
  '“The landscape was here first. Our work is to frame it — and then step out of the way.”',
  '“Your revenue is sovereign. Software should never take a percentage cut of your craft.”'
);
belowJs = belowJs.replaceAll('children:"OVEL design principle"', 'children:"OVEL Operating Philosophy"');
belowJs = belowJs.replaceAll('children:"FORMA design principle"', 'children:"OVEL Operating Philosophy"');

// Replace U array (3 engines)
const oldUMatch = belowJs.match(/U=\[\{word:"Light"[\s\S]*?glow:"158, 255, 190"\}\]/);
if (oldUMatch) {
  const newU = `U=[{word:"Quotes",n:"01",photo:E("living-light"),title:"Interactive Estimates & E-Signatures.",copy:"Draft itemized proposals with package deliverables, require card deposits, and capture cryptographic digital e-signatures that convert instantly into active invoices.",glow:"99, 193, 187"},{word:"WhatsApp",n:"02",photo:E("living-material"),title:"Automated 2-Way Client Reminders.",copy:"Dispatched automatically across 24h and 2h windows. Clients reply '1' to confirm or '2' to reschedule directly inside WhatsApp with zero app downloads, cutting no-shows by 25%.",glow:"16, 95, 104"},{word:"Settle",n:"03",photo:E("living-nature"),title:"0% Commission Direct Settlement.",copy:"Credit upfront deposits automatically against total balances, compute sales taxes, support Net 7/15/30 installment plans, and clear 100% of revenue directly to your bank.",glow:"62, 180, 160"}]`;
  belowJs = belowJs.replace(oldUMatch[0], newU);
}

// Section 4: Details (Capabilities)
belowJs = belowJs.replaceAll('children:"Designed in every detail"', 'children:"System Capabilities"');
const oldGMatch = belowJs.match(/G=\{roof:\{label:"Roof"[\s\S]*?foundation:\{label:"Foundation"[\s\S]*?\}\}/);
if (oldGMatch) {
  const newG = `G={roof:{label:"0% Take-Rate",detail:"100% of revenue clears directly to your bank account with flat pricing",explode:[0,6.2,0]},structure:{label:"Quotes & E-Sign",detail:"Binding milestone contracts with instant 1-click invoice conversion",explode:[0,0,0]},facade:{label:"WhatsApp 2-Way",detail:"Automated confirmations & reminder dispatches reducing no-shows by 25%",explode:[0,.6,0]},interior:{label:"Ovelink Storefront",detail:"Custom branded portal at ovel.lk/l/[slug] with real-time inventory search",explode:[0,2.1,0]},foundation:{label:"Client CRM & Card",detail:"Encrypted card-on-file tokenization with reliability ratings and audit logs",explode:[0,-3.6,0]}}`;
  belowJs = belowJs.replace(oldGMatch[0], newG);
}

// Section 5: Process (Workflow)
belowJs = belowJs.replaceAll('children:"From vision to form"', 'children:"The 3-Step Flow"');
belowJs = belowJs.replaceAll('lines:["Our",e.jsx("em",{children:"Process"},"p")]', 'lines:["Our",e.jsx("em",{children:"Workflow"},"p")]');

const oldKMatch = belowJs.match(/K=\[\{n:"01",title:"Imagine"[\s\S]*?caption:"Materials, light & landscape"\}\]/);
if (oldKMatch) {
  const newK = `K=[{n:"01",title:"Quote & Book",lede:"Digital estimates convert to binding reservations.",copy:"Draft digital estimates with customizable package options, require upfront card deposits, and collect legally binding e-signatures on any device.",caption:"Dynamic Estimates & E-Signatures"},{n:"02",title:"Remind & Confirm",lede:"2-way WhatsApp eliminates 25% of empty appointment slots.",copy:"Automated reminder sequences notify clients across 24h and 2h windows. Clients confirm with '1' or reschedule with '2' directly inside WhatsApp.",caption:"Native WhatsApp Automation"},{n:"03",title:"Invoice & Settle",lede:"100% of revenue clears with zero platform commission.",copy:"Deposits automatically credit against total project balances. Generate corporate PDF invoices, support Net 7/15/30 terms, and settle directly to your bank.",caption:"0% Commission Settlement"}]`;
  belowJs = belowJs.replace(oldKMatch[0], newK);
}

// Section 6: Contact / Intake
belowJs = belowJs.replaceAll('lines:["Let’s build",e.jsx("span",\{children:"something"\}),"timeless."]', 'lines:["Deploy Your",e.jsx("span",{children:"Sovereign"},"s"),"Storefront."]');
belowJs = belowJs.replaceAll(
  'Every extraordinary space begins with a conversation.',
  'Join independent salons, clinics, and studios keeping 100% of their revenue with flat-price software.'
);

belowJs = belowJs.replaceAll('ne=["Private residence","Retreat","Pavilion","Interior"]', 'ne=["Aesthetic Clinic","Studio Rental","Auto Detailing","Artisanal Bakery","Specialist Care"]');

// Section 7: Footer
belowJs = belowJs.replaceAll(
  'crafted for living.',
  'The Sovereign Booking-to-Paid Engine for Independent Trade.'
);

belowJs = belowJs.replaceAll('children:"Spaces that breathe"', 'children:"The Sovereign Booking Engine"');

belowJs = belowJs.replaceAll(
  '482 Pacific Avenue, San Francisco, CA 94133',
  'Ovel Technologies Inc. · San Francisco & Global'
);

belowJs = belowJs.replaceAll('+1 415 890 2310', 'hello@ovel.app');

fs.writeFileSync("public/assets/Below-CqmAFXQi.js", belowJs);
console.log("Updated public/assets/Below-CqmAFXQi.js");

// =========================================================================
// 3. Sync to public/forma/assets/
// =========================================================================
fs.copyFileSync("public/assets/index-Bdh81gzm.js", "public/forma/assets/index-Bdh81gzm.js");
fs.copyFileSync("public/assets/Below-CqmAFXQi.js", "public/forma/assets/Below-CqmAFXQi.js");

console.log("All Ovel system content successfully applied and mirrored!");
