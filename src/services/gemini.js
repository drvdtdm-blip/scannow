import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Validates the Gemini API key by making a simple request.
 * @param {string} apiKey 
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Respond with "OK" only.' }] }]
    });
    return result.response.text().trim().includes('OK');
  } catch (error) {
    console.error('API Key Validation Error:', error);
    return false;
  }
}

/**
 * Analyzes uploaded medical records using Gemini API JSON Mode.
 * Functions as a Clinical Record Summarization AI for a Cardiologist.
 * 
 * @param {string} apiKey 
 * @param {string} base64Data - Base64 string of the file
 * @param {string} mimeType - e.g. 'image/jpeg', 'application/pdf'
 * @returns {Promise<object>} - Comprehensive Cardiology Summary JSON
 */
export async function analyzeMedicalDocument(apiKey, base64Data, mimeType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const prompt = `You are a Clinical Record Summarization AI for a Cardiologist.
Your task is to analyze all available medical records (prescriptions, discharge summaries, handwritten notes, ECGs, echocardiography reports, angiography/PCI reports, lab reports, imaging, medication lists, referral notes) and convert them into one concise, evidence-based, chronological clinical summary that a cardiologist can understand in 30–60 seconds.

CORE EVIDENTIARY PRINCIPLES:
1. Do not assume every previously written diagnosis is correct.
2. Give greater importance to objective evidence and documented investigations over unverified notes.
3. Never fabricate diagnoses, dates, procedures, investigation findings, medicines, or doses.
4. If records conflict, state the conflict neutrally.
5. If information is missing, use "Not available in supplied records."
6. If handwriting/text is illegible, use "Unclear / illegible in source document."
7. Dates format: DD-MM-YYYY or MM-YYYY or "Date unavailable". Do not guess dates.
8. Use concise professional medical English and standard cardiology abbreviations (CAD, ACS, CCS, STEMI, NSTEMI, PCI, CABG, HFrEF, HFmrEF, HFpEF, AF, HTN, DM, CKD, RWMA, LVEF, CAG).

Your output MUST be a valid JSON object matching the following structure EXACTLY:

{
  "metadata": {
    "patientName": "Patient's full name (or 'Not Specified')",
    "patientAge": "Age (or 'Not Specified')",
    "patientGender": "Gender (or 'Not Specified')",
    "documentDate": "Latest date of record or 'Date unavailable'",
    "documentType": "Type of report(s) summarized (e.g., CAG Report, Echo & Prescription, Discharge Summary)",
    "facilityName": "Hospital/Clinic name (or 'Not Specified')"
  },
  "clinicalSnapshot": "A maximum 2-line high-yield summary of patient demographics, primary cardiac disease, major procedures/dates, LVEF, and key comorbidities.",
  "cardiologistQuickView": [
    "Maximum 8 bullet points summarizing today's key clinical needs for the treating cardiologist."
  ],
  "establishedMajorDiagnoses": {
    "stronglySupported": [
      "Diagnoses supported by objective investigations/procedures (e.g., 'CAD – supported by CAG/PCI documentation 2022', 'HFrEF – supported by documented LVEF 35%')"
    ],
    "previouslyDocumented": [
      "Diagnoses mentioned in notes but needing objective confirmation (e.g., 'COPD – mentioned in prescriptions, no spirometry available')"
    ],
    "uncertainUnsupported": [
      "Diagnoses mentioned without supporting evidence (e.g., 'Cardiac weakness – mentioned in one note without evidence')"
    ]
  },
  "cardiovascularHistory": [
    "Structured bullet list of CAD, ACS/MI, PCI (vessel, stents, date, indication), CABG, HF/LVEF, Cardiomyopathy, Valvular Disease, Arrhythmias, Devices (Pacemaker/ICD/CRT), HTN, Stroke, PVD."
  ],
  "clinicalTimeline": [
    {
      "period": "Year or MM-YYYY or DD-MM-YYYY",
      "events": [
        "Concise bullet point of major clinical event, hospital admission, procedure, or investigation."
      ]
    }
  ],
  "investigations": {
    "ecg": [
      {
        "date": "DD-MM-YYYY or MM-YYYY or 'Date unavailable'",
        "rhythm": "e.g., Sinus Rhythm, Atrial Fibrillation",
        "findings": "Major abnormalities or infarction patterns."
      }
    ],
    "echo": [
      {
        "date": "DD-MM-YYYY or MM-YYYY or 'Date unavailable'",
        "lvef": "e.g., 42%",
        "rwma": "Regional Wall Motion Abnormalities if documented",
        "valveDisease": "Valvular abnormalities or 'None significant'",
        "phtn": "Pulmonary Hypertension status or 'None'",
        "otherFindings": "LV dimensions, RV function, or pericardial findings"
      }
    ],
    "lvefTrend": "e.g., LVEF trend: 35% (2022) -> 40% (2024) -> 42% (July 2026)",
    "cagPci": [
      {
        "date": "DD-MM-YYYY or MM-YYYY or 'Date unavailable'",
        "lm": "Stenosis in Left Main or 'Normal'",
        "lad": "Stenosis in LAD",
        "lcx": "Stenosis in LCX",
        "rca": "Stenosis in RCA",
        "pciDetails": "Procedure performed, vessel, stent number/type/size if available",
        "residualDisease": "Residual disease or 'None documented'"
      }
    ],
    "otherCardiacTests": [
      {
        "date": "DD-MM-YYYY or MM-YYYY or 'Date unavailable'",
        "testName": "e.g., TMT, Holter, Cardiac CT",
        "summary": "Key clinically meaningful findings."
      }
    ]
  },
  "laboratoryData": [
    {
      "parameter": "Hb / Creatinine / eGFR / Na / K / Fasting Glucose / HbA1c / LDL-C / HDL-C / Triglycerides / TSH / Troponin / NT-proBNP",
      "latestValue": "Latest value with units",
      "trend": "Historical trend if multiple values exist (e.g., '124 -> 82 -> 61 mg/dL')",
      "isAbnormal": true
    }
  ],
  "currentMedications": [
    {
      "medicine": "Generic name (or brand if generic uncertain)",
      "dose": "e.g., 75 mg",
      "frequency": "e.g., OD, BD, HS",
      "likelyIndication": "e.g., CAD / Post PCI / HTN / DM",
      "evidence": "e.g., Latest prescription (July 2026)"
    }
  ],
  "riskFactors": [
    { "factor": "Hypertension", "status": "Present" },
    { "factor": "Diabetes", "status": "Present" },
    { "factor": "Dyslipidemia", "status": "Present" },
    { "factor": "Smoking", "status": "Unknown" },
    { "factor": "Tobacco", "status": "Unknown" },
    { "factor": "Obesity", "status": "Unknown" },
    { "factor": "CKD", "status": "Unknown" },
    { "factor": "Family history premature CAD", "status": "Unknown" },
    { "factor": "Physical inactivity", "status": "Unknown" }
  ],
  "nonCardiacConditions": [
    "Relevant non-cardiac conditions (DM, CKD, COPD, Asthma, Thyroid, Stroke, Anemia, Bleeding history, Peptic Ulcer)"
  ],
  "allergies": [
    "Documented allergies and reactions, or 'No reliable allergy information available in supplied records.'"
  ],
  "conflictsAndDiscrepancies": [
    "Contradictions or discrepancies between records presented neutrally."
  ],
  "missingInformation": [
    "Maximum 5-8 missing critical records that affect clinical decisions (e.g., 'Previous PCI report unavailable', 'Latest echocardiogram unavailable')"
  ]
}

Ensure all JSON keys exist. Do not include markdown code block syntax inside JSON strings.`;

  const filePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  const result = await model.generateContent([filePart, prompt]);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error("Failed to parse Cardiology AI JSON output. Raw response:", responseText);
    throw new Error("The AI response was not in the expected format. Please try scanning again.");
  }
}

/**
 * Initializes a new chat session bound to the Cardiology patient record.
 * @param {string} apiKey 
 * @param {string} base64Data 
 * @param {string} mimeType 
 * @returns {object} - The active Gemini Chat Session
 */
export function startDocumentChat(apiKey, base64Data, mimeType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: "You are AegisScan Cardiology AI, an expert clinical assistant for cardiologists. You have processed the patient's medical records. Answer questions using concise, high-yield, evidence-based cardiology terminology (CAD, LVEF, RWMA, CAG, PCI, HFrEF, etc.). Highlight objective evidence, potential drug interactions, and missing critical diagnostic data when asked."
  });

  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          { text: "Here are the patient's cardiology clinical records for your evidence-based review." },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]
      },
      {
        role: 'model',
        parts: [
          { text: "Cardiology record received and analyzed. I have extracted the clinical snapshot, major diagnoses, CAG/PCI findings, LVEF trend, labs, medications, and risk factors. How can I assist you with this patient's case?" }
        ]
      }
    ]
  });
}
