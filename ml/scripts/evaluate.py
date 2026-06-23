"""
HelmGuard AI — Model Evaluation & Visualization
Generates detailed accuracy metrics, confusion matrix, and per-class analysis.

Usage:
  python evaluate.py
"""
import os
import json
import numpy as np
import torch
import timm
from torchvision import transforms, datasets
from torch.utils.data import DataLoader, Subset
from sklearn.metrics import classification_report, confusion_matrix, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedShuffleSplit
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from config import *

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model():
    checkpoint = torch.load(os.path.join(MODELS_DIR, "final_model.pth"), map_location=device, weights_only=False)
    model = timm.create_model(checkpoint["config"]["model_name"], pretrained=False, num_classes=checkpoint["config"]["num_classes"])
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device).eval()
    return model, checkpoint["class_names"]


def get_test_loader():
    data_dir = os.path.join(DATA_DIR, "organized")
    transform = transforms.Compose([
        transforms.Resize(int(IMAGE_SIZE * 1.14)),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    dataset = datasets.ImageFolder(data_dir, transform=transform)
    indices = list(range(len(dataset)))
    labels = dataset.targets
    sss = StratifiedShuffleSplit(n_splits=1, test_size=TEST_RATIO, random_state=42)
    _, test_idx = next(sss.split(indices, labels))
    test_dataset = Subset(dataset, test_idx)
    return DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4), dataset.classes


@torch.no_grad()
def full_evaluation():
    os.makedirs(RESULTS_DIR, exist_ok=True)

    print("=" * 60)
    print("HelmGuard AI — Full Model Evaluation")
    print("=" * 60)

    model, class_names = load_model()
    test_loader, _ = get_test_loader()

    all_preds = []
    all_labels = []
    all_probs = []

    for images, labels in test_loader:
        images = images.to(device)
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)
        _, predicted = outputs.max(1)

        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.numpy())
        all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    # ── Metrics ──
    accuracy = (all_preds == all_labels).mean() * 100
    f1_weighted = f1_score(all_labels, all_preds, average="weighted") * 100
    f1_macro = f1_score(all_labels, all_preds, average="macro") * 100

    print(f"\nOverall Accuracy:    {accuracy:.2f}%")
    print(f"Weighted F1 Score:   {f1_weighted:.2f}%")
    print(f"Macro F1 Score:      {f1_macro:.2f}%")

    # Per-class report
    report_str = classification_report(all_labels, all_preds, target_names=class_names, digits=3)
    print(f"\n{report_str}")
    report_dict = classification_report(all_labels, all_preds, target_names=class_names, digits=3, output_dict=True)

    # ── Confusion Matrix ──
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.title("Confusion Matrix — HelmGuard Scalp Disease Model", fontsize=14)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    cm_path = os.path.join(RESULTS_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=150)
    print(f"\n[✓] Confusion matrix saved to {cm_path}")

    # ── Per-class accuracy bar chart ──
    per_class_acc = cm.diagonal() / cm.sum(axis=1) * 100
    plt.figure(figsize=(12, 6))
    colors = ["#00d4aa" if acc > 85 else "#f59e0b" if acc > 70 else "#ef4444" for acc in per_class_acc]
    bars = plt.barh(class_names, per_class_acc, color=colors)
    plt.xlabel("Accuracy (%)")
    plt.title("Per-Class Accuracy — HelmGuard Scalp Disease Model")
    for bar, acc in zip(bars, per_class_acc):
        plt.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2, f"{acc:.1f}%", va="center", fontsize=10)
    plt.tight_layout()
    acc_path = os.path.join(RESULTS_DIR, "per_class_accuracy.png")
    plt.savefig(acc_path, dpi=150)
    print(f"[✓] Per-class accuracy chart saved to {acc_path}")

    # ── Confidence distribution ──
    max_probs = all_probs.max(axis=1)
    correct_mask = all_preds == all_labels
    plt.figure(figsize=(10, 5))
    plt.hist(max_probs[correct_mask], bins=30, alpha=0.7, label="Correct", color="#00d4aa")
    plt.hist(max_probs[~correct_mask], bins=30, alpha=0.7, label="Incorrect", color="#ef4444")
    plt.xlabel("Confidence")
    plt.ylabel("Count")
    plt.title("Confidence Distribution")
    plt.legend()
    plt.tight_layout()
    conf_path = os.path.join(RESULTS_DIR, "confidence_distribution.png")
    plt.savefig(conf_path, dpi=150)
    print(f"[✓] Confidence distribution saved to {conf_path}")

    # ── Save full results ──
    results = {
        "accuracy": accuracy,
        "f1_weighted": f1_weighted,
        "f1_macro": f1_macro,
        "per_class": report_dict,
        "per_class_accuracy": {cn: float(acc) for cn, acc in zip(class_names, per_class_acc)},
        "avg_confidence_correct": float(max_probs[correct_mask].mean()),
        "avg_confidence_incorrect": float(max_probs[~correct_mask].mean()) if (~correct_mask).any() else 0,
        "total_test_samples": len(all_labels),
    }

    with open(os.path.join(RESULTS_DIR, "evaluation_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*60}")
    print(f"EVALUATION COMPLETE")
    print(f"  Accuracy: {accuracy:.2f}%  |  F1: {f1_weighted:.2f}%")
    print(f"  All charts saved to {RESULTS_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    full_evaluation()
