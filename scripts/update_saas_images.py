import urllib.request
import subprocess
import os
import shutil

images_map = {
    # 1. Hero: SaaS Dashboard on sleek display
    "hero.avif": {
        "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=85",
        "has_720": False
    },
    # 2. Featured: Cloud Software on MacBook & Analytics
    "cliff-house.avif": {
        "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=85",
        "has_720": False
    },
    # 3. Contact: Modern Merchant Workspace & SaaS Setup
    "contact.avif": {
        "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85",
        "has_720": False
    },
    # 4. Philosophy 01 (Sovereign): Financial Dashboard & Zero Fees
    "philosophy-nature.avif": {
        "url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 5. Philosophy 02 (Trust): Direct Specialist & Client Booking
    "philosophy-people.avif": {
        "url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 6. Philosophy 03 (Estimates): Digital Quotes & Accounting
    "philosophy-material.avif": {
        "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 7. Philosophy 04 (Automation): WhatsApp Reminders on Mobile
    "philosophy-light.avif": {
        "url": "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 8. Philosophy 05 (SaaS Architecture): Clean Digital UI/UX
    "philosophy-interior.avif": {
        "url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 9. Engine 01 (Quotes & Proposals): Laptop with Digital Proposal
    "light-interior.avif": {
        "url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    # 10. Engine 02 (WhatsApp Reminders): Smartphone with Chat & Automation
    "material-detail.avif": {
        "url": "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    # 11. Engine 03 (0% Settle): Card Reader & Stripe Terminal Settlement
    "nature-architecture.avif": {
        "url": "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    # 12. Case Study 01 (Studio Rentals): Modern Creative Daylight Loft
    "project-cliff.avif": {
        "url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    # 13. Case Study 02 (Aesthetic Clinics): Treatment Room & Consultation
    "stillwater-residence.avif": {
        "url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    },
    # 14. Case Study 03 (Auto Detailing): Automotive Lab Work Order
    "solace-pavilion.avif": {
        "url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    },
    # 15. Case Study 04 (Artisanal Custom Bakery): Custom Cakes & Tastings
    "courtyard-residence.avif": {
        "url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    }
}

os.makedirs("/tmp/saas_imgs", exist_ok=True)
req_headers = {"User-Agent": "Mozilla/5.0"}

for filename, info in images_map.items():
    print(f"Encoding SaaS image: {filename}...")
    temp_jpg = f"/tmp/saas_imgs/{filename}.jpg"
    req = urllib.request.Request(info["url"], headers=req_headers)
    with urllib.request.urlopen(req) as resp, open(temp_jpg, "wb") as out_file:
        shutil.copyfileobj(resp, out_file)

    out_avif = f"public/images/{filename}"
    cmd = ["ffmpeg", "-y", "-i", temp_jpg, "-c:v", "libaom-av1", "-crf", "30", "-cpu-used", "8", out_avif]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.copyfile(out_avif, f"public/forma/images/{filename}")

    if info["has_720"]:
        base_name = filename.replace(".avif", "")
        file_720 = f"{base_name}-720.avif"
        out_720 = f"public/images/{file_720}"
        cmd_720 = ["ffmpeg", "-y", "-i", temp_jpg, "-vf", "scale=720:-1", "-c:v", "libaom-av1", "-crf", "32", "-cpu-used", "8", out_720]
        subprocess.run(cmd_720, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.copyfile(out_720, f"public/forma/images/{file_720}")

print("All SaaS images successfully downloaded and encoded!")
