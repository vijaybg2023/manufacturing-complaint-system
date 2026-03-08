import axios from 'axios';
import { auth } from '../firebase';

const API_BASE = process.env.REACT_APP_API_URL || '';

// Get Firebase auth token for requests
async function getAuthHeader() {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// Main AI analyze call - returns chart/report/table/fishbone/text
export async function analyzeWithAI({ message, outputType = 'text', complaintId = null }) {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${API_BASE}/api/ai/analyze`,
    { message, outputType, complaintId },
    { headers }
  );
  return response.data;
}

// Streaming AI call - calls onChunk(text) for each streamed word
export async function streamWithAI({ message, onChunk, onDone, onError }) {
  const headers = await getAuthHeader();

  try {
    const response = await fetch(`${API_BASE}/api/ai/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ message, outputType: 'text' }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onDone && onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk && onChunk(parsed.text);
            if (parsed.error) onError && onError(parsed.error);
          } catch (e) {}
        }
      }
    }
    onDone && onDone();
  } catch (err) {
    onError && onError(err.message);
  }
}

// Quick action presets
export const QUICK_ACTIONS = [
  {
    id: 'trend_chart',
    label: 'Defect Trend Chart',
    icon: '📊',
    message: 'Create a Pareto chart showing the top defect types and their frequency from the complaint data.',
    outputType: 'chart',
  },
  {
    id: 'weekly_summary',
    label: 'Weekly Summary',
    icon: '📋',
    message: 'Generate a professional weekly summary table of all complaints including status, priority, and resolution rate. Include a brief management narrative.',
    outputType: 'table',
  },
  {
    id: 'root_cause',
    label: 'Root Cause Analysis',
    icon: '🔍',
    message: 'Perform a root cause analysis on the most frequent complaint types and generate a fishbone (Ishikawa) diagram with categories: Man, Machine, Method, Material, Environment.',
    outputType: 'fishbone',
  },
  {
    id: 'generate_8d',
    label: 'Generate 8D Report',
    icon: '📄',
    message: 'Draft a complete 8D problem-solving report for the most recent open complaint. Include all 8 disciplines with professional recommendations.',
    outputType: 'report',
  },
  {
    id: 'supplier_scorecard',
    label: 'Supplier Scorecard',
    icon: '📈',
    message: 'Create a supplier quality scorecard ranking suppliers by complaint frequency, defect types, and resolution time. Present as a formatted table.',
    outputType: 'table',
  },
  {
    id: 'quality_letter',
    label: 'Draft Quality Letter',
    icon: '✉️',
    message: 'Draft a formal supplier quality notification letter for the supplier with the most complaints, requesting corrective action.',
    outputType: 'report',
  },
];
