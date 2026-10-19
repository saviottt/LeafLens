/**
 * PlantCare AI — Kisan AI Crop Profitability & Weather Chatbot
 * Floating agricultural financial & climate advisor for farmers.
 */

(function () {
  'use strict';

  let isOpen = false;
  let chatHistory = [];
  let currentTimeframe = '1 year';
  let isSending = false;

  // Initialize the Chatbot component on DOM ready
  function initChatbot() {
    if (document.getElementById('kisan-chat-toggle')) return;

    // Inject Widget HTML
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'kisan-chatbot-root';
    widgetContainer.innerHTML = `
      <!-- Floating Bottom-Right Toggle Button -->
      <button type="button" id="kisan-chat-toggle" class="kisan-chat-toggle" aria-label="Open Crop Profitability Advisor Chat">
        <span class="kisan-chat-badge">🌾 Crop Profit Advisor</span>
        
        <!-- Sprout Icon -->
        <svg class="icon-chat" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 20h10"/>
          <path d="M10 20c0-4 1.5-7.5 4-10"/>
          <path d="M4 14c2-4 6-5 10-5"/>
          <path d="M12 2a9.5 9.5 0 0 1 8 8c0 4-4 8-8 10"/>
        </svg>

        <!-- Close Icon -->
        <svg class="icon-close" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Chat Drawer / Window -->
      <div id="kisan-chat-window" class="kisan-chat-window" role="dialog" aria-modal="true" aria-labelledby="chat-title">
        
        <!-- Header -->
        <div class="kisan-chat-header">
          <div class="chat-header-info">
            <div class="chat-header-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <span class="chat-online-dot"></span>
            </div>
            <div>
              <h2 id="chat-title" class="chat-header-title">Kisan AI Advisor</h2>
              <p class="chat-header-subtitle">1–2 Year Crop Profitability & Climate Planning</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <button type="button" id="btn-chat-reset" class="chat-action-btn" title="Reset Conversation" aria-label="Reset Conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button type="button" id="btn-chat-close" class="chat-action-btn" title="Close" aria-label="Close Chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Optional Quick Config Bar (Location, Crop, Horizon) -->
        <div class="chat-config-bar">
          <div class="config-inputs-row">
            <input type="text" id="chat-loc-input" class="chat-input-mini" placeholder="📍 Location (e.g. Kerala, Punjab, Maharashtra)">
            <input type="text" id="chat-crop-input" class="chat-input-mini" placeholder="🌱 Crop (e.g. Tomato, Ginger, Wheat)">
          </div>
          <div class="chat-timeframe-pills">
            <span class="timeframe-pill-label">Horizon:</span>
            <button type="button" class="timeframe-pill active" data-timeframe="1 year">1 Year</button>
            <button type="button" class="timeframe-pill" data-timeframe="2 years">2 Years</button>
          </div>
        </div>

        <!-- Preset Quick Chips -->
        <div class="chat-chips-scroll" id="chat-chips-container">
          <button type="button" class="chat-chip" data-query="Will Tomato be profitable in 1 year with moderate rain?">🍅 Tomato (1 Year)</button>
          <button type="button" class="chat-chip" data-query="Is Ginger profitable in 2 years with monsoon rains?">🫚 Ginger (2 Years)</button>
          <button type="button" class="chat-chip" data-query="Wheat profitability in Punjab over 2 years">🌾 Wheat in Punjab</button>
          <button type="button" class="chat-chip" data-query="Potato profit margins, cold storage, and blight risk">🥔 Potato Economics</button>
          <button type="button" class="chat-chip" data-query="What is the most profitable cash crop for heavy rainfall areas?">🌧️ Heavy Rain Crops</button>
        </div>

        <!-- Messages Area -->
        <div class="kisan-chat-messages" id="kisan-chat-messages">
          <!-- Initial Welcome Message -->
          <div class="chat-msg bot">
            <div class="chat-bubble">
              <h3>Namaste Farmer! 🙏</h3>
              <p>I am <strong>Kisan AI</strong>, your agricultural financial and crop planning advisor. I evaluate:</p>
              <ul>
                <li><strong>1 or 2 Year Profitability</strong>: Input costs, expected yield, and Mandi price forecasts.</li>
                <li><strong>Weather & Monsoon Risks</strong>: Rainfall patterns, heat stress, and seasonal hazards.</li>
                <li><strong>Location & Soil Suitability</strong>: Tailored guidance for your district/state.</li>
              </ul>
              <p>Type your question below or click a quick suggestion above to get started!</p>
            </div>
            <span class="chat-msg-time">Just now</span>
          </div>
        </div>

        <!-- Footer Input Bar -->
        <form id="kisan-chat-form" class="kisan-chat-footer">
          <textarea id="kisan-chat-input" class="chat-input-textarea" rows="1" placeholder="Ask about crop profitability, location, weather..." required></textarea>
          <button type="submit" id="kisan-chat-send" class="chat-send-btn" aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(widgetContainer);
    bindEvents();
  }

  function bindEvents() {
    const toggleBtn = document.getElementById('kisan-chat-toggle');
    const closeBtn = document.getElementById('btn-chat-close');
    const resetBtn = document.getElementById('btn-chat-reset');
    const form = document.getElementById('kisan-chat-form');
    const input = document.getElementById('kisan-chat-input');
    const chips = document.querySelectorAll('.chat-chip');
    const pills = document.querySelectorAll('.timeframe-pill');

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    resetBtn.addEventListener('click', resetChat);

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentTimeframe = pill.dataset.timeframe || '1 year';
      });
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        if (query) {
          sendUserMessage(query);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isSending) return;
      sendUserMessage(text);
      input.value = '';
      input.style.height = 'auto';
    });

    // Auto-expand input on typing, and submit on Enter (without Shift)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 90) + 'px';
    });
  }

  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function openChat() {
    isOpen = true;
    const toggleBtn = document.getElementById('kisan-chat-toggle');
    const chatWin = document.getElementById('kisan-chat-window');
    toggleBtn.classList.add('active');
    chatWin.classList.add('open');
    setTimeout(() => {
      const input = document.getElementById('kisan-chat-input');
      if (input) input.focus();
    }, 200);
  }

  function closeChat() {
    isOpen = false;
    const toggleBtn = document.getElementById('kisan-chat-toggle');
    const chatWin = document.getElementById('kisan-chat-window');
    toggleBtn.classList.remove('active');
    chatWin.classList.remove('open');
  }

  function resetChat() {
    chatHistory = [];
    const messages = document.getElementById('kisan-chat-messages');
    messages.innerHTML = `
      <div class="chat-msg bot">
        <div class="chat-bubble">
          <h3>Chat Reset 🙏</h3>
          <p>I am ready to analyze a new crop, location, or weather scenario. How can I assist your farm planning today?</p>
        </div>
        <span class="chat-msg-time">Just now</span>
      </div>
    `;
  }

  async function sendUserMessage(text) {
    if (isSending) return;
    isSending = true;

    const messages = document.getElementById('kisan-chat-messages');
    const sendBtn = document.getElementById('kisan-chat-send');
    sendBtn.disabled = true;

    // Optional inputs
    const locInput = document.getElementById('chat-loc-input');
    const cropInput = document.getElementById('chat-crop-input');
    const location = locInput ? locInput.value.trim() : '';
    const crop = cropInput ? cropInput.value.trim() : '';

    // Append user message to UI
    appendMessage('user', text);
    chatHistory.push({ role: 'user', text });

    // Append typing indicator
    const typingId = showTypingIndicator();

    try {
      const data = await api.chatCropProfitability({
        message: text,
        location: location || undefined,
        crop: crop || undefined,
        timeframe: currentTimeframe,
        history: chatHistory.slice(-6),
      });

      removeTypingIndicator(typingId);

      const reply = data.reply || 'I am ready to help. Please tell me your crop, location, or weather conditions.';
      appendMessage('bot', reply);
      chatHistory.push({ role: 'model', text: reply });

    } catch (err) {
      removeTypingIndicator(typingId);
      appendMessage('bot', `⚠️ **Advisor Note**: Could not reach the advisory engine (${err.message}). Please ensure the backend is connected and try again.`);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
    }
  }

  function appendMessage(sender, rawText) {
    const messages = document.getElementById('kisan-chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    const formattedContent = sender === 'bot' ? parseMarkdown(rawText) : escapeHtml(rawText);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.innerHTML = `
      <div class="chat-bubble">
        ${formattedContent}
      </div>
      <span class="chat-msg-time">${timeStr}</span>
    `;

    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTypingIndicator() {
    const messages = document.getElementById('kisan-chat-messages');
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingDiv.id = id;
    typingDiv.className = 'chat-msg bot';
    typingDiv.innerHTML = `
      <div class="chat-bubble">
        <div class="typing-dots">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Lightweight Markdown parser for rendering bold headers, lists, tables, and blockquotes.
   */
  function parseMarkdown(md) {
    if (!md) return '';

    let html = escapeHtml(md);

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h3>$1</h3>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Horizontal Rules
    html = html.replace(/^---$/gim, '<hr style="border:none; border-top:1px solid #e1e8e4; margin:10px 0;">');

    // Simple Table Parsing
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outputLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip separator row |---|---|
        if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) {
          continue;
        }

        const cells = line.split('|').slice(1, -1).map(c => c.trim());

        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          outputLines.push(tableHtml);
          tableHtml = '';
        }
        outputLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table>';
      outputLines.push(tableHtml);
    }

    html = outputLines.join('\n');

    // Bullet Lists
    html = html.replace(/^\s*[\-\*]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul>$1</ul>');
    // Clean nested duplicate UL tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs
    html = html.split(/\n{2,}/).map(para => {
      const p = para.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<table') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

})();
