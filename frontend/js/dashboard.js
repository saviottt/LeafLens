/**
 * PlantCare AI — Dashboard module
 * Loads stats, reports, search/filter, delete, and simple chart rendering.
 */

function initDashboard() {
  const dashboardPage = document.getElementById('dashboard-page');
  if (!dashboardPage) return;

  loadDashboard();

  // Search and filter
  const searchInput = document.getElementById('report-search');
  const cropFilter = document.getElementById('crop-filter');
  let searchTimeout;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadReports(), 300);
    });
  }

  if (cropFilter) {
    cropFilter.addEventListener('change', () => loadReports());
  }
}

async function loadDashboard() {
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    showLoginPrompt();
    return;
  }

  loadStats();
  loadReports();
}

async function loadStats() {
  const statsContainer = document.getElementById('stats-grid');
  if (!statsContainer) return;

  try {
    const stats = await api.getStats();
    renderStats(stats, statsContainer);
    renderCharts(stats);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStats(stats, container) {
  container.innerHTML = '';

  const items = [
    { value: stats.total_analyses, label: 'Total Analyses', color: 'var(--green-700)' },
    { value: stats.diseases_detected, label: 'Diseases Detected', color: 'var(--warning)' },
    { value: stats.healthy_plants, label: 'Healthy Plants', color: 'var(--success)' },
    { value: Object.keys(stats.crop_counts).length, label: 'Crop Types', color: 'var(--info)' },
  ];

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'stat-card';

    const value = document.createElement('div');
    value.className = 'stat-value';
    value.style.color = item.color;
    value.textContent = item.value;

    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = item.label;

    card.appendChild(value);
    card.appendChild(label);
    container.appendChild(card);
  });
}

function renderCharts(stats) {
  // Disease distribution chart
  const diseaseChart = document.getElementById('disease-chart');
  if (diseaseChart && Object.keys(stats.disease_counts).length > 0) {
    renderBarChart(diseaseChart, stats.disease_counts, 'Diseases Detected');
  } else if (diseaseChart) {
    diseaseChart.innerHTML = '<p class="text-muted text-center">No disease data yet.</p>';
  }

  // Crop distribution chart
  const cropChart = document.getElementById('crop-chart');
  if (cropChart && Object.keys(stats.crop_counts).length > 0) {
    renderBarChart(cropChart, stats.crop_counts, 'Crops Analyzed');
  } else if (cropChart) {
    cropChart.innerHTML = '<p class="text-muted text-center">No crop data yet.</p>';
  }
}

function renderBarChart(container, data, title) {
  container.innerHTML = '';

  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.style.marginBottom = '0.5rem';
  heading.style.fontSize = '1rem';
  container.appendChild(heading);

  const chart = document.createElement('div');
  chart.className = 'bar-chart';

  const maxVal = Math.max(...Object.values(data));

  Object.entries(data).forEach(([label, count]) => {
    const item = document.createElement('div');
    item.className = 'bar-chart-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'bar-chart-label';
    labelEl.textContent = label || 'Unknown';
    labelEl.title = label;

    const track = document.createElement('div');
    track.className = 'bar-chart-track';

    const fill = document.createElement('div');
    fill.className = 'bar-chart-fill';
    fill.style.width = `${(count / maxVal) * 100}%`;

    track.appendChild(fill);

    const countEl = document.createElement('span');
    countEl.className = 'bar-chart-count';
    countEl.textContent = count;

    item.appendChild(labelEl);
    item.appendChild(track);
    item.appendChild(countEl);
    chart.appendChild(item);
  });

  container.appendChild(chart);
}

async function loadReports() {
  const tbody = document.getElementById('reports-tbody');
  const emptyState = document.getElementById('reports-empty');
  if (!tbody) return;

  const searchInput = document.getElementById('report-search');
  const cropFilter = document.getElementById('crop-filter');

  const params = {};
  if (searchInput && searchInput.value.trim()) params.search = searchInput.value.trim();
  if (cropFilter && cropFilter.value) params.crop = cropFilter.value;

  try {
    const data = await api.getReports(params);
    tbody.innerHTML = '';

    if (data.reports.length === 0) {
      tbody.closest('.reports-table-wrapper').style.display = 'none';
      if (emptyState) emptyState.style.display = '';
      return;
    }

    tbody.closest('.reports-table-wrapper').style.display = '';
    if (emptyState) emptyState.style.display = 'none';

    data.reports.forEach(report => {
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.textContent = new Date(report.created_at).toLocaleDateString();

      const tdPlant = document.createElement('td');
      tdPlant.textContent = report.analysis.plant_name || 'Unknown';

      const tdDisease = document.createElement('td');
      tdDisease.textContent = report.analysis.disease_name || 'None detected';

      const tdSeverity = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'result-badge';
      const sev = (report.analysis.severity || '').toLowerCase();
      if (sev.includes('severe')) badge.classList.add('badge-danger');
      else if (sev.includes('moderate')) badge.classList.add('badge-warning');
      else if (sev.includes('mild')) badge.classList.add('badge-info');
      else badge.classList.add('badge-healthy');
      badge.textContent = report.analysis.severity || 'N/A';
      tdSeverity.appendChild(badge);

      const tdActions = document.createElement('td');
      const viewBtn = document.createElement('a');
      viewBtn.className = 'btn btn-sm btn-secondary';
      viewBtn.textContent = 'View';
      viewBtn.href = '#';
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        viewReport(report);
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.style.marginLeft = '0.5rem';
      delBtn.addEventListener('click', () => deleteReport(report.id));

      tdActions.appendChild(viewBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdDate);
      tr.appendChild(tdPlant);
      tr.appendChild(tdDisease);
      tr.appendChild(tdSeverity);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function viewReport(report) {
  const resultData = {
    success: true,
    report_id: report.id,
    image_filename: report.image_filename,
    analysis: report.analysis,
  };
  sessionStorage.setItem('plantcare_result', JSON.stringify(resultData));
  sessionStorage.setItem('plantcare_language', report.language || 'en');
  window.location.href = 'results.html';
}

async function deleteReport(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;

  try {
    await api.deleteReport(id);
    showToast('Report deleted.', 'success');
    loadReports();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showLoginPrompt() {
  const main = document.querySelector('.dashboard-content');
  if (!main) return;

  main.innerHTML = '';

  const empty = document.createElement('div');
  empty.className = 'empty-state';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '1.5');
  icon.innerHTML = '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';

  const h3 = document.createElement('h3');
  h3.textContent = t('login_required');

  const link = document.createElement('a');
  link.href = 'login.html';
  link.className = 'btn btn-primary';
  link.textContent = t('nav_login');
  link.style.marginTop = '1rem';
  link.style.display = 'inline-flex';

  empty.appendChild(icon);
  empty.appendChild(h3);
  empty.appendChild(link);
  main.appendChild(empty);
}

document.addEventListener('DOMContentLoaded', initDashboard);
