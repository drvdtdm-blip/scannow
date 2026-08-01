import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Validates the Gemini API key by making a simple request.
 * @param {string} apiKey 
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
 * @returns {Promise<object>} - Structured analysis response
 */
export async function analyzeMedicalDocument(apiKey, base64Data, mimeType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-2.0-flash for fast and accurate multimodal document processing
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const prompt = `You are a clinical AI assistant designed to translate complex medical documents into clear, patient-friendly summaries. 
Analyze the provided medical document (which may be a lab report, imaging results, clinical summary, or prescription scan) and extract structured details.

Translate all complex medical concepts into simple, readable explanations for the patient, while maintaining clinical accuracy.

Your output must be a valid JSON object matching the following structure:
{
  "metadata": {
    "patientName": "Patient name (or 'Not Specifed' if missing)",
    "patientAge": "Age (or 'Not Specified')",
    "patientGender": "Gender (or 'Not Specified')",
    "documentDate": "Date of document or exam (or 'Not Specified')",
    "documentType": "Type of medical document (e.g. CBC Blood Test, Chest X-Ray, Discharge Summary, MRI Report)",
    "facilityName": "Clinic/Lab/Hospital name (or 'Not Specified')"
  },
  "chiefComplaint": "A short summary of why the exam/test was ordered, or the patient's primary complaint.",
  "summary": "Provide a comprehensive, empathetic summary of the document in markdown format. Focus on what the patient needs to know, breaking down the details.",
  "findings": [
    "List of key findings/results. Underline abnormal levels or noteworthy results in clinical terms, and summarize in clear language. (e.g., 'Hemoglobin is low (11.2 g/dL) - indicative of mild anemia')"
  ],
  "recommendations": [
    "Action items, lifestyle adjustments, prescriptions, or follow-ups mentioned in the report or recommended as next steps based on the findings."
  ],
  "dictionary": [
    {
      "term": "Medical term used in the report (e.g., Nephrolithiasis, Tachycardia)",
      "pronunciation": "Approximate pronunciation in plain English (e.g., nef-roh-li-THY-uh-sis)",
      "definition": "Simple explanation in plain English (e.g., Kidney stones)",
      "context": "How it specifically relates to the patient's report (e.g., 'The report notes a 4mm nephrolithiasis in the left kidney, which is a small kidney stone.')"
    }
  ]
}

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
 * This sends the document as the initial history entry so the conversation remembers it.
 * @param {string} apiKey 
 * @param {string} base64Data 
 * @param {string} mimeType 
 * @returns {object} - The active Gemini Chat Session
 */
export function startDocumentChat(apiKey, base64Data, mimeType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: "You are AegisScan AI, an empathetic and highly knowledgeable medical assistant. The user has uploaded a medical document which you have processed. Answer their questions about the document clearly, explain medical terms, and provide health tips. Always remind them to consult their doctor for official diagnoses and medical decisions. Keep responses formatting clean, brief, and structured with markdown if helpful."
  });

  // Pre-populate chat history with the document to avoid sending it with every message
  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [
          { text: "Here is the medical document I scanned/uploaded." },
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
          { text: "Understood. I have scanned the document and generated your summary. I'm ready to answer any questions you have about these results! What would you like to clarify?" }
        ]
      }
    ]
  });
}
