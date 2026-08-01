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
 * Analyzes the uploaded document (PDF/Image) using Gemini API JSON Mode.
 * @param {string} apiKey 
 * @param {string} base64Data - Base64 string of the file (without mime prefix)
 * @param {string} mimeType - e.g. 'image/jpeg', 'application/pdf'
 * @returns {Promise<object>} - Structured analysis response matching EHR portal schema
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

  const prompt = `You are an expert Clinical AI Medical Summarizer. Your goal is to analyze scanned medical files (lab reports, doctor visit notes, discharge records, imaging reports, prescriptions) and translate them into a clear, patient-friendly Electronic Health Record (EHR) summary.

Read the document carefully, extract the clinical data, and explain everything in simple, plain English that a patient can understand. Be empathetic, clear, and highly structured.

Your output must be a valid JSON object matching the following structure:
{
  "metadata": {
    "patientName": "Patient's full name (or 'Not Specified')",
    "patientAge": "Age (or 'Not Specified')",
    "patientGender": "Gender (or 'Not Specified')",
    "documentDate": "Date of the report, lab test, or encounter (or 'Not Specified')",
    "documentType": "Type of medical report (e.g. Complete Blood Count, Renal Panel, Brain MRI, Progress Note)",
    "facilityName": "Hospital, lab, or clinic name (or 'Not Specified')"
  },
  "executiveSummary": "A 2-3 sentence patient-friendly brief summarizing the key clinical findings and what they mean for the patient's immediate health.",
  "diagnosis": [
    "A point-wise list of primary clinical diagnoses, medical assessments, or notable findings identified in the report. Each point should list the clinical term and a brief, patient-friendly explanation in parentheses. (e.g., 'Anemia (low red blood cell count that may cause tiredness)', 'Kidney Stones (small hard deposits in the kidneys)')"
  ],
  "detailedAnalysis": "A comprehensive patient-focused overview of the entire medical report in markdown. Break down the sections (e.g. Clinical Notes, Reason for Study, Overall Impression) clearly.",
  "investigationsAndProcedures": [
    {
      "date": "Date of the investigation or procedure, e.g. YYYY-MM-DD or Month YYYY (or 'Date Not Specified')",
      "name": "Name of the lab test, scan, or procedure (e.g. Kidney Ultrasound, Liver Function Test, Appendectomy)",
      "result": "Key result, finding, or value in simple terms."
    }
  ],
  "previousConsultations": [
    {
      "date": "Date of the past consultation, e.g. YYYY-MM-DD or Month YYYY (or 'Date Not Specified')",
      "specialtyOrProvider": "Doctor, specialty, or clinic visited (e.g. Cardiology, Dr. Patel)",
      "reasonOrOutcome": "Primary reason for visit or clinical conclusion."
    }
  ],
  "medications": [
    "Strictly name ONLY the drug itself (e.g. 'Metformin', 'Atorvastatin'). DO NOT include dosage (e.g. 500mg), frequency (e.g. twice daily), times, or any instructions of taking it."
  ],
  "recommendations": [
    {
      "category": "The type of action (e.g. Follow-up, Lifestyle, Dietary, Referral)",
      "action": "The specific task or next step recommended (excluding medications, e.g. 'Follow up with ophthalmologist in 6 months', 'Limit daily sodium intake')."
    }
  ],
  "dictionary": [
    {
      "term": "Difficult medical jargon or acronym found in the report (e.g. Nephrolithiasis, Tachycardia, CBC)",
      "definition": "Simple explanation in plain English (e.g. Kidney stones, Fast heart rate, Complete Blood Count)",
      "context": "A brief quote or note showing how this term relates to their specific report (e.g. 'The report states you have mild tachycardia, which means your heart was beating a bit faster than normal during the test.')"
    }
  ]
}

- For 'investigationsAndProcedures', sort the array chronologically from oldest to newest based on the dates.
- For 'previousConsultations', sort the array chronologically from oldest to newest based on the dates.
- For 'medications', strictly include ONLY the name of the drug. Example: if the report says 'Take Lipitor 10mg tab daily at bedtime', you must output 'Lipitor' only.
Ensure all JSON strings are properly formatted. Do not include markdown code block syntax inside the JSON strings.`;

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
    console.error("Failed to parse Gemini JSON output. Raw response was:", responseText);
    throw new Error("The AI response was not in the expected format. Please try scanning again.");
  }
}

/**
 * Initializes a new chat session bound to the provided document context.
 * @param {string} apiKey 
 * @param {string} base64Data 
 * @param {string} mimeType 
 * @returns {object} - The active Gemini Chat Session
 */
export function startDocumentChat(apiKey, base64Data, mimeType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    systemInstruction: "You are AegisScan AI, an empathetic and highly knowledgeable medical assistant. The user has uploaded a medical document which you have processed. Answer their questions about the document clearly, explain medical terms, and provide health tips. Always remind them to consult their doctor for official diagnoses and medical decisions. Keep responses formatting clean, brief, and structured with markdown if helpful."
  });

  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          { text: "Here is the medical document I uploaded for clinical summarization." },
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
          { text: "Understood. I have summarized this clinical report. I'm ready to answer any questions you have about these findings, lab levels, or doctor recommendations! What would you like to clarify?" }
        ]
      }
    ]
  });
}
