/**
 * PlantCare AI — Main JavaScript
 * Navigation, toasts, language toggle, shared utilities.
 */

/* ── Translations ─────────────────────────────────────── */
const translations = {
  en: {
    nav_home: 'Home',
    nav_detect: 'Detect Disease',
    nav_reports: 'My Reports',
    nav_about: 'About',
    nav_login: 'Login',
    nav_logout: 'Logout',
    nav_dashboard: 'Dashboard',
    hero_eyebrow: 'YOUR SMART FARMING COMPANION',
    hero_title: 'Detect Smarter. Grow Better.',
    hero_title_1: 'Detect Smarter.',
    hero_title_2: 'Grow Better.',
    hero_subtitle: 'AI-powered insights for healthier plants and better harvests.',
    hero_desc: 'Upload a photo of your plant to identify diseases, get treatment suggestions, explore the best crops for your land, and stay updated with market prices — all in one place.',
    hero_cta: 'Analyze My Plant',
    hero_cta2: 'Explore Features',
    feature_1: 'Plant Disease Detection',
    feature_2: 'Best Crop Recommendations',
    feature_3: 'Market Price Prediction',
    feature_4: 'Treatment Guidance',
    upload_title: 'Drag & drop your plant image here',
    upload_subtitle: 'or click to browse files',
    upload_formats: 'Supports JPEG, PNG, WebP — Max 10 MB',
    upload_camera: 'Use Camera',
    btn_analyze: 'Analyze Plant',
    btn_remove: 'Remove',
    btn_replace: 'Replace',
    select_crop: 'Select crop type (optional)',
    symptoms_label: 'Describe symptoms (optional)',
    symptoms_placeholder: 'e.g., yellow spots, wilting leaves...',
    language_label: 'Language',
    analyzing: 'Analyzing your plant...',
    analyzing_sub: 'This may take a few seconds',
    disclaimer: 'PlantCare AI provides preliminary AI-generated plant-health guidance based on photographs. Results may be incorrect and are not a guaranteed diagnosis. Consult a qualified agricultural expert before applying pesticides or making costly crop-management decisions.',
    save_report: 'Save Report',
    print_report: 'Print Report',
    download_pdf: 'Download PDF',
    analyze_another: 'Analyze Another Plant',
    no_reports: 'No reports yet',
    no_reports_desc: 'Start by analyzing a plant image to create your first report.',
    login_required: 'Please log in to access this feature.',
  },
  ml: {
    nav_home: 'ഹോം',
    nav_detect: 'രോഗം കണ്ടെത്തുക',
    nav_reports: 'എന്റെ റിപ്പോർട്ടുകൾ',
    nav_about: 'കുറിച്ച്',
    nav_login: 'ലോഗിൻ',
    nav_logout: 'ലോഗൗട്ട്',
    nav_dashboard: 'ഡാഷ്ബോർഡ്',
    hero_eyebrow: 'നിങ്ങളുടെ സ്മാർട്ട് കാർഷിക സഹായി',
    hero_title: 'കൂടുതൽ സ്മാർട്ടായി കണ്ടെത്തൂ. മികച്ച രീതിയിൽ വളർത്തൂ.',
    hero_title_1: 'കൂടുതൽ സ്മാർട്ടായി കണ്ടെത്തൂ.',
    hero_title_2: 'മികച്ച രീതിയിൽ വളർത്തൂ.',
    hero_subtitle: 'ആരോഗ്യമുള്ള വിളകൾക്കും മികച്ച വിളവെടുപ്പിനുമായി AI സാങ്കേതികവിദ്യ.',
    hero_desc: 'സസ്യ രോഗങ്ങൾ തിരിച്ചറിയാനും ചികിത്സാ നിർദ്ദേശങ്ങൾ നേടാനും നിങ്ങളുടെ കൃഷിഭൂമിക്ക് അനുയോജ്യമായ വിളകൾ കണ്ടെത്താനും വിപണി വില വിവരങ്ങൾ അറിയാനും ചെടിയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.',
    hero_cta: 'ചെടി വിശകലനം ചെയ്യുക',
    hero_cta2: 'സവിശേഷതകൾ കാണുക',
    feature_1: 'സസ്യ രോഗ നിർണ്ണയം',
    feature_2: 'വിള ശുപാർശകൾ',
    feature_3: 'വിപണി വില പ്രവചനം',
    feature_4: 'ചികിത്സാ മാർഗ്ഗനിർദ്ദേശം',
    upload_title: 'നിങ്ങളുടെ ചെടിയുടെ ചിത്രം ഇവിടെ വലിച്ചിടുക',
    upload_subtitle: 'അല്ലെങ്കിൽ ഫയലുകൾ ബ്രൗസ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക',
    upload_formats: 'JPEG, PNG, WebP പിന്തുണയ്ക്കുന്നു — പരമാവധി 10 MB',
    upload_camera: 'ക്യാമറ ഉപയോഗിക്കുക',
    btn_analyze: 'ചെടി വിശകലനം ചെയ്യുക',
    btn_remove: 'നീക്കം ചെയ്യുക',
    btn_replace: 'മാറ്റിസ്ഥാപിക്കുക',
    select_crop: 'വിള തരം തിരഞ്ഞെടുക്കുക (ഓപ്ഷണൽ)',
    symptoms_label: 'ലക്ഷണങ്ങൾ വിവരിക്കുക (ഓപ്ഷണൽ)',
    symptoms_placeholder: 'ഉദാ: മഞ്ഞ പുള്ളികൾ, വാട്ടം...',
    language_label: 'ഭാഷ',
    analyzing: 'നിങ്ങളുടെ ചെടി വിശകലനം ചെയ്യുന്നു...',
    analyzing_sub: 'ഇതിന് കുറച്ച് സെക്കൻഡുകൾ എടുത്തേക്കാം',
    disclaimer: 'PlantCare AI ഫോട്ടോഗ്രാഫുകളെ അടിസ്ഥാനമാക്കി AI-ജനറേറ്റ് ചെയ്ത പ്രാഥമിക സസ്യ-ആരോഗ്യ മാർഗ്ഗനിർദ്ദേശം നൽകുന്നു. ഫലങ്ങൾ തെറ്റായേക്കാം, ഇത് ഒരു ഉറപ്പായ രോഗനിർണ്ണയമല്ല. കീടനാശിനികൾ പ്രയോഗിക്കുന്നതിന് മുമ്പ് ഒരു യോഗ്യതയുള്ള കൃഷി വിദഗ്ധനെ സമീപിക്കുക.',
    save_report: 'റിപ്പോർട്ട് സേവ് ചെയ്യുക',
    print_report: 'റിപ്പോർട്ട് പ്രിന്റ് ചെയ്യുക',
    download_pdf: 'PDF ഡൗൺലോഡ്',
    analyze_another: 'മറ്റൊരു ചെടി വിശകലനം ചെയ്യുക',
    no_reports: 'ഇതുവരെ റിപ്പോർട്ടുകൾ ഇല്ല',
    no_reports_desc: 'നിങ്ങളുടെ ആദ്യ റിപ്പോർട്ട് സൃഷ്ടിക്കാൻ ഒരു ചെടിയുടെ ചിത്രം വിശകലനം ചെയ്തു തുടങ്ങുക.',
    login_required: 'ഈ സവിശേഷത ആക്‌സസ് ചെയ്യാൻ ദയവായി ലോഗിൻ ചെയ്യുക.',
  },
};

let currentLang = localStorage.getItem('plantcare_lang') || 'en';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('plantcare_lang', lang);
  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Update lang toggle buttons
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

/* ── Toast Notifications ──────────────────────────────── */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Auth State ───────────────────────────────────────── */
let currentUser = null;

async function checkAuth() {
  try {
    const data = await api.getMe();
    currentUser = data.user;
    updateNavAuth();
    return true;
  } catch (_) {
    currentUser = null;
    updateNavAuth();
    return false;
  }
}

function updateNavAuth() {
  const loginLinks = document.querySelectorAll('.nav-login');
  const logoutLinks = document.querySelectorAll('.nav-logout');
  const authOnlyLinks = document.querySelectorAll('.auth-only');

  loginLinks.forEach(el => { el.style.display = currentUser ? 'none' : ''; });
  logoutLinks.forEach(el => { el.style.display = currentUser ? '' : 'none'; });
  authOnlyLinks.forEach(el => { el.style.display = currentUser ? '' : 'none'; });
}

async function handleLogout() {
  try {
    await api.logout();
    currentUser = null;
    updateNavAuth();
    showToast('Logged out successfully', 'success');
    window.location.href = 'index.html';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Mobile Navigation ────────────────────────────────── */
function initNavbar() {
  const toggle = document.querySelector('.navbar-toggle');
  const links = document.querySelector('.navbar-links');
  const overlay = document.querySelector('.nav-overlay');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (overlay) overlay.classList.toggle('visible', isOpen);
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('visible');
    });
  }

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('visible');
    });
  });
}

/* ── Loading overlay ──────────────────────────────────── */
function showLoading(message) {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div><p class="loading-text"></p>';
    document.body.appendChild(overlay);
  }
  overlay.querySelector('.loading-text').textContent = message || t('analyzing');
  overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/* ── Initialize ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setLanguage(currentLang);
  checkAuth();

  // Logout buttons
  document.querySelectorAll('.nav-logout').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
});
