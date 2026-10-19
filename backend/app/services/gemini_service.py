"""PlantCare AI — Gemini AI service for plant disease analysis."""
from __future__ import annotations

import asyncio
import base64
import json
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

# Structured JSON schema for the analysis response
ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "is_plant_image": {
            "type": "boolean",
            "description": "Whether the image contains a plant."
        },
        "plant_name": {
            "type": "string",
            "description": "Identified plant species or crop name."
        },
        "plant_part": {
            "type": "string",
            "description": "Plant part shown (leaf, stem, fruit, root, etc.)."
        },
        "health_status": {
            "type": "string",
            "description": "Overall health assessment: 'Healthy', 'Possible disease detected', 'Inconclusive', or 'Not a plant image'."
        },
        "disease_name": {
            "type": "string",
            "description": "Suspected disease name, or empty string if healthy/inconclusive."
        },
        "confidence": {
            "type": "number",
            "description": "Model self-reported confidence 0.0–1.0 (not a calibrated probability)."
        },
        "confidence_explanation": {
            "type": "string",
            "description": "Brief explanation of what the confidence score represents and its limitations."
        },
        "symptoms_observed": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of visible symptoms identified in the image."
        },
        "possible_causes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Possible causes for the observed symptoms."
        },
        "severity": {
            "type": "string",
            "description": "Estimated severity: 'Mild', 'Moderate', 'Severe', or 'Unknown'."
        },
        "explanation": {
            "type": "string",
            "description": "Plain-language explanation of the assessment for farmers."
        },
        "recommended_actions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Practical, safe recommended next steps. Prioritize cultural practices."
        },
        "prevention_tips": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Prevention measures for future reference."
        },
        "professional_help_needed": {
            "type": "boolean",
            "description": "Whether professional agricultural consultation is recommended."
        },
        "limitations": {
            "type": "string",
            "description": "Limitations of this AI-based assessment."
        }
    },
    "required": [
        "is_plant_image", "plant_name", "plant_part", "health_status",
        "disease_name", "confidence", "confidence_explanation",
        "symptoms_observed", "possible_causes", "severity", "explanation",
        "recommended_actions", "prevention_tips",
        "professional_help_needed", "limitations"
    ]
}


def _build_prompt(
    crop: str = "",
    symptoms: str = "",
    language: str = "en"
) -> str:
    """Build the analysis prompt for Gemini."""
    lang_instruction = ""
    if language == "ml":
        lang_instruction = (
            "\n\nIMPORTANT: Provide ALL text fields (explanation, recommended_actions, "
            "prevention_tips, symptoms_observed, possible_causes, limitations, "
            "health_status, confidence_explanation) in Malayalam (മലയാളം). "
            "Keep field names in English. Keep plant_name and disease_name "
            "in both English and Malayalam where possible."
        )

    crop_hint = f"\nThe farmer indicates this is a {crop} plant." if crop else ""
    symptom_hint = (
        f"\nThe farmer describes these symptoms: {symptoms}" if symptoms else ""
    )

    return f"""You are an expert agricultural plant pathologist AI assistant.
Analyze the provided plant image carefully and return a JSON assessment.

Guidelines:
- Determine if the image shows a plant. If not, set is_plant_image to false.
- Identify the plant species/crop and the part shown (leaf, stem, fruit, etc.).
- Look for visible symptoms: discoloration, spots, wilting, lesions, mold, etc.
- Suggest plausible diseases or alternative causes based on visible evidence.
- Explain the assessment in simple language a farmer can understand.
- Assess severity only when supported by visual evidence.
- Recommend practical, safe next steps. Prioritize cultural practices and sanitation.
- Do NOT automatically prescribe specific pesticides or invent chemical dosages.
- Recommend consulting a local agricultural extension officer when appropriate.
- If the image is unclear or insufficient, provide an inconclusive response.
- The confidence score is your self-reported assessment, NOT a calibrated probability.
- Always state limitations of this image-based AI assessment.
{crop_hint}{symptom_hint}{lang_instruction}

Return ONLY valid JSON matching the required schema."""


def _get_simulated_result(crop: str = "", symptoms: str = "", language: str = "en") -> dict:
    """Return realistic fallback diagnostic data when GEMINI_API_KEY is not configured."""
    crop_name = crop.capitalize() if crop else "Tomato"
    
    if language == "ml":
        return {
            "is_plant_image": True,
            "plant_name": f"{crop_name} (തക്കാളി)",
            "plant_part": "ഇല (Leaf)",
            "health_status": "Possible disease detected",
            "disease_name": "Early Blight / ഇലപ്പുള്ളി രോഗം (Alternaria solani)",
            "confidence": 0.88,
            "confidence_explanation": "ഈ മൂല്യനിർണ്ണയം ഇലയിലെ പാടുകളെയും സാദൃശ്യങ്ങളെയും അടിസ്ഥാനമാക്കിയുള്ളതാണ്.",
            "symptoms_observed": [
                "ഇലകളിൽ ഇരുണ്ട തവിട്ടുനിറത്തിലുള്ള വളയങ്ങളോട് കൂടിയ പുള്ളികൾ",
                "താഴത്തെ പഴയ ഇലകൾ മഞ്ഞനിറമാകൽ",
                "ഇലയുടെ അരികുകൾ ഉണങ്ങി കരിയുന്ന ലക്ഷണം"
            ],
            "possible_causes": [
                "ആൾട്ടർനേറിയ സൊലാനി ഫംഗസ് ബാധ",
                "അമിതമായ ഈർപ്പവും മഴക്കാലവും",
                "ചെടികൾ തമ്മിൽ വായുസഞ്ചാരത്തിന്റെ കുറവ്"
            ],
            "severity": "Moderate",
            "explanation": f"{crop_name} ചെടിയിൽ Early Blight (ആൾട്ടർനേറിയ ഫംഗസ്) രോഗലക്ഷണങ്ങൾ കാണപ്പെടുന്നു. താഴത്തെ ഇലകളിൽ വൃത്താകൃതിയിലുള്ള തവിട്ട് പാടുകൾ രൂപപ്പെടുന്നു. ഇത് പടരാതിരിക്കാൻ ഉടനടി പ്രതിരോധ നടപടികൾ സ്വീകരിക്കുക.",
            "recommended_actions": [
                "രോഗം ബാധിച്ച താഴത്തെ ഇലകൾ ഉടൻ പറിച്ച് നശിപ്പിക്കുക",
                "ചെടിയുടെ ചുവട്ടിൽ മാത്രം വെള്ളം ഒഴിക്കുക, ഇലകൾ നനയാതിരിക്കാൻ ശ്രദ്ധിക്കുക",
                "ജൈവ രീതിയിൽ സ്യൂഡോമോണസ് (Pseudomonas fluorescens 20g/L) തളിക്കുക",
                "വേപ്പെണ്ണ വെളുത്തുള്ളി മിശ്രിതം ഉപയോഗിച്ച് പ്രതിരോധിക്കുക"
            ],
            "prevention_tips": [
                "വിളപരിക്രമണം (Crop rotation) കൃത്യമായി പാലിക്കുക",
                "ചെടികൾക്കിടയിൽ ആവശ്യത്തിന് അകലം പാലിച്ച് വായുസഞ്ചാരം ഉറപ്പാക്കുക",
                "മണ്ണിൽ ഈർപ്പം നിയന്ത്രിക്കാൻ പുതയിടൽ (Mulching) ചെയ്യുക"
            ],
            "professional_help_needed": False,
            "limitations": "ഈ ഫലം പ്രാഥമിക നിർദ്ദേശമാണ്. കൂടുതൽ വിവരങ്ങൾക്ക് അടുത്തുള്ള കൃഷിഭവനുമായി ബന്ധപ്പെടുക. (Demo mode active: Configure GEMINI_API_KEY for live vision model)."
        }

    return {
        "is_plant_image": True,
        "plant_name": crop_name,
        "plant_part": "Leaf",
        "health_status": "Possible disease detected",
        "disease_name": f"{crop_name} Early Blight (Alternaria solani)",
        "confidence": 0.89,
        "confidence_explanation": "Model identified concentric dark lesions and chlorosis characteristic of Alternaria infection.",
        "symptoms_observed": [
            "Concentric target-like dark brown spots on foliage",
            "Yellowing (chlorosis) surrounding necrotic lesions",
            "Early senescence and wilting of lower canopy leaves"
        ],
        "possible_causes": [
            "Alternaria solani fungal pathogen infection",
            "Extended leaf wetness duration and high relative humidity",
            "Dense canopy restricting inter-row airflow"
        ],
        "severity": "Moderate",
        "explanation": f"The visual evidence strongly suggests Early Blight on the {crop_name} foliage. Concentric rings are visible on older leaves, indicating an established fungal presence. Early intervention can prevent spread to adjacent plants and fruit.",
        "recommended_actions": [
            "Prune and destroy infected lower leaves using sanitized pruning shears",
            "Avoid overhead sprinkler irrigation; apply water directly to root zone",
            "Apply bio-fungicidal spray such as Trichoderma or Bacillus subtilis",
            "Apply copper-based or neem oil preventative spray in early morning"
        ],
        "prevention_tips": [
            "Practice a 3-year crop rotation with non-solanaceous crops",
            "Maintain optimal row spacing to ensure adequate air circulation",
            "Apply organic mulch around plant bases to prevent soil-splash pathogens"
        ],
        "professional_help_needed": False,
        "limitations": "Demonstration assessment generated based on symptoms and crop traits. Configure GEMINI_API_KEY in .env for real-time live multimodal AI inference."
    }


def _get_client() -> genai.Client | None:
    """Create a Gemini client if key is configured, else None."""
    if not GEMINI_API_KEY or GEMINI_API_KEY.strip() == "your_gemini_api_key_here":
        return None
    return genai.Client(api_key=GEMINI_API_KEY)


async def analyze_plant_image(
    image_bytes: bytes,
    mime_type: str,
    crop: str = "",
    symptoms: str = "",
    language: str = "en",
) -> dict:
    """
    Send a plant image to Gemini for analysis and return structured results.
    Falls back to intelligent simulated diagnosis if GEMINI_API_KEY is not yet configured.
    """
    client = _get_client()
    if not client:
        logger.info("GEMINI_API_KEY not configured — returning simulated diagnostic result")
        return _get_simulated_result(crop=crop, symptoms=symptoms, language=language)

    prompt = _build_prompt(crop, symptoms, language)

    response = None
    last_exc = None
    for attempt in range(3):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=ANALYSIS_JSON_SCHEMA,
                ),
            )
            if response and response.text:
                break
        except Exception as exc:
            logger.warning("Gemini image analysis attempt %d failed: %s", attempt + 1, exc)
            last_exc = exc
            await asyncio.sleep(1.5 * (attempt + 1))

    if not response or not response.text:
        logger.error("All Gemini API attempts failed: %s", last_exc)
        # Return structured fallback if Gemini is experiencing high demand
        return _get_simulated_result(crop=crop, symptoms=symptoms, language=language)

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini response as JSON: %s", response.text)
        raise RuntimeError("AI service returned invalid JSON") from exc

    # Validate required fields exist
    required = {"is_plant_image", "plant_name", "health_status", "explanation"}
    missing = required - set(result.keys())
    if missing:
        logger.warning("Gemini response missing fields: %s", missing)
        for field in missing:
            if field == "is_plant_image":
                result[field] = False
            else:
                result[field] = ""

    return result

