# HelmGuard AI — Scalp Disease ML Training Pipeline

## Overview
Custom MobileNetV3-Small model trained to detect 10 scalp conditions from images.
Runs **directly in the browser** via ONNX Runtime Web — no API calls needed.

## Quick Start

### 1. Install Python dependencies
```bash
cd ml
pip install -r requirements.txt
```

### 2. Download dataset
```bash
cd scripts
python download_dataset.py
```
Or manually download from:
- https://www.kaggle.com/datasets/sundarannamalai/hair-diseases (12,000 images)
- https://www.kaggle.com/datasets/abubakar4u900/hair-and-scalp-disease-dataset (4,000 images)

Extract to `ml/data/raw/` then re-run the script.

### 3. Train the model
```bash
python train.py
```
Training takes ~15-30 minutes on GPU, ~2-4 hours on CPU.

### 4. Evaluate
```bash
python evaluate.py
```
Generates confusion matrix, per-class accuracy, and confidence analysis.

### 5. Export to ONNX for browser
```bash
python export_onnx.py
```
This creates `public/models/helmguard_scalp_model.onnx` — the browser loads it automatically.

## Architecture
- **Model:** MobileNetV3-Small (pretrained on ImageNet)
- **Training:** Transfer learning with progressive unfreezing
- **Input:** 224×224 RGB image
- **Output:** 10-class probability distribution
- **Size:** ~3-4 MB (quantized ONNX)
- **Inference:** <200ms in browser

## Dataset Details
| Condition | Images | Severity |
|-----------|--------|----------|
| Alopecia Areata | ~1,200 | Moderate |
| Contact Dermatitis | ~1,200 | Mild |
| Folliculitis | ~1,200 | Moderate |
| Head Lice | ~1,200 | Mild |
| Lichen Planus | ~1,200 | High |
| Male Pattern Baldness | ~1,200 | Low |
| Psoriasis | ~1,200 | Moderate |
| Seborrheic Dermatitis | ~1,200 | Mild |
| Telogen Effluvium | ~1,200 | Moderate |
| Tinea Capitis | ~1,200 | High |

## Expected Metrics
- **Accuracy:** 85-90%
- **Weighted F1:** 0.84-0.91
- **Inference time:** 100-200ms (browser)

## Limitations
- Training data is primarily from clinical/dermatological sources
- May have reduced accuracy on darker skin tones (dataset bias)
- Not validated for medical diagnosis — screening tool only
- Requires clear, well-lit scalp images for best results

## Future Improvements
- Add "healthy scalp" class for normal baseline
- Expand dataset with more diverse skin tones
- Multi-label classification (co-occurring conditions)
- Severity grading within each condition
- Integration with dermatologist review workflow
