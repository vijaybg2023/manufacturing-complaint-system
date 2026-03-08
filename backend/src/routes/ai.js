const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { verifyToken } = require('../middleware/auth');
const db = require('../config/firebase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: fetch recent complaints from Firestore for context
async function getComplaintsContext(limit = 20) {
  try {
    const snapshot = await db.collection('complaints')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    return [];
  }
}

// POST /api/ai/analyze - Main AI endpoint (chat + canvas output)
router.post('/analyze', verifyToken, async (req, res) => {
  try {
    const { message, outputType, complaintId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch complaints data for context
    const complaints = await getComplaintsContext(30);
    const complaintsJson = JSON.stringify(complaints, null, 2);

    // If specific complaint requested, get it
    let specificComplaint = null;
    if (complaintId) {
      const doc = await db.collection('complaints').doc(complaintId).get();
      if (doc.exists) specificComplaint = { id: doc.id, ...doc.data() };
    }

    // Build system prompt based on outputType
    const systemPrompt = `You are an expert AI Quality Assistant for a Manufacturing Complaint Management System.
You have deep knowledge of:
- Quality management (IATF 16949, 8D methodology, FMEA, APQP)
- Root cause analysis and corrective actions
- Manufacturing defect patterns and supplier quality
- Statistical process control and trend analysis

Here is the current complaint data from the system (last 30 complaints):
${complaintsJson}

${specificComplaint ? `Specific complaint being analyzed:\n${JSON.stringify(specificComplaint, null, 2)}` : ''}

Output Instructions based on requested type:
- "chart": Return a JSON object with structure: { "chartType": "bar|pie|line|pareto", "title": "...", "data": [...], "xKey": "...", "yKey": "...", "analysis": "..." }
- "report": Return a well-formatted Markdown document (8D report, quality letter, analysis report)
- "table": Return a Markdown table with analysis narrative
- "fishbone": Return JSON: { "problem": "...", "categories": { "Man": [...], "Machine": [...], "Method": [...], "Material": [...], "Environment": [...] }, "analysis": "..." }
- "text": Return formatted Markdown text with insights

Always be specific, professional, and base your response on the actual complaint data provided.
For charts, ensure data arrays have proper numeric values derived from the complaints data.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User Request: ${message}\nRequested Output Type: ${outputType || 'text'}` }
    ]);

    const responseText = result.response.text();

    // Parse JSON for structured outputs
    let parsedResponse = { type: outputType || 'text', content: responseText };
    
    if (outputType === 'chart' || outputType === 'fishbone') {
      try {
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || 
                          responseText.match(/({[\s\S]*})/); 
        if (jsonMatch) {
          parsedResponse.data = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        parsedResponse.content = responseText;
      }
    }

    res.json({ success: true, response: parsedResponse });

  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

// POST /api/ai/stream - Streaming endpoint for real-time text
router.post('/stream', verifyToken, async (req, res) => {
  try {
    const { message, outputType } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const complaints = await getComplaintsContext(20);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert AI Quality Assistant for a Manufacturing Complaint System.
Complaint Data: ${JSON.stringify(complaints)}
User: ${message}
Provide a detailed, professional response in Markdown format.`;

    const streamResult = await model.generateContentStream(prompt);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
