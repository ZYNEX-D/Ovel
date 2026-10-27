import fs from "fs";

// 1. Update index-Bdh81gzm.js
let indexJs = fs.readFileSync("public/assets/index-Bdh81gzm.js", "utf8");

// Hero Lede
indexJs = indexJs.replaceAll(
  'We design immersive homes where architecture, nature and the people who live in them are held in quiet balance.',
  'The sovereign booking-to-paid operating engine for luxury studios, clinics, and specialists. Unifying Quote → Book → Remind → Invoice → Settle with 0% take-rate.'
);

// Hero Side
indexJs = indexJs.replaceAll(
  'Architecture, interiors & landscape — since 2009',
  'The Sovereign Booking-to-Paid Engine — 0% Take-Rate'
);

// Hero Build Kicker
indexJs = indexJs.replaceAll(
  'Cliff House · built live',
  'Vance Loft · built live'
);

// Hero Caption
indexJs = indexJs.replaceAll(
  'From soil to sanctuary',
  'From booking to settlement'
);

// Chapters Navigation
indexJs = indexJs.replaceAll(
  '{n:"01",label:"Architecture",href:"#featured"},{n:"02",label:"Interiors",href:"#living"},{n:"03",label:"Experiences",href:"#approach"}',
  '{n:"01",label:"Atelier",href:"#featured"},{n:"02",label:"Engines",href:"#living"},{n:"03",label:"Process",href:"#approach"}'
);

// Storefronts in h3
const oldH3Regex = /h3=\[\{id:"cliff-house"[\s\S]*?\}\];function K1/g;
const newH3 = `h3=[{id:"cliff-house",title:"Vance Production Loft",type:"Daylight Cyc Studio",year:"2026",location:"Arts District",area:"4,500 sq ft",...Qc("project-cliff"),summary:"Hourly daylight cyc bookings with instant dynamic quotes, gear add-ons, zero take-rate, and automated WhatsApp reminder confirmations."},{id:"stillwater",title:"L'Éclat Boutique",type:"Aesthetic & Clinical Care",year:"2026",location:"Mayfair & Colombo",area:"Scale Tier",...Qc("project-stillwater"),summary:"Curated high-end clinical treatments, deposit collection, automated reminder sequences, and direct settlement with zero commission deductions."},{id:"solace",title:"Apex Auto Lab",type:"Paint Correction & Detailing",year:"2026",location:"Industrial Bay 4",area:"Growth Tier",...Qc("project-solace"),summary:"Multi-stage paint correction and bespoke ceramic coating bookings with digital work orders, itemized quotes, and card-on-file protection."},{id:"courtyard",title:"Velvet Crumb Bakes",type:"Artisanal Custom Bakery",year:"2026",location:"The Confectionery Atelier",area:"Free Starter",...Qc("project-courtyard"),summary:"Custom multi-tier cake estimates, tasting appointment scheduling, and automated WhatsApp payment links."}];function K1`;

indexJs = indexJs.replace(oldH3Regex, newH3);
fs.writeFileSync("public/assets/index-Bdh81gzm.js", indexJs);

// 2. Update Below-CqmAFXQi.js
let belowJs = fs.readFileSync("public/assets/Below-CqmAFXQi.js", "utf8");

belowJs = belowJs.replaceAll(
  'Three ideas guide every house we draw. Not a style — a way of paying attention to where, and how, people live.',
  'Three sovereign engines power every merchant storefront. 0% take-rate, automated WhatsApp reminders, and friction-free payment settlement.'
);

belowJs = belowJs.replaceAll(
  '“The landscape was here first. Our work is to frame it — and then step out of the way.”',
  '“Your revenue is sovereign. Software should never take a percentage cut of your craft.”'
);

belowJs = belowJs.replaceAll(
  'A modern retreat perched above the horizon, designed to blur the line between architecture and nature.',
  'A sovereign daylight cyc studio engineered to unify client bookings, equipment add-ons, and instant settlement with zero commission take-rate.'
);

belowJs = belowJs.replaceAll(
  'Architecture, interiors, landscape',
  'Quote, Book, Remind, Invoice, Settle'
);

belowJs = belowJs.replaceAll(
  'Every extraordinary space begins with a conversation.',
  'Take back 100% of your earnings with a dedicated booking-to-paid platform.'
);

belowJs = belowJs.replaceAll(
  '482 Pacific Avenue, San Francisco, CA 94133',
  'Ovel Technologies Inc. · San Francisco & Global'
);

belowJs = belowJs.replaceAll(
  '+1 415 890 2310',
  'hello@ovel.app'
);

fs.writeFileSync("public/assets/Below-CqmAFXQi.js", belowJs);

console.log("Ovel branding & copy successfully applied to JS bundles!");
