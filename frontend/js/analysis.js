/**
 * PlantCare AI — Analysis & In-Page Results module
 * Handles form validation, submitting to Gemini backend,
 * displaying real-time loading feedback, rendering rich in-page results,
 * and saving analysis to sessionStorage.
 */

let isAnalyzing = false;

function initAnalysis() {
  const form = document.getElementById('analysis-form');
  if (!form) return;

  // Language pill toggles in middle panel
  const langPills = document.querySelectorAll('.lang-pill');
  langPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      langPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      if (typeof setLanguage === 'function') {
        setLanguage(pill.dataset.lang);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isAnalyzing) return;

    const file = typeof getSelectedFile === 'function' ? getSelectedFile() : null;
    if (!file) {
      showToast('Please select, capture, or drag a plant photo first.', 'error');
      const uploadZone = document.getElementById('upload-zone');
      if (uploadZone) {
        uploadZone.classList.add('drag-over');
        setTimeout(() => uploadZone.classList.remove('drag-over'), 800);
        uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const cropSelect = document.getElementById('crop-select');
    const symptomsInput = document.getElementById('symptoms-input');
    const activeLangPill = document.querySelector('.lang-pill.active');

    const crop = cropSelect ? cropSelect.value : '';
    const symptoms = symptomsInput ? symptomsInput.value.trim() : '';
    const language = activeLangPill ? activeLangPill.dataset.lang : (window.currentLang || 'en');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('crop', crop);
    formData.append('symptoms', symptoms);
    formData.append('language', language);

    // Enter loading state
    isAnalyzing = true;
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnContent = analyzeBtn ? analyzeBtn.querySelector('.btn-analyze-content') : null;
    const btnSpinner = document.getElementById('btn-spinner');

    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.setAttribute('aria-disabled', 'true');
    }
    if (btnContent) btnContent.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'flex';

    showToast('Analyzing plant photo with AI...', 'info');

    try {
      const result = await api.analyzeImage(formData);

      // Persist in sessionStorage for results.html compatibility
      sessionStorage.setItem('plantcare_result', JSON.stringify(result));
      sessionStorage.setItem('plantcare_language', language);

      // Render directly into the in-page results section
      renderInPageResults(result, file);
      showToast('Analysis complete!', 'success');

      // Smooth scroll to the results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('Analysis error:', err);
      showToast(err.message || 'An error occurred during analysis.', 'error');
    } finally {
      isAnalyzing = false;
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.removeAttribute('aria-disabled');
      }
      if (btnContent) btnContent.style.display = 'flex';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  });
}

/**
 * Renders the full structured analysis card beneath the dashboard
 */
function renderInPageResults(data, originalFile) {
  const container = document.getElementById('results-card');
  if (!container) return;

  const analysis = data.analysis || {};
  const imageFilename = data.image_filename;
  const imageUrl = imageFilename ? api.imageUrl(imageFilename) : '';

  const isPlant = analysis.is_plant_image !== false;
  const isHealthy = (analysis.health_status || '').toLowerCase().includes('healthy');
  const isInconclusive = (analysis.health_status || '').toLowerCase().includes('inconclusive');
  const confidence = Math.round((analysis.confidence || 0) * 100);

  // Confidence styling
  let confColor = '#16a34a';
  if (confidence < 50) confColor = '#dc2626';
  else if (confidence < 75) confColor = '#d97706';

  // Severity styling
  const sev = (analysis.severity || '').toLowerCase();
  let sevBadge = `<span class="result-badge badge-info">${analysis.severity || 'Mild'}</span>`;
  if (sev.includes('severe')) {
    sevBadge = `<span class="result-badge badge-danger">High Severity</span>`;
  } else if (sev.includes('moderate')) {
    sevBadge = `<span class="result-badge badge-warning">Moderate Severity</span>`;
  } else if (isHealthy) {
    sevBadge = `<span class="result-badge badge-healthy">Optimal Health</span>`;
  }

  // Fallback preview URL if backend filename not loaded
  let previewSrc = imageUrl;
  if (!previewSrc && originalFile) {
    previewSrc = URL.createObjectURL(originalFile);
  }

  if (!isPlant) {
    container.innerHTML = `
      <div class="inconclusive-box" style="padding: 2.5rem 1.5rem; text-align: center;">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="margin: 0 auto 1rem;">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <h3 style="color: #dc2626; font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.5rem;">
          Not Recognized as a Plant
        </h3>
        <p style="color: #526273; max-width: 580px; margin: 0 auto 1.5rem; font-size: 1rem;">
          ${analysis.explanation || 'The uploaded photograph does not appear to show a plant, crop, or leaf clearly.'}
        </p>
        <div style="background: #fff; border: 1px solid #fed7d7; border-radius: 12px; padding: 16px; max-width: 500px; margin: 0 auto 1.5rem; text-align: left;">
          <p style="font-weight: 700; color: #123D2A; margin-bottom: 8px;">Tips for accurate detection:</p>
          <ul style="padding-left: 20px; color: #526273; font-size: 0.9rem;">
            <li>Ensure the plant leaf is centered in the camera frame.</li>
            <li>Take the photo in clear, natural daytime lighting.</li>
            <li>Avoid blurry, dark, or excessively distant shots.</li>
          </ul>
        </div>
        <button type="button" class="btn btn-primary" onclick="resetToUploadView()">Try Another Photo</button>
      </div>
    `;
    return;
  }

  // Treatment recommendations
  const treatment = analysis.treatment || {};
  const organicList = Array.isArray(treatment.organic) ? treatment.organic : (treatment.organic ? [treatment.organic] : []);
  const chemicalList = Array.isArray(treatment.chemical) ? treatment.chemical : (treatment.chemical ? [treatment.chemical] : []);
  const preventionList = Array.isArray(analysis.prevention) ? analysis.prevention : (analysis.prevention ? [analysis.prevention] : []);

  container.innerHTML = `
    <!-- Top Result Banner -->
    <div style="display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; border-bottom: 1px solid #E1E8E4; padding-bottom: 24px;">
      ${previewSrc ? `
        <div style="width: 140px; height: 140px; border-radius: 16px; overflow: hidden; border: 2px solid #E1E8E4; flex-shrink: 0; background: #000;">
          <img src="${previewSrc}" alt="${analysis.plant_name || 'Analyzed plant'}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      ` : ''}
      <div style="flex: 1; min-width: 260px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
          <span class="result-badge ${isHealthy ? 'badge-healthy' : 'badge-danger'}">
            ${analysis.health_status || (isHealthy ? 'Healthy Plant' : 'Disease Detected')}
          </span>
          ${sevBadge}
          ${analysis.plant_part ? `<span class="result-badge badge-info">${analysis.plant_part}</span>` : ''}
        </div>

        <h2 style="font-family: var(--font-display); font-size: clamp(1.6rem, 2.4vw, 2.1rem); font-weight: 800; color: #123D2A; margin: 0 0 6px;">
          ${analysis.disease_name || (isHealthy ? 'Healthy Foliage' : 'Botanical Condition')}
        </h2>

        <p style="font-size: 1.05rem; color: #526273; font-weight: 500; margin: 0 0 14px;">
          Identified Crop: <strong style="color: #168345;">${analysis.plant_name || data.crop || 'Plant'}</strong>
        </p>

        <!-- Confidence Indicator -->
        <div style="max-width: 360px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #123D2A; margin-bottom: 4px;">
            <span>AI Assessment Confidence:</span>
            <span style="color: ${confColor}; font-weight: 700;">${confidence}%</span>
          </div>
          <div style="height: 8px; background: #e5e7eb; border-radius: 9999px; overflow: hidden;">
            <div style="width: ${confidence}%; height: 100%; background: ${confColor}; border-radius: 9999px; transition: width 0.6s ease;"></div>
          </div>
          ${analysis.confidence_explanation ? `<p style="font-size: 0.78rem; color: #6b7280; margin-top: 4px;">${analysis.confidence_explanation}</p>` : ''}
        </div>
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        <button type="button" class="btn btn-outline" onclick="window.print()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>Print</span>
        </button>
        <button type="button" class="btn btn-primary" onclick="resetToUploadView()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          <span>Analyze Another</span>
        </button>
      </div>
    </div>

    <!-- Inconclusive Alert if applicable -->
    ${isInconclusive ? `
      <div class="inconclusive-box" style="margin-top: 20px;">
        <h3 style="color: #2563eb; font-weight: 700;">Inconclusive Diagnosis</h3>
        <p style="color: #4b5563;">${analysis.explanation || 'The model could not identify the condition with complete certainty.'}</p>
        <div class="inconclusive-tips">
          <p><strong>Recommended next steps:</strong></p>
          <ul>
            <li>Take a closer photo focusing directly on the lesions or discolored leaves.</li>
            <li>Select the exact crop name in the dropdown for tailored assessment.</li>
          </ul>
        </div>
      </div>
    ` : ''}

    <!-- Detailed Insights Grid -->
    <div class="result-detail-grid">
      <!-- 1. Overview & Visible Symptoms -->
      <div class="result-detail-box">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Overview & Symptoms</span>
        </h4>
        <p style="font-size: 0.92rem; color: #40564B; line-height: 1.6; margin-bottom: 12px;">
          ${analysis.explanation || 'No detailed overview provided.'}
        </p>
        ${analysis.symptoms_observed && analysis.symptoms_observed.length > 0 ? `
          <p style="font-size: 0.85rem; font-weight: 700; color: #123D2A; margin-bottom: 6px;">Observed Symptoms:</p>
          <ul>
            ${analysis.symptoms_observed.map(sym => `<li>${sym}</li>`).join('')}
          </ul>
        ` : ''}
        ${analysis.possible_causes && analysis.possible_causes.length > 0 ? `
          <p style="font-size: 0.85rem; font-weight: 700; color: #123D2A; margin-top: 10px; margin-bottom: 6px;">Probable Causes:</p>
          <ul>
            ${analysis.possible_causes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- 2. Treatment Options -->
      <div class="result-detail-box">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Treatment Suggestions</span>
        </h4>
        ${organicList.length > 0 ? `
          <p style="font-size: 0.85rem; font-weight: 700; color: #168345; margin-bottom: 6px;">Organic / Cultural Control:</p>
          <ul style="margin-bottom: 12px;">
            ${organicList.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
        ${chemicalList.length > 0 ? `
          <p style="font-size: 0.85rem; font-weight: 700; color: #b45309; margin-bottom: 6px;">Chemical / Protective Treatments:</p>
          <ul>
            ${chemicalList.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
        ${!organicList.length && !chemicalList.length ? `
          <p style="font-size: 0.92rem; color: #526273;">No special chemical treatments required. Maintain regular watering, balanced soil nutrition, and good air circulation.</p>
        ` : ''}
      </div>

      <!-- 3. Prevention & Expert Advice -->
      <div class="result-detail-box">
        <h4>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          <span>Prevention & Best Practices</span>
        </h4>
        ${preventionList.length > 0 ? `
          <ul style="margin-bottom: 12px;">
            ${preventionList.map(p => `<li>${p}</li>`).join('')}
          </ul>
        ` : `
          <p style="font-size: 0.92rem; color: #526273; margin-bottom: 12px;">Practice crop rotation, clean gardening tools between uses, and avoid overhead sprinkler watering.</p>
        `}
        ${analysis.expert_consultation ? `
          <div style="background: #FFF9E8; border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-top: 10px;">
            <p style="font-size: 0.84rem; color: #92400e; margin: 0;"><strong>Expert Recommendation:</strong> ${analysis.expert_consultation}</p>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Disclaimer Banner -->
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 18px; margin-top: 24px; font-size: 0.8rem; color: #6b7280; line-height: 1.5;">
      <strong>Agricultural Advisory Disclaimer:</strong> PlantCare AI provides preliminary automated diagnostics based on photographs and computer vision models. Results may be inaccurate and do not replace laboratory pathology tests. Please consult an authorized local agricultural extension officer before purchasing pesticides or undertaking costly interventions.
    </div>
  `;
}

/**
 * Resets the form and smoothly scrolls back to the upload area
 */
window.resetToUploadView = function() {
  if (typeof resetUpload === 'function') resetUpload();
  const uploadPanel = document.getElementById('upload-panel');
  if (uploadPanel) {
    uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

document.addEventListener('DOMContentLoaded', initAnalysis);
