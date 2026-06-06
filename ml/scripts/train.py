"""
HelmGuard AI — Model Training Pipeline
Fine-tunes MobileNetV3-Small on the Hair Diseases dataset (12,000 images, 10 classes).

Usage:
  py train.py
"""
import os
import sys
import json
import time
import copy
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets
import timm
from sklearn.metrics import classification_report, f1_score
from tqdm import tqdm

from config import *

# ── Reproducibility ──
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[*] Device: {device}")

# ── Dataset path (pre-split from Kaggle) ──
DATASET_ROOT = os.path.join(DATA_DIR, "raw", "Hair Diseases - Final")


def get_transforms():
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.RandomGrayscale(p=0.05),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.0)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.15, scale=(0.02, 0.15)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(int(IMAGE_SIZE * 1.14)),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def create_datasets():
    train_transform, val_transform = get_transforms()

    train_dir = os.path.join(DATASET_ROOT, "train")
    val_dir = os.path.join(DATASET_ROOT, "val")
    test_dir = os.path.join(DATASET_ROOT, "test")

    for d in [train_dir, val_dir, test_dir]:
        if not os.path.exists(d):
            print(f"[!] Missing: {d}")
            print("[!] Extract the Kaggle dataset to ml/data/raw/")
            sys.exit(1)

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)
    test_dataset = datasets.ImageFolder(test_dir, transform=val_transform)

    print(f"[*] Train: {len(train_dataset)} | Val: {len(val_dataset)} | Test: {len(test_dataset)}")
    print(f"[*] Classes: {train_dataset.classes}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)

    return train_loader, val_loader, test_loader, train_dataset.classes


def create_model():
    model = timm.create_model(MODEL_NAME, pretrained=PRETRAINED, num_classes=NUM_CLASSES, drop_rate=DROPOUT)

    # Freeze early layers for first few epochs
    for name, param in model.named_parameters():
        if "classifier" not in name and "blocks.5" not in name and "blocks.4" not in name:
            param.requires_grad = False

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"[*] Model: {MODEL_NAME}")
    print(f"[*] Params: {total_params:,} total, {trainable:,} trainable ({trainable/total_params*100:.1f}%)")

    return model.to(device)


def train_one_epoch(model, loader, criterion, optimizer, epoch):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(loader, desc=f"Epoch {epoch+1}/{NUM_EPOCHS} [Train]", leave=False)
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        pbar.set_postfix(loss=f"{loss.item():.4f}", acc=f"{100.*correct/total:.1f}%")

    return running_loss / total, 100. * correct / total


@torch.no_grad()
def evaluate(model, loader, criterion):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    avg_loss = running_loss / total
    accuracy = 100. * correct / total
    f1 = f1_score(all_labels, all_preds, average="weighted") * 100
    return avg_loss, accuracy, f1, all_preds, all_labels


def train():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    print("=" * 60)
    print("HelmGuard AI — Scalp Disease Model Training")
    print("=" * 60)

    train_loader, val_loader, test_loader, class_names = create_datasets()
    model = create_model()

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=NUM_EPOCHS, T_mult=1, eta_min=MIN_LR)

    best_val_f1 = 0
    best_model_state = None
    patience = 8
    patience_counter = 0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "val_f1": [], "lr": []}

    start_time = time.time()

    for epoch in range(NUM_EPOCHS):
        lr = optimizer.param_groups[0]["lr"]
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, epoch)
        val_loss, val_acc, val_f1, _, _ = evaluate(model, val_loader, criterion)
        scheduler.step()

        # Unfreeze all layers after warmup
        if epoch == WARMUP_EPOCHS:
            print(f"\n[*] Unfreezing all layers at epoch {epoch+1}")
            for param in model.parameters():
                param.requires_grad = True
            optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE * 0.1, weight_decay=WEIGHT_DECAY)
            scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=NUM_EPOCHS - epoch, eta_min=MIN_LR)

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_f1"].append(val_f1)
        history["lr"].append(lr)

        print(f"Epoch {epoch+1:>2}/{NUM_EPOCHS} | "
              f"Train: {train_loss:.4f} / {train_acc:.1f}% | "
              f"Val: {val_loss:.4f} / {val_acc:.1f}% / F1:{val_f1:.1f}% | "
              f"LR: {lr:.6f}")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_model_state = copy.deepcopy(model.state_dict())
            patience_counter = 0
            torch.save(best_model_state, os.path.join(MODELS_DIR, "best_model.pth"))
            print(f"  >>> New best model! F1: {val_f1:.1f}%")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n[*] Early stopping at epoch {epoch+1}")
                break

    elapsed = time.time() - start_time
    print(f"\n[+] Training complete in {elapsed/60:.1f} minutes")

    # ── Test Evaluation ──
    print("\n" + "=" * 60)
    print("TEST SET EVALUATION")
    print("=" * 60)

    model.load_state_dict(best_model_state)
    test_loss, test_acc, test_f1, test_preds, test_labels = evaluate(model, test_loader, criterion)

    print(f"\n  Accuracy:  {test_acc:.2f}%")
    print(f"  F1 Score:  {test_f1:.2f}%")
    print(f"  Loss:      {test_loss:.4f}")

    report = classification_report(test_labels, test_preds, target_names=class_names, digits=3, output_dict=True)
    print("\n" + classification_report(test_labels, test_preds, target_names=class_names, digits=3))

    # Save results
    results = {
        "test_accuracy": test_acc,
        "test_f1": test_f1,
        "best_val_f1": best_val_f1,
        "training_time_minutes": elapsed / 60,
        "epochs_trained": len(history["train_loss"]),
        "model_name": MODEL_NAME,
        "num_classes": NUM_CLASSES,
        "class_names": class_names,
        "classification_report": report,
        "history": history,
    }
    with open(os.path.join(RESULTS_DIR, "training_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    # Save final model
    torch.save({
        "model_state_dict": best_model_state,
        "class_names": class_names,
        "config": {"model_name": MODEL_NAME, "num_classes": NUM_CLASSES, "image_size": IMAGE_SIZE},
    }, os.path.join(MODELS_DIR, "final_model.pth"))

    print(f"\n[+] Model saved to {MODELS_DIR}/final_model.pth")
    print(f"[+] Results saved to {RESULTS_DIR}/training_results.json")
    print(f"\n[*] Next step: py export_onnx.py")


if __name__ == "__main__":
    train()
