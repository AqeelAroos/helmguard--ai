"""
HelmGuard AI — Scalp Disease Classification Config
Central configuration for training, evaluation, and export.
"""
import os

# ── Paths ──
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

# ── Dataset ──
# 10 scalp/hair conditions — mapped to clinical display names
CLASS_NAMES = [
    "alopecia_areata",
    "contact_dermatitis",
    "folliculitis",
    "head_lice",
    "lichen_planus",
    "male_pattern_baldness",
    "psoriasis",
    "seborrheic_dermatitis",
    "telogen_effluvium",
    "tinea_capitis",
]

CLASS_DISPLAY_NAMES = {
    "alopecia_areata": "Alopecia Areata",
    "contact_dermatitis": "Contact Dermatitis",
    "folliculitis": "Folliculitis",
    "head_lice": "Head Lice",
    "lichen_planus": "Lichen Planus",
    "male_pattern_baldness": "Male Pattern Baldness",
    "psoriasis": "Psoriasis",
    "seborrheic_dermatitis": "Seborrheic Dermatitis",
    "telogen_effluvium": "Telogen Effluvium",
    "tinea_capitis": "Tinea Capitis",
}

# Clinical severity and recommendations per condition
CLASS_METADATA = {
    "alopecia_areata": {
        "severity": "moderate",
        "description": "Patchy hair loss caused by autoimmune attack on hair follicles.",
        "recommendations": [
            "Consult a dermatologist for corticosteroid treatment options",
            "Avoid harsh chemicals and tight hairstyles",
            "Consider minoxidil application as prescribed",
        ],
    },
    "contact_dermatitis": {
        "severity": "mild",
        "description": "Skin inflammation caused by direct contact with irritants or allergens.",
        "recommendations": [
            "Identify and avoid the trigger substance (helmet liner, shampoo, dye)",
            "Apply hypoallergenic moisturizer to affected areas",
            "Use fragrance-free, sulfate-free shampoo",
        ],
    },
    "folliculitis": {
        "severity": "moderate",
        "description": "Infection of hair follicles causing red, inflamed bumps.",
        "recommendations": [
            "Keep scalp clean and dry — wash after heavy sweating",
            "Apply antibacterial or antifungal shampoo (ketoconazole)",
            "Clean helmet liner regularly to prevent bacterial buildup",
        ],
    },
    "head_lice": {
        "severity": "mild",
        "description": "Parasitic infestation causing intense scalp itching.",
        "recommendations": [
            "Use medicated lice treatment shampoo (permethrin-based)",
            "Wash all headwear, bedding, and towels in hot water",
            "Do not share helmets or hair accessories",
        ],
    },
    "lichen_planus": {
        "severity": "high",
        "description": "Inflammatory condition that can cause scarring hair loss.",
        "recommendations": [
            "Seek dermatologist evaluation urgently — can cause permanent hair loss",
            "Topical corticosteroids may be prescribed",
            "Avoid scratching or picking affected areas",
        ],
    },
    "male_pattern_baldness": {
        "severity": "low",
        "description": "Genetic hair thinning pattern, typically at crown and temples.",
        "recommendations": [
            "Consider FDA-approved treatments (minoxidil, finasteride)",
            "Avoid tight helmets that add traction stress",
            "Scalp massage may improve blood circulation",
        ],
    },
    "psoriasis": {
        "severity": "moderate",
        "description": "Chronic autoimmune condition causing thick, scaly patches.",
        "recommendations": [
            "Use medicated shampoo with coal tar or salicylic acid",
            "Keep scalp moisturized — apply coconut or tea tree oil",
            "Consult dermatologist for phototherapy or systemic treatment",
        ],
    },
    "seborrheic_dermatitis": {
        "severity": "mild",
        "description": "Common condition causing flaky, itchy, red skin (severe dandruff).",
        "recommendations": [
            "Use anti-dandruff shampoo with zinc pyrithione or ketoconazole",
            "Wash hair regularly — don't let oil accumulate",
            "Clean helmet liner weekly to reduce fungal growth",
        ],
    },
    "telogen_effluvium": {
        "severity": "moderate",
        "description": "Temporary excessive hair shedding due to stress or health changes.",
        "recommendations": [
            "Identify and address underlying stressor (diet, sleep, illness)",
            "Ensure adequate protein, iron, and vitamin D intake",
            "Hair typically regrows within 6-9 months",
        ],
    },
    "tinea_capitis": {
        "severity": "high",
        "description": "Fungal infection (ringworm) of the scalp causing patches and hair loss.",
        "recommendations": [
            "Requires oral antifungal medication — see a doctor",
            "Use antifungal shampoo (selenium sulfide) as adjunct",
            "Disinfect or replace helmet liner immediately",
        ],
    },
}

NUM_CLASSES = len(CLASS_NAMES)

# ── Training Hyperparameters ──
IMAGE_SIZE = 224          # MobileNetV3 input size
BATCH_SIZE = 32
NUM_EPOCHS = 30
LEARNING_RATE = 1e-4      # Fine-tuning LR (lower than training from scratch)
WEIGHT_DECAY = 1e-4
WARMUP_EPOCHS = 3
MIN_LR = 1e-6

# ── Data Split ──
TRAIN_RATIO = 0.75
VAL_RATIO = 0.15
TEST_RATIO = 0.10

# ── Model ──
MODEL_NAME = "mobilenetv3_small_100"   # timm model name
PRETRAINED = True
DROPOUT = 0.3

# ── ONNX Export ──
ONNX_FILENAME = "helmguard_scalp_model.onnx"
ONNX_OPSET = 17

# ── Image Quality Thresholds ──
MIN_IMAGE_SIZE = 100       # Minimum dimension in pixels
BLUR_THRESHOLD = 80.0      # Laplacian variance below this = blurry
MIN_SKIN_RATIO = 0.15      # Minimum ratio of skin-like pixels
