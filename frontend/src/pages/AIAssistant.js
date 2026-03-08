import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import { analyzeWithAI, QUICK_ACTIONS } from '../services/aiService';
import { toast } from 'react-toastify';
import './AIAssistant.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function AIAssistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I\'m your AI Quality Assistant. I can help you analyze complaint trends, draft 8D reports, suggest root causes, and generate quality documents. Click a quick action below or type your question!',
  }]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [canvasContent, setCanvasContent] = useState(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message = inputText, outputType = 'text') => {
    if (!message.trim() && !outputType) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await analyzeWithAI({ message, outputType });
      const aiMessage = { role: 'assistant', content: response.response.content, data: response.response.data, type: response.response.type };
      setMessages(prev => [...prev, aiMessage]);

      if (response.response.data || response.response.type !== 'text') {
        setCanvasContent({ type: response.response.type, data: response.response.data, content: response.response.content });
      }
    } catch (error) {
      toast.error('AI analysis failed: ' + error.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    handleSend(action.message, action.outputType);
  };

  const exportCanvasToPDF = () => {
    if (!canvasRef.current) return;
    const element = canvasRef.current;
    const opt = { margin: 0.5, filename: 'AI_Assistant_Output.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
    toast.success('Exported to PDF!');
  };

  const copyCanvasText = () => {
    if (canvasContent?.content) {
      navigator.clipboard.writeText(canvasContent.content);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="chat-panel">
        <div className="chat-header">
          <h2>🤖 AI Quality Assistant</h2>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <div className="message message-assistant"><div className="message-avatar">🤖</div><div className="message-content typing-indicator"><span></span><span></span><span></span></div></div>}
          <div ref={chatEndRef} />
        </div>

        <div className="quick-actions">
          <h4>Quick Actions:</h4>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map(action => (
              <button key={action.id} className="quick-action-btn" onClick={() => handleQuickAction(action)} disabled={loading}>
                <span className="quick-action-icon">{action.icon}</span>
                <span className="quick-action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-input-container">
          <input type="text" className="chat-input" placeholder="Ask me anything about complaints, quality, or analysis..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()} disabled={loading} />
          <button className="send-btn" onClick={() => handleSend()} disabled={loading || !inputText.trim()}>Send ➤</button>
        </div>
      </div>

      <div className="canvas-panel">
        <div className="canvas-header">
          <h3>📄 Canvas Output</h3>
          {canvasContent && (
            <div className="canvas-toolbar">
              <button onClick={copyCanvasText} title="Copy text">📋 Copy</button>
              <button onClick={exportCanvasToPDF} title="Export to PDF">⬇ Export PDF</button>
            </div>
          )}
        </div>
        <div className="canvas-content" ref={canvasRef}>
          {canvasContent ? <CanvasRenderer content={canvasContent} /> : <div className="canvas-placeholder"><p>Generated content will appear here</p><p>📊 Charts • 📄 Reports • 📋 Tables • 🔍 Diagrams</p></div>}
        </div>
      </div>
    </div>
  );
}

function CanvasRenderer({ content }) {
  if (!content) return null;

  if (content.type === 'chart' && content.data) {
    const { chartType, title, data, xKey, yKey } = content.data;
    return (
      <div className="canvas-chart">
        <h3>{title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'bar' || chartType === 'pareto' ? (
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip /><Legend /><Bar dataKey={yKey} fill="#8884d8">{data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart>
          ) : chartType === 'pie' ? (
            <PieChart><Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>{data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey={yKey} stroke="#8884d8" /></LineChart>
          ) : null}
        </ResponsiveContainer>
        {content.data.analysis && <div className="chart-analysis"><h4>Analysis:</h4><ReactMarkdown>{content.data.analysis}</ReactMarkdown></div>}
      </div>
    );
  }

  if (content.type === 'fishbone' && content.data) {
    return <FishboneDiagram data={content.data} />;
  }

  return (
    <div className="canvas-document">
      <ReactMarkdown>{content.content}</ReactMarkdown>
    </div>
  );
}

function FishboneDiagram({ data }) {
  const { problem, categories, analysis } = data;
  return (
    <div className="fishbone-container">
      <h3>Fishbone Diagram: {problem}</h3>
      <svg viewBox="0 0 800 500" className="fishbone-svg">
        <line x1="100" y1="250" x2="700" y2="250" stroke="#333" strokeWidth="3" />
        <polygon points="700,250 680,240 680,260" fill="#333" />
        {Object.entries(categories).map(([category, causes], idx) => {
          const isTop = idx % 2 === 0;
          const x = 150 + idx * 120;
          const y = isTop ? 150 : 350;
          return (
            <g key={category}>
              <line x1={x} y1={y} x2={x} y2="250" stroke="#666" strokeWidth="2" />
              <text x={x} y={isTop ? y - 10 : y + 20} textAnchor="middle" fontSize="14" fontWeight="bold">{category}</text>
              {causes.map((cause, i) => <text key={i} x={x + 10} y={isTop ? y - 30 - i * 20 : y + 40 + i * 20} fontSize="12" fill="#555">{cause}</text>)}
            </g>
          );
        })}
        <text x="720" y="250" fontSize="16" fontWeight="bold">{problem}</text>
      </svg>
      {analysis && <div className="fishbone-analysis"><h4>Analysis:</h4><ReactMarkdown>{analysis}</ReactMarkdown></div>}
    </div>
  );
}

export default AIAssistant;
