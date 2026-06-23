"""
HelmGuard AI — Dataset Download & Preparation
Downloads scalp disease datasets from Kaggle and organizes them.

Prerequisites:
  pip install kaggle
  Set up ~/.kaggle/kaggle.json with your Kaggle API credentials
  OR manually download from https://www.kaggle.com/datasets/sundarannamalai/hair-diseases

Usage:
  python download_dataset.py
"""
import os
import sys
import shutil
from pathlib import Path
from config import DATA_DIR, CLASS_NAMES

KAGGLE_DATASETS = [
    # Primary: 12,000 images, 10 classes
    "sundarannamalai/hair-diseases",
    # Secondary: 4,000 images, 10 classes
    "abubakar4u900/hair-and-scalp-disease-dataset",
]


def download_kaggle(dataset_slug, dest_dir):
    """Download dataset from Kaggle API."""
    try:
        import kaggle
        print(f"[*] Downloading {dataset_slug}...")
        kaggle.api.dataset_download_files(dataset_slug, path=dest_dir, unzip=True)
        print(f"[✓] Downloaded to {dest_dir}")
        return True
    except Exception as e:
        print(f"[!] Kaggle download failed: {e}")
        print(f"    Manual download: https://www.kaggle.com/datasets/{dataset_slug}")
        return False


def organize_dataset(raw_dir, output_dir):
    """
    Organize downloaded images into a standard structure:
      output_dir/
        class_name_1/
          img001.jpg
          img002.jpg
        class_name_2/
          ...
    """
    os.makedirs(output_dir, exist_ok=True)

    # Map common folder name variations to our standard class names
    name_map = {
        "alopecia areata": "alopecia_areata",
        "alopecia": "alopecia_areata",
        "contact dermatitis": "contact_dermatitis",
        "dermatitis": "contact_dermatitis",
        "folliculitis": "folliculitis",
        "head lice": "head_lice",
        "lice": "head_lice",
        "lichen planus": "lichen_planus",
        "lichen": "lichen_planus",
        "male pattern baldness": "male_pattern_baldness",
        "baldness": "male_pattern_baldness",
        "androgenetic alopecia": "male_pattern_baldness",
        "psoriasis": "psoriasis",
        "seborrheic dermatitis": "seborrheic_dermatitis",
        "dandruff": "seborrheic_dermatitis",
        "telogen effluvium": "telogen_effluvium",
        "tinea capitis": "tinea_capitis",
        "ringworm": "tinea_capitis",
    }

    total_copied = 0
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for root, dirs, files in os.walk(raw_dir):
        folder_name = os.path.basename(root).lower().strip()

        # Try to map folder name to a standard class
        mapped = name_map.get(folder_name)
        if not mapped:
            # Try partial match
            for key, val in name_map.items():
                if key in folder_name or folder_name in key:
                    mapped = val
                    break

        if not mapped or mapped not in CLASS_NAMES:
            continue

        class_dir = os.path.join(output_dir, mapped)
        os.makedirs(class_dir, exist_ok=True)

        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext not in image_exts:
                continue

            src = os.path.join(root, f)
            # Avoid duplicates by prefixing with counter
            existing = len(os.listdir(class_dir))
            dst_name = f"{mapped}_{existing:04d}{ext}"
            dst = os.path.join(class_dir, dst_name)
            shutil.copy2(src, dst)
            total_copied += 1

    return total_copied


def print_stats(data_dir):
    """Print dataset statistics."""
    print("\n" + "=" * 50)
    print("DATASET STATISTICS")
    print("=" * 50)

    total = 0
    for cls in sorted(CLASS_NAMES):
        cls_dir = os.path.join(data_dir, cls)
        if os.path.exists(cls_dir):
            count = len([f for f in os.listdir(cls_dir) if not f.startswith(".")])
            total += count
            bar = "█" * (count // 20)
            print(f"  {cls:<28} {count:>5} images  {bar}")
        else:
            print(f"  {cls:<28}     0 images  ⚠ MISSING")

    print(f"\n  TOTAL: {total} images across {len(CLASS_NAMES)} classes")
    print("=" * 50)


def main():
    raw_dir = os.path.join(DATA_DIR, "raw")
    organized_dir = os.path.join(DATA_DIR, "organized")

    os.makedirs(raw_dir, exist_ok=True)

    print("=" * 50)
    print("HelmGuard AI — Dataset Download")
    print("=" * 50)

    # Try downloading from Kaggle
    success = False
    for slug in KAGGLE_DATASETS:
        if download_kaggle(slug, raw_dir):
            success = True
            break

    if not success:
        print("\n[!] Automatic download failed.")
        print("[!] Please manually download one of these datasets:")
        for slug in KAGGLE_DATASETS:
            print(f"    https://www.kaggle.com/datasets/{slug}")
        print(f"\n[!] Extract to: {raw_dir}")
        print("[!] Then re-run this script.")

        # Check if data was manually placed
        if not any(os.scandir(raw_dir)):
            sys.exit(1)

    # Organize
    print(f"\n[*] Organizing dataset into {organized_dir}...")
    count = organize_dataset(raw_dir, organized_dir)
    print(f"[✓] Organized {count} images")

    print_stats(organized_dir)

    if count < 1000:
        print("\n[⚠] Low image count. Download both datasets for best results.")
        print("    Re-run after downloading more data to the raw/ folder.")


if __name__ == "__main__":
    main()
