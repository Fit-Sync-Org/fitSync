// server/testVertexAI.js
require('dotenv').config();
console.log('PROJECT ID:', process.env.GOOGLE_CLOUD_PROJECT);
console.log('LOCATION:', process.env.GOOGLE_CLOUD_LOCATION);
const { VertexAI } = require('@google-cloud/vertexai');

async function main() {
  // :one: Initialize VertexAI
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  // :two: Instantiate a generative model (Gemini or text-bison)
  const generativeModel = vertexAI.getGenerativeModel({
    model: 'text-bison@001',         // or 'gemini-2.0-flash' if enabled
    generationConfig: { maxOutputTokens: 512 },
    systemInstruction: {
      role: 'system',
      parts: [{ text: 'You are FitSync’s AI planner. Output pure JSON only.' }],
    },
    // temperature can be passed here or per-call
  });
  // :contentReference[oaicite:0]{index=0}

  console.log('Calling Vertex AI generateContent…');

  // :three: Send a single JSON-only prompt
  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `
Generate a 7-day meal & workout plan in JSON:
{
  "week": [
    { "day": "Monday", "meals": […], "workouts": […] },
    …
  ]
}
Output just the JSON object.
`
          }
        ],
      },
    ],
  });
  // :contentReference[oaicite:1]{index=1}

  // :four: Extract and print the raw JSON
  // The first candidate’s content.parts[0].text holds the string
  const raw = result.response.candidates[0].content.parts[0].text;
  console.log('Raw JSON output:\n', raw);
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
