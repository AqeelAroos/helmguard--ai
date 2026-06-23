"""
HelmGuard AI — ONNX Model Export
Exports trained PyTorch model to ONNX format for browser inference.

Usage:
  python export_onnx.py

Output:
  - ml/models/helmguard_scalp_model.onnx (browser-ready model)
  - public/models/helmguard_scalp_model.onnx (copied for web serving)
  - public/models/model_config.json (class names + metadata)
"""
import os
import sys
import json
import shutil
import torch
import timm
import onnx
from config import *

def export():
    print("=" * 60)
    print("HelmGuard AI — ONNX Model Export")
    print("=" * 60)

    # Load trained model
    checkpoint_path = os.path.join(MODELS_DIR, "final_model.pth")
    if not os.path.exists(checkpoint_path):
        print(f"[!] No trained model found at {checkpoint_path}")
        print("[!] Run train.py first.")
        sys.exit(1)

    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    class_names = checkpoint["class_names"]
    config = checkpoint["config"]

    # Recreate model architecture
    model = timm.create_model(
        config["model_name"],
        pretrained=False,
        num_classes=config["num_classes"],
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Export to ONNX
    dummy_input = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE)
    onnx_path = os.path.join(MODELS_DIR, ONNX_FILENAME)

    print(f"[*] Exporting to ONNX (opset {ONNX_OPSET})...")
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=ONNX_OPSET,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )

    # Validate
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)

    # Model size
    size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"[✓] ONNX model exported: {onnx_path} ({size_mb:.1f} MB)")

    # ── Quantize for smaller size (optional) ──
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantized_path = onnx_path.replace(".onnx", "_quantized.onnx")
        quantize_dynamic(onnx_path, quantized_path, weight_type=QuantType.QUInt8)
        q_size_mb = os.path.getsize(quantized_path) / (1024 * 1024)
        print(f"[✓] Quantized model: {quantized_path} ({q_size_mb:.1f} MB)")

        # Use quantized version if significantly smaller
        if q_size_mb < size_mb * 0.8:
            print(f"[*] Using quantized model (saved {size_mb - q_size_mb:.1f} MB)")
            onnx_path = quantized_path
            size_mb = q_size_mb
    except ImportError:
        print("[*] onnxruntime not available for quantization, using full model")

    # ── Copy to public/models for web serving ──
    public_models = os.path.join(BASE_DIR, "..", "public", "models")
    os.makedirs(public_models, exist_ok=True)

    dest_onnx = os.path.join(public_models, ONNX_FILENAME)
    shutil.copy2(onnx_path, dest_onnx)
    print(f"[✓] Copied to {dest_onnx}")

    # ── Write model config JSON for browser ──
    model_config = {
        "modelFile": ONNX_FILENAME,
        "modelSize": f"{size_mb:.1f}MB",
        "inputSize": IMAGE_SIZE,
        "numClasses": NUM_CLASSES,
        "classNames": class_names,
        "classDisplayNames": CLASS_DISPLAY_NAMES,
        "classMetadata": CLASS_METADATA,
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
        },
        "version": "1.0.0",
        "architecture": MODEL_NAME,
    }

    config_path = os.path.join(public_models, "model_config.json")
    with open(config_path, "w") as f:
        json.dump(model_config, f, indent=2)
    print(f"[✓] Config saved to {config_path}")

    # ── Test inference ──
    print("\n[*] Testing ONNX inference...")
    import onnxruntime as ort
    import numpy as np

    session = ort.InferenceSession(dest_onnx)
    test_input = np.random.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE).astype(np.float32)
    outputs = session.run(None, {"input": test_input})
    probs = np.exp(outputs[0]) / np.exp(outputs[0]).sum(axis=1, keepdims=True)

    print(f"[✓] Inference test passed — output shape: {outputs[0].shape}")
    print(f"[✓] Top prediction: {class_names[np.argmax(probs)]} ({np.max(probs)*100:.1f}%)")

    print(f"\n{'='*60}")
    print(f"EXPORT COMPLETE")
    print(f"  Model: {dest_onnx}")
    print(f"  Config: {config_path}")
    print(f"  Size: {size_mb:.1f} MB")
    print(f"  Ready for browser deployment via ONNX Runtime Web")
    print(f"{'='*60}")


if __name__ == "__main__":
    export()
