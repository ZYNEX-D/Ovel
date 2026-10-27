import urllib.request
import subprocess
import os
import shutil

images_map = {
    "hero.avif": {
        "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85",
        "has_720": False
    },
    "cliff-house.avif": {
        "url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",
        "has_720": False
    },
    "contact.avif": {
        "url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85",
        "has_720": False
    },
    "philosophy-nature.avif": {
        "url": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "philosophy-people.avif": {
        "url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "philosophy-material.avif": {
        "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "philosophy-light.avif": {
        "url": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "philosophy-interior.avif": {
        "url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "light-interior.avif": {
        "url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    "material-detail.avif": {
        "url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    "nature-architecture.avif": {
        "url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1400&q=85",
        "has_720": True
    },
    "project-cliff.avif": {
        "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85",
        "has_720": False
    },
    "stillwater-residence.avif": {
        "url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    },
    "solace-pavilion.avif": {
        "url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    },
    "courtyard-residence.avif": {
        "url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85",
        "has_720": True
    }
}

os.makedirs("/tmp/ovel_imgs", exist_ok=True)
req_headers = {"User-Agent": "Mozilla/5.0"}

for filename, info in images_map.items():
    print(f"Processing {filename}...")
    temp_jpg = f"/tmp/ovel_imgs/{filename}.jpg"
    req = urllib.request.Request(info["url"], headers=req_headers)
    with urllib.request.urlopen(req) as resp, open(temp_jpg, "wb") as out_file:
        shutil.copyfileobj(resp, out_file)

    # Encode full AVIF
    out_avif = f"public/images/{filename}"
    cmd = ["ffmpeg", "-y", "-i", temp_jpg, "-c:v", "libaom-av1", "-crf", "30", "-cpu-used", "8", out_avif]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Mirror into public/forma/images/
    shutil.copyfile(out_avif, f"public/forma/images/{filename}")

    if info["has_720"]:
        base_name = filename.replace(".avif", "")
        file_720 = f"{base_name}-720.avif"
        out_720 = f"public/images/{file_720}"
        cmd_720 = ["ffmpeg", "-y", "-i", temp_jpg, "-vf", "scale=720:-1", "-c:v", "libaom-av1", "-crf", "32", "-cpu-used", "8", out_720]
        subprocess.run(cmd_720, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        shutil.copyfile(out_720, f"public/forma/images/{file_720}")

print("All Ovel imagery converted and updated successfully!")
