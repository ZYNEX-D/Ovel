import fs from "fs";

console.log("Applying 100% pure SaaS platform content to Ovel bundles...");

// =========================================================================
// 1. UPDATE index-Bdh81gzm.js
// =========================================================================
let indexJs = fs.readFileSync("public/assets/index-Bdh81gzm.js", "utf8");

// Hero Headline & Lede
indexJs = indexJs.replaceAll('Spaces that Breathe', 'Commerce that Breathes');
indexJs = indexJs.replaceAll('OVEL · Architecture studio', 'OVEL · ALL-IN-ONE COMMERCE SAAS');
indexJs = indexJs.replaceAll('OVEL · Operating Platform', 'OVEL · ALL-IN-ONE COMMERCE SAAS');
indexJs = indexJs.replaceAll('OVEL · BOOKING-TO-PAID PLATFORM', 'OVEL · ALL-IN-ONE COMMERCE SAAS');

indexJs = indexJs.replaceAll(
  'We design immersive homes where architecture, nature and the people who live in them are held in quiet balance.',
  'The flat-price SaaS platform unifying proposals, self-serve booking, automated WhatsApp reminders, and corporate invoicing with 0% transaction commission fees.'
);

indexJs = indexJs.replaceAll(
  'The sovereign booking-to-paid operating engine for luxury studios, clinics, and specialists. Unifying Quote → Book → Remind → Invoice → Settle with 0% take-rate.',
  'The flat-price SaaS platform unifying proposals, self-serve booking, automated WhatsApp reminders, and corporate invoicing with 0% transaction commission fees.'
);

indexJs = indexJs.replaceAll(
  'The sovereign flat-price operating system unifying Quote → Book → Remind → Invoice → Settle for salons, clinics, studios, and specialists. 0% take-rate.',
  'The flat-price SaaS platform unifying proposals, self-serve booking, automated WhatsApp reminders, and corporate invoicing with 0% transaction commission fees.'
);

// Hero Side
indexJs = indexJs.replaceAll(
  'Architecture, interiors & landscape — since 2009',
  'Quotes → Self-Serve Booking → WhatsApp → Invoicing → Settle'
);
indexJs = indexJs.replaceAll(
  'The Sovereign Booking-to-Paid Engine — 0% Take-Rate',
  'Quotes → Self-Serve Booking → WhatsApp → Invoicing → Settle'
);
indexJs = indexJs.replaceAll(
  'Quote → Book → Remind → Invoice → Settle · 0% Take-Rate',
  'Quotes → Self-Serve Booking → WhatsApp → Invoicing → Settle'
);

// Hero Build Kicker & Caption
indexJs = indexJs.replaceAll('Cliff House · built live', 'Ovel Platform Architecture · Live System');
indexJs = indexJs.replaceAll('Vance Loft · built live', 'Ovel Platform Architecture · Live System');
indexJs = indexJs.replaceAll('Ovel Core Engine · Live Architecture', 'Ovel Platform Architecture · Live System');

indexJs = indexJs.replaceAll('From soil to sanctuary', 'From client inquiry to bank settlement');
indexJs = indexJs.replaceAll('From booking to settlement', 'From client inquiry to bank settlement');
indexJs = indexJs.replaceAll('From inquiry to settlement', 'From client inquiry to bank settlement');

indexJs = indexJs.replaceAll('Cliff House · live model', 'Ovel Cloud Engine · Live Architecture');
indexJs = indexJs.replaceAll('Vance Loft · live atelier', 'Ovel Cloud Engine · Live Architecture');
indexJs = indexJs.replaceAll('Ovel Commerce Engine · Live Architecture', 'Ovel Cloud Engine · Live Architecture');

// The 7 Scroll Stages of the Live 3D Model Track:
// Replaces: "The site", "Foundations", "Structure", "Roof", "Glass", "Interiors", "Lights & fire"
const oldZcMatch = indexJs.match(/Zc=\[\{at:0,name:"[^"]+"\}[\s\S]*?\}\],c0=/);
if (oldZcMatch) {
  const newZc = `Zc=[{at:0,name:"Core Engine"},{at:.05,name:"Service Catalog"},{at:.14,name:"Digital Quotes"},{at:.27,name:"Calendar Sync"},{at:.33,name:"WhatsApp API"},{at:.41,name:"Invoicing Engine"},{at:.48,name:"0% Bank Settle"}],c0=`;
  indexJs = indexJs.replace(oldZcMatch[0], newZc);
}

// Navigation Sy & r3
const oldSyMatch = indexJs.match(/Sy=\[\{label:"[^"]+",href:"[^"]+"\}[\s\S]*?\]/);
if (oldSyMatch) {
  const newSy = `Sy=[{label:"Engines",href:"#living"},{label:"Capabilities",href:"#details"},{label:"Industry Solutions",href:"#projects"},{label:"How It Works",href:"#approach"},{label:"Sign In",href:"/login"}]`;
  indexJs = indexJs.replace(oldSyMatch[0], newSy);
}

const oldR3Match = indexJs.match(/r3=\[\{n:"01",label:"[^"]+",href:"[^"]+"\}[\s\S]*?\]/);
if (oldR3Match) {
  const newR3 = `r3=[{n:"01",label:"SaaS Engines",href:"#living"},{n:"02",label:"Cloud Stack",href:"#details"},{n:"03",label:"How It Works",href:"#approach"}]`;
  indexJs = indexJs.replace(oldR3Match[0], newR3);
}

indexJs = indexJs.replaceAll('children:["Let’s talk "', 'children:["Get Started "');
indexJs = indexJs.replaceAll('children:["Explore projects "', 'children:["Explore Solutions "');
indexJs = indexJs.replaceAll('children:["Explore Showroom "', 'children:["Explore Solutions "');

// 4 Industry Solutions in h3
const oldH3Match = indexJs.match(/h3=\[\{id:"cliff-house"[\s\S]*?\}\];function K1/);
if (oldH3Match) {
  const newH3 = `h3=[{id:"cliff-house",title:"Creative Studios & Production Lofts",type:"Hourly Daylight Cyc Studio Bookings",year:"Scale Plan",location:"Hourly Calendar Sync",area:"4,500 sq ft Cyc",...Qc("project-cliff"),summary:"Real-time self-serve booking calendar for hourly creative spaces with dynamic equipment add-ons, card deposit collection, automated WhatsApp access codes, and 0% commission."},{id:"stillwater",title:"Aesthetic Clinics & Luxury Salons",type:"Clinical Treatment & Appointment Scheduling",year:"Scale Plan",location:"Multi-Practitioner",area:"100% Settle",...Qc("project-stillwater"),summary:"Comprehensive treatment booking with card deposit collection, automated 2-way WhatsApp reminders, and direct settlement with zero marketplace commission fees."},{id:"solace",title:"Automotive & Detailing Labs",type:"Paint Correction & Work Order SaaS",year:"Growth Plan",location:"Itemized Work Orders",area:"Card on File",...Qc("project-solace"),summary:"Multi-stage work orders and ceramic coating proposals with digital e-signatures, package deliverables, itemized add-ons, and card-on-file cancellation protection."},{id:"courtyard",title:"Artisanal Custom Bakeries & Orders",type:"Bespoke Custom Cake Estimates & Tastings",year:"Starter Plan",location:"Confectionery Atelier",area:"Free Forever",...Qc("project-courtyard"),summary:"Interactive milestone estimates for multi-tier wedding cakes, tasting appointment scheduling, and automated WhatsApp payment links with zero platform commission."}];function K1`;
  indexJs = indexJs.replace(oldH3Match[0], newH3);
}

fs.writeFileSync("public/assets/index-Bdh81gzm.js", indexJs);
console.log("Updated public/assets/index-Bdh81gzm.js with SaaS platform content.");


// =========================================================================
// 2. UPDATE Below-CqmAFXQi.js
// =========================================================================
let belowJs = fs.readFileSync("public/assets/Below-CqmAFXQi.js", "utf8");

// Section 1: Philosophy / Harmony
belowJs = belowJs.replaceAll(
  'ue="We believe meaningful architecture exists in balance with its surroundings. Every space is an exploration of light, material, landscape and the rituals of the people who live there."',
  'ue="We believe sovereign merchants should own their customer relationships and retain 100% of their earnings. Ovel replaces take-rate marketplaces with a flat-price booking-to-paid operating system."'
);

const oldTMatch = belowJs.match(/T=\[\{name:"[^"]+",photo:E\("[^"]+"\)\}[\s\S]*?\]/);
if (oldTMatch) {
  const newT = `T=[{name:"0% Take-Rate",photo:E("philosophy-nature")},{name:"Direct Trust",photo:E("philosophy-people")},{name:"Estimates",photo:E("philosophy-material")},{name:"Automation",photo:E("philosophy-light")},{name:"Sovereignty",photo:E("philosophy")}]`;
  belowJs = belowJs.replace(oldTMatch[0], newT);
}

belowJs = belowJs.replaceAll('children:"Philosophy"', 'children:"Our Philosophy"');
belowJs = belowJs.replaceAll('children:"in Harmony."', 'children:"Commerce in Harmony."');

// Section 2: Featured Platform Architecture
belowJs = belowJs.replaceAll('lines:["The","Cliff House"]', 'lines:["The","Booking Engine"]');
belowJs = belowJs.replaceAll('lines:["The","Commerce Engine"]', 'lines:["The","Booking Engine"]');
belowJs = belowJs.replaceAll('children:"Featured project"', 'children:"Core Architecture"');

belowJs = belowJs.replaceAll(
  'A modern retreat perched above the horizon, designed to blur the line between architecture and nature.',
  'An end-to-end cloud platform engineered for service providers, specialists, and creative studios. From informal price inquiries to final bank settlement, every transaction flows through a single automated pipeline.'
);
belowJs = belowJs.replaceAll(
  'A sovereign commerce atelier engineered to unify client bookings, upfront deposit collection, and instant bank settlement with zero commission take-rate.',
  'An end-to-end cloud platform engineered for service providers, specialists, and creative studios. From informal price inquiries to final bank settlement, every transaction flows through a single automated pipeline.'
);
belowJs = belowJs.replaceAll(
  'A sovereign daylight cyc studio engineered to unify client bookings, equipment add-ons, and instant settlement with zero commission take-rate.',
  'An end-to-end cloud platform engineered for service providers, specialists, and creative studios. From informal price inquiries to final bank settlement, every transaction flows through a single automated pipeline.'
);

belowJs = belowJs.replaceAll('children:["Explore project "', 'children:["Explore Platform "');
belowJs = belowJs.replaceAll('children:["Explore Storefront "', 'children:["Explore Platform "');

// Viewpoints V in Cliff/Featured section
const oldVMatch = belowJs.match(/V=\[\{id:"exterior"[\s\S]*?zoom:1\.35\}\}\]/);
if (oldVMatch) {
  const newV = `V=[{id:"exterior",n:"01",label:"Storefront",note:"The sovereign public portal at ovel.lk/l/[slug], presenting your services with high-touch elegance, live search, and zero commission.",photo:{fx:.55,fy:.5,zoom:1.14}},{id:"structure",n:"02",label:"Architecture",note:"Under the hood: multi-installment Net credit terms, real-time client autosuggestion, and automatic deposit deductions.",photo:{fx:.47,fy:.66,zoom:1.55}},{id:"interior",n:"03",label:"Automation",note:"Direct 2-way WhatsApp automation dispatches receipts and reminders. Clients confirm in one tap with zero app downloads.",photo:{fx:.56,fy:.45,zoom:1.35}}]`;
  belowJs = belowJs.replace(oldVMatch[0], newV);
}

belowJs = belowJs.replaceAll('children:"Live model · blue hour"', 'children:"Live Cloud Architecture"');
belowJs = belowJs.replaceAll('children:"Live System Architecture"', 'children:"Live Cloud Architecture"');
belowJs = belowJs.replaceAll('children:"Drag to explore"', 'children:"Drag to inspect 3D system architecture"');
belowJs = belowJs.replaceAll('children:"Drag to orbit"', 'children:"Drag to inspect 3D system architecture"');

// Section 3: Living (3 System Engines)
belowJs = belowJs.replaceAll('children:"The art of living"', 'children:"Core SaaS Engines"');
belowJs = belowJs.replaceAll('lines:["The Art",e.jsx("em",{children:"of Living"},"o")]', 'lines:["The Core",e.jsx("em",{children:"SaaS Engines"},"o")]');
belowJs = belowJs.replaceAll('lines:["The Art",e.jsx("em",{children:"of Sovereign Trade"},"o")]', 'lines:["The Core",e.jsx("em",{children:"SaaS Engines"},"o")]');

belowJs = belowJs.replaceAll(
  'Three ideas guide every house we draw. Not a style — a way of paying attention to where, and how, people live.',
  'Three interconnected engines power every Ovel storefront. Not disparate plugins — one continuous operating system.'
);
belowJs = belowJs.replaceAll(
  'Three sovereign engines power every merchant storefront. 0% take-rate, automated WhatsApp reminders, and friction-free payment settlement.',
  'Three interconnected engines power every Ovel storefront. Not disparate plugins — one continuous operating system.'
);

belowJs = belowJs.replaceAll(
  '“The landscape was here first. Our work is to frame it — and then step out of the way.”',
  '“Your gross revenue is yours. Software should never take a percentage cut of your craft.”'
);

belowJs = belowJs.replaceAll('children:"OVEL design principle"', 'children:"OVEL SaaS Principle"');
belowJs = belowJs.replaceAll('children:"FORMA design principle"', 'children:"OVEL SaaS Principle"');
belowJs = belowJs.replaceAll('children:"OVEL Operating Philosophy"', 'children:"OVEL SaaS Principle"');

// Replace U array (3 engines)
const oldUMatch = belowJs.match(/U=\[\{word:"[^"]+"[\s\S]*?glow:"[^"]+"\}\]/);
if (oldUMatch) {
  const newU = `U=[{word:"Quotes",n:"01",photo:E("living-light"),title:"Interactive Estimates & E-Signatures.",copy:"Draft itemized proposals with package deliverables, require card deposits, and capture digital e-signatures that convert instantly into active invoices.",glow:"99, 193, 187"},{word:"WhatsApp",n:"02",photo:E("living-material"),title:"Automated 2-Way Client Reminders.",copy:"Dispatched automatically across 24h and 2h windows. Clients reply '1' to confirm or '2' to reschedule directly inside WhatsApp with zero app downloads, cutting no-shows by 25%.",glow:"16, 95, 104"},{word:"Settle",n:"03",photo:E("living-nature"),title:"0% Commission Direct Settlement.",copy:"Credit upfront deposits automatically against total balances, compute sales taxes, support Net 7/15/30 installment plans, and clear 100% of revenue directly to your bank.",glow:"62, 180, 160"}]`;
  belowJs = belowJs.replace(oldUMatch[0], newU);
}

// Section 4: Details (SaaS Capabilities)
belowJs = belowJs.replaceAll('children:"Designed in every detail"', 'children:"System Capabilities"');
belowJs = belowJs.replaceAll(
  'refined materials and precise construction come together to create timeless spaces. Scroll to take the house apart, system by system.',
  'An end-to-end cloud infrastructure engineered for zero friction. Scroll to explore the platform architecture, module by module.'
);
belowJs = belowJs.replaceAll(
  'interactive exploded model of a residence',
  'interactive exploded model of the Ovel SaaS platform'
);

const oldGMatch = belowJs.match(/G=\{roof:\{label:"[^"]+"[\s\S]*?foundation:\{label:"[^"]+"[\s\S]*?\}\}/);
if (oldGMatch) {
  const newG = `G={roof:{label:"0% Take-Rate",detail:"Flat subscription pricing with 100% direct bank deposit clearing",explode:[0,6.2,0]},structure:{label:"Quotes & E-Sign",detail:"Itemized milestone proposals with binding digital signatures and 1-click invoice conversion",explode:[0,0,0]},facade:{label:"WhatsApp 2-Way",detail:"Native WhatsApp reminder dispatches cutting empty appointment slots by 25%",explode:[0,.6,0]},interior:{label:"Ovelink Portal",detail:"Branded web storefront at ovel.lk/l/[slug] with real-time catalog search and filtering",explode:[0,2.1,0]},foundation:{label:"Client CRM & Card",detail:"Encrypted card-on-file tokenization with reliability scoring and no-show fee protection",explode:[0,-3.6,0]}}`;
  belowJs = belowJs.replace(oldGMatch[0], newG);
}

// Section 5: Industry Solutions (Replaces Showroom)
belowJs = belowJs.replaceAll('children:"Selected works"', 'children:"Industry Solutions"');
belowJs = belowJs.replaceAll('children:"Curated Merchants"', 'children:"Industry Solutions"');
belowJs = belowJs.replaceAll('children:"Showroom"', 'children:"Industry Solutions"');
belowJs = belowJs.replaceAll('children:"Projects"', 'children:"Industry Solutions"');
belowJs = belowJs.replaceAll('lines:["Our",e.jsx("em",{children:"Projects"},"p")]', 'lines:["Industry",e.jsx("em",{children:"Solutions"},"p")]');
belowJs = belowJs.replaceAll('lines:["Our",e.jsx("em",{children:"Showroom"},"p")]', 'lines:["Industry",e.jsx("em",{children:"Solutions"},"p")]');

belowJs = belowJs.replaceAll('children:"Next project"', 'children:"Next Solution"');
belowJs = belowJs.replaceAll('children:"Next Storefront"', 'children:"Next Solution"');

belowJs = belowJs.replaceAll('children:"Completed"', 'children:"SaaS Plan Tier"');
belowJs = belowJs.replaceAll('children:"Plan Tier"', 'children:"SaaS Plan Tier"');
belowJs = belowJs.replaceAll('children:"Area"', 'children:"Capacity"');
belowJs = belowJs.replaceAll('children:"Scope"', 'children:"Included Modules"');
belowJs = belowJs.replaceAll('Quote, Book, Remind, Invoice, Settle', 'Full Booking-to-Paid Suite (0% Fee)');

// Section 6: Process (How It Works)
belowJs = belowJs.replaceAll('children:"From vision to form"', 'children:"How It Works"');
belowJs = belowJs.replaceAll('children:"The 3-Step Flow"', 'children:"How It Works"');
belowJs = belowJs.replaceAll('lines:["Our",e.jsx("em",{children:"Process"},"p")]', 'lines:["How It",e.jsx("em",{children:"Works"},"p")]');
belowJs = belowJs.replaceAll('lines:["Our",e.jsx("em",{children:"Workflow"},"p")]', 'lines:["How It",e.jsx("em",{children:"Works"},"p")]');

belowJs = belowJs.replaceAll(
  'Blueprint to built form, animated with scroll',
  'From client inquiry to bank settlement, animated with scroll'
);

const oldKMatch = belowJs.match(/K=\[\{n:"01",title:"[^"]+"[\s\S]*?caption:"[^"]+"\}\]/);
if (oldKMatch) {
  const newK = `K=[{n:"01",title:"Quote & Book",lede:"Digital estimates convert to binding reservations.",copy:"Draft digital estimates with customizable package options, require upfront card deposits, and collect legally binding e-signatures on any device.",caption:"Dynamic Estimates & E-Signatures"},{n:"02",title:"Automate Reminders",lede:"2-way WhatsApp eliminates 25% of empty appointment slots.",copy:"Automated reminder sequences notify clients across 24h and 2h windows. Clients confirm with '1' or reschedule with '2' directly inside WhatsApp.",caption:"Native WhatsApp Automation"},{n:"03",title:"Invoice & Settle",lede:"100% of revenue clears with zero platform commission.",copy:"Deposits automatically credit against total project balances. Generate corporate PDF invoices, support Net 7/15/30 terms, and settle directly to your bank.",caption:"0% Commission Settlement"}]`;
  belowJs = belowJs.replace(oldKMatch[0], newK);
}

// Section 7: Contact / Signup
belowJs = belowJs.replaceAll('lines:["Let’s build",e.jsx("span",{children:"something"},"s"),"timeless."]', 'lines:["Deploy Your",e.jsx("span",{children:"Sovereign"},"s"),"Workspace."]');
belowJs = belowJs.replaceAll('lines:["Deploy Your",e.jsx("span",{children:"Sovereign"},"s"),"Storefront."]', 'lines:["Deploy Your",e.jsx("span",{children:"Sovereign"},"s"),"Workspace."]');
belowJs = belowJs.replaceAll(
  'Every extraordinary space begins with a conversation.',
  'Start running your business with 0% transaction commission fees. Select your tier and launch your sovereign booking portal in minutes.'
);
belowJs = belowJs.replaceAll(
  'Take back 100% of your earnings with a dedicated booking-to-paid platform.',
  'Start running your business with 0% transaction commission fees. Select your tier and launch your sovereign booking portal in minutes.'
);
belowJs = belowJs.replaceAll(
  'Join independent salons, clinics, and studios keeping 100% of their revenue with flat-price software.',
  'Start running your business with 0% transaction commission fees. Select your tier and launch your sovereign booking portal in minutes.'
);

belowJs = belowJs.replaceAll('children:"Project type"', 'children:"Business Type"');
belowJs = belowJs.replaceAll('children:"Business Category"', 'children:"Business Type"');

// Section 8: Footer
belowJs = belowJs.replaceAll(
  'crafted for living.',
  'The Sovereign Booking-to-Paid Engine for Independent Trade.'
);

belowJs = belowJs.replaceAll('children:"Spaces that breathe"', 'children:"The Sovereign Booking-to-Paid SaaS"');
belowJs = belowJs.replaceAll('children:"The Sovereign Booking Engine"', 'children:"The Sovereign Booking-to-Paid SaaS"');

belowJs = belowJs.replaceAll(
  '482 Pacific Avenue, San Francisco, CA 94133',
  'Ovel Technologies Inc. · San Francisco & Global'
);
belowJs = belowJs.replaceAll('+1 415 890 2310', 'hello@ovel.app');

fs.writeFileSync("public/assets/Below-CqmAFXQi.js", belowJs);
console.log("Updated public/assets/Below-CqmAFXQi.js with SaaS platform content.");

// =========================================================================
// 3. Sync to public/forma/assets/
// =========================================================================
fs.copyFileSync("public/assets/index-Bdh81gzm.js", "public/forma/assets/index-Bdh81gzm.js");
fs.copyFileSync("public/assets/Below-CqmAFXQi.js", "public/forma/assets/Below-CqmAFXQi.js");

console.log("All SaaS transformations successfully written and synchronized!");
