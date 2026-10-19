/**
 * PlantCare AI — Results module
 * Renders analysis results from sessionStorage or fetches report by ID.
 */

function initResults() {
  const resultContainer = document.getElementById('results-content');
  if (!resultContainer) return;

  const rawData = sessionStorage.getItem('plantcare_result');
  const lang = sessionStorage.getItem('plantcare_language') || currentLang;

  if (!rawData) {
    showNoResults(resultContainer);
    return;
  }

  try {
    const data = JSON.parse(rawData);
    renderResults(data, resultContainer);
  } catch (err) {
    console.error('Failed to parse result:', err);
    showNoResults(resultContainer);
  }
}

function showNoResults(container) {
  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>No analysis result found</h3>
      <p class="text-muted" style="margin-bottom: 1.5rem;">Please upload a plant image to get started.</p>
      <a href="detect.html" class="btn btn-primary">Go to Disease Detection</a>
    </div>
  `;
}

function renderResults(data, container) {
  const analysis = data.analysis || {};
  const imageFilename = data.image_filename;
  const imageUrl = imageFilename ? api.imageUrl(imageFilename) : '';

  const isPlant = analysis.is_plant_image !== false;
  const isHealthy = (analysis.health_status || '').toLowerCase().includes('healthy');
  const isInconclusive = (analysis.health_status || '').toLowerCase().includes('inconclusive');
  const confidence = Math.round((analysis.confidence || 0) * 100);

  // Confidence CSS class
  let confClass = 'confidence-medium';
  if (confidence >= 75) confClass = 'confidence-high';
  else if (confidence < 50) confClass = 'confidence-low';

  // Severity badge class
  const sev = (analysis.severity || '').toLowerCase();
  let badgeClass = 'badge-info';
  if (sev.includes('severe')) badgeClass = 'badge-danger';
  else if (sev.includes('moderate')) badgeClass = 'badge-warning';
  else if (isHealthy) badgeClass = 'badge-healthy';

  let html = '';

  // Non-plant or Inconclusive handling
  if (!isPlant) {
    html = `
      <div class="inconclusive-box" style="margin-bottom: 2rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; color: var(--danger);">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <h3 style="color: var(--danger);">Not Recognized as a Plant</h3>
        <p>${analysis.explanation || 'The uploaded photograph does not appear to show a plant, crop, or leaf clearly.'}</p>
        <div class="inconclusive-tips">
          <p><strong>Tips for accurate detection:</strong></p>
          <ul>
            <li>Ensure the plant or leaf is centered in the frame.</li>
            <li>Take the photo in clear, natural daytime lighting.</li>
            <li>Avoid blurry or excessively distant photos.</li>
          </ul>
        </div>
        <div style="margin-top: 1.5rem;">
          <a href="detect.html" class="btn btn-primary">Try Another Photo</a>
        </div>
      </div>
    `;
    container.innerHTML = html;
    return;
  }

  // Header Section with Image and Basic Info
  html += `
    <div class="card" style="padding: var(--space-8); margin-bottom: var(--space-8);">
      <div class="result-header">
        ${imageUrl ? `<img src="${imageUrl}" alt="${analysis.plant_name || 'Plant image'}" class="result-image" onerror="this.style.display='none'">` : ''}
        <div class="result-summary" style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
            <span class="result-badge ${badgeClass}">${analysis.health_status || 'Assessment complete'}</span>
            ${analysis.plant_part ? `<span class="result-badge badge-info">${analysis.plant_part}</span>` : ''}
          </div>
          <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;">${analysis.disease_name || (isHealthy ? 'Healthy Plant' : 'Condition Assessment')}</h2>
          <p style="color: var(--gray-600); font-weight: 500; font-size: 1.05rem; margin-bottom: 1rem;">
            Plant Species: <strong>${analysis.plant_name || 'Unspecified Crop'}</strong>
          </p>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--gray-600); max-width: 320px;">
              <span>AI Confidence Indicator:</span>
              <span>${confidence}%</span>
            </div>
            <div class="confidence-bar">
              <div class="confidence-fill ${confClass}" style="width: ${confidence}%"></div>
            </div>
            ${analysis.confidence_explanation ? `<p style="font-size: 0.8rem; color: var(--gray-500); margin-top: 0.35rem; max-width: 480px;">${analysis.confidence_explanation}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Inconclusive Alert if applicable -->
      ${isInconclusive ? `
        <div class="inconclusive-box" style="margin-bottom: 1.5rem;">
          <h3>Inconclusive Assessment</h3>
          <p>${analysis.explanation || 'The model could not determine the condition with sufficient confidence.'}</p>
          <div class="inconclusive-tips">
            <p><strong>Suggestions:</strong></p>
            <ul>
              <li>Capture a closer shot of the specific affected area or discoloration.</li>
              <li>Provide additional symptoms or select the exact crop name on the detection page.</li>
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Detailed Explanation -->
      <div class="result-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Overview & Symptoms
        </h3>
        <p style="line-height: 1.7; color: var(--gray-700); font-size: 1rem; margin-bottom: 1rem;">
          ${analysis.explanation || 'No detailed explanation provided.'}
        </p>

        ${analysis.symptoms_observed && analysis.symptoms_observed.length > 0 ? `
          <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem;">Visible Symptoms:</h4>
          <ul class="result-list" style="margin-bottom: 1.5rem;">
            ${analysis.symptoms_observed.map(sym => `<li>${sym}</li>`).join('')}
          </ul>
        ` : ''}

        ${analysis.possible_causes && analysis.possible_causes.length > 0 ? `
          <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem;">Possible Causes:</h4>
          <ul class="result-list" style="margin-bottom: 1.5rem;">
            ${analysis.possible_causes.map(cause => `<li>${cause}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- Recommended Actions -->
      ${analysis.recommended_actions && analysis.recommended_actions.length > 0 ? `
        <div class="result-section" style="border-top: 1px solid var(--color-border); padding-top: var(--space-6);">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Recommended Next Steps & Cultural Practices
          </h3>
          <ul class="result-list">
            ${analysis.recommended_actions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Prevention Tips -->
      ${analysis.prevention_tips && analysis.prevention_tips.length > 0 ? `
        <div class="result-section" style="border-top: 1px solid var(--color-border); padding-top: var(--space-6);">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Long-Term Prevention Tips
          </h3>
          <ul class="result-list">
            ${analysis.prevention_tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Professional Advice Notice -->
      ${analysis.professional_help_needed ? `
        <div style="background: var(--warning-light); border: 1px solid #fde68a; border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); margin-top: var(--space-6); display: flex; align-items: flex-start; gap: 0.75rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--warning); flex-shrink: 0; margin-top: 2px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong style="color: var(--gray-800); display: block; margin-bottom: 0.25rem;">Expert Consultation Recommended</strong>
            <p style="font-size: 0.9rem; color: var(--gray-700); margin: 0;">
              Given the symptoms and severity, we strongly recommend contacting your local agricultural extension service or certified agronomist for an in-person field assessment.
            </p>
          </div>
        </div>
      ` : ''}

      <!-- Limitations -->
      ${analysis.limitations ? `
        <p style="font-size: 0.85rem; color: var(--gray-500); margin-top: var(--space-6); font-style: italic;">
          * <strong>Technical Limitations:</strong> ${analysis.limitations}
        </p>
      ` : ''}

      <!-- Agricultural Disclaimer -->
      <div class="disclaimer">
        <strong>Agricultural Advisory Notice:</strong> PlantCare AI is an assistive decision-support tool. It does not replace on-field laboratory testing or certified agronomist evaluation. Always verify local pesticide regulations and guidelines before applying any agrochemicals.
      </div>

      <!-- Action Buttons -->
      <div class="result-actions">
        ${data.report_id ? `
          <button class="btn btn-outline" disabled style="opacity: 0.8;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Saved in Dashboard
          </button>
        ` : `
          <button id="save-report-btn" class="btn btn-outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Report
          </button>
        `}
        <button id="print-report-btn" class="btn btn-outline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print / PDF
        </button>
        <a href="detect.html" class="btn btn-primary" style="margin-left: auto;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Analyze Another Plant
        </a>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind Actions
  const printBtn = document.getElementById('print-report-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const saveBtn = document.getElementById('save-report-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const loggedIn = await checkAuth();
      if (!loggedIn) {
        showToast('Please log in or create an account to save reports.', 'info');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
        return;
      }

      saveBtn.disabled = true;
      try {
        const res = await api.saveReport({
          image_filename: data.image_filename,
          crop_type: analysis.plant_name || '',
          symptoms: (analysis.symptoms_observed || []).join(', '),
          language: sessionStorage.getItem('plantcare_language') || 'en',
          analysis: analysis,
        });
        showToast('Report saved to your dashboard!', 'success');
        saveBtn.textContent = 'Saved in Dashboard';
      } catch (err) {
        showToast(err.message, 'error');
        saveBtn.disabled = false;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initResults);
