/**
 * PlantCare AI — Upload & Interactive Dashboard module
 * Handles drag-and-drop, camera viewfinder modal, clipboard paste,
 * example gallery loading, image previewing, and symptoms character counting.
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

let selectedFile = null;
let cameraStream = null;
let currentFacingMode = 'environment';

function initUpload() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-input');
  const browseBtn = document.getElementById('btn-browse-trigger');
  const removeBtn = document.getElementById('btn-remove-preview');
  const replaceBtn = document.getElementById('btn-replace-preview');
  const openCameraBtn = document.getElementById('btn-open-camera');
  const pasteImageBtn = document.getElementById('btn-paste-image');
  const symptomsInput = document.getElementById('symptoms-input');

  if (!zone || !fileInput) return;

  // 1. File Picker Triggers
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  zone.addEventListener('click', () => {
    if (selectedFile) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelect(fileInput.files[0]);
    }
  });

  // Mobile native camera fallback
  if (cameraInput) {
    cameraInput.addEventListener('change', () => {
      if (cameraInput.files && cameraInput.files.length > 0) {
        handleFileSelect(cameraInput.files[0]);
      }
    });
  }

  // 2. Drag and Drop Support
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
      e.preventDefault();
      fileInput.click();
    }
  });

  // 3. Remove and Replace Preview Buttons
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetUpload();
    });
  }

  if (replaceBtn) {
    replaceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // 4. Live Camera Viewfinder Modal
  if (openCameraBtn) {
    openCameraBtn.addEventListener('click', openCameraModal);
  }

  initCameraControls();

  // 5. Clipboard Image Paste
  if (pasteImageBtn) {
    pasteImageBtn.addEventListener('click', handlePasteFromClipboard);
  }

  // Global Ctrl+V / Cmd+V paste support
  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (const item of e.clipboardData.items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            showToast('Pasted image loaded from clipboard!', 'success');
            return;
          }
        }
      }
    }
  });

  // 6. Symptoms Character Counter
  if (symptomsInput) {
    const counterEl = document.getElementById('symptoms-count');
    symptomsInput.addEventListener('input', () => {
      if (counterEl) {
        counterEl.textContent = symptomsInput.value.length;
      }
    });
  }

  // 7. Example Images Gallery Interactions
  initExampleGallery();
}

/**
 * Validates and displays selected image
 */
function handleFileSelect(file) {
  if (!file) return;

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Invalid format. Please upload a JPEG, PNG, or WebP image.', 'error');
    return;
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    showToast('File too large. Maximum image size is 10 MB.', 'error');
    return;
  }

  selectedFile = file;
  showPreview(file);
}

/**
 * Updates UI with the image preview
 */
function showPreview(file) {
  const emptyContent = document.getElementById('dropzone-empty-content');
  const previewContent = document.getElementById('dropzone-preview-content');
  const previewImg = document.getElementById('preview-img');
  const filenameEl = document.getElementById('preview-filename');
  const filesizeEl = document.getElementById('preview-filesize');
  const zone = document.getElementById('upload-zone');

  if (!emptyContent || !previewContent || !previewImg) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    if (filenameEl) filenameEl.textContent = file.name || 'plant_leaf.jpg';
    if (filesizeEl) filesizeEl.textContent = formatFileSize(file.size);

    emptyContent.style.display = 'none';
    previewContent.style.display = 'flex';
    if (zone) zone.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

/**
 * Resets the upload area back to empty state
 */
function resetUpload() {
  selectedFile = null;
  const emptyContent = document.getElementById('dropzone-empty-content');
  const previewContent = document.getElementById('dropzone-preview-content');
  const fileInput = document.getElementById('file-input');
  const cameraInput = document.getElementById('camera-input');
  const zone = document.getElementById('upload-zone');

  if (fileInput) fileInput.value = '';
  if (cameraInput) cameraInput.value = '';

  if (emptyContent && previewContent) {
    emptyContent.style.display = 'flex';
    previewContent.style.display = 'none';
  }

  if (zone) zone.classList.remove('has-image');
}

/**
 * Formats byte size into human readable string
 */
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getSelectedFile() {
  return selectedFile;
}

/**
 * ── Live Camera Modal Viewfinder ────────────────────────
 */
function initCameraControls() {
  const modal = document.getElementById('camera-modal');
  const closeBtn = document.getElementById('btn-close-camera');
  const snapBtn = document.getElementById('btn-snap-photo');
  const switchBtn = document.getElementById('btn-switch-camera');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCameraModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCameraModal();
    });
  }

  if (switchBtn) {
    switchBtn.addEventListener('click', async () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      await startCameraStream();
    });
  }

  if (snapBtn) {
    snapBtn.addEventListener('click', captureCameraPhoto);
  }
}

async function openCameraModal() {
  const modal = document.getElementById('camera-modal');
  if (!modal) return;

  modal.style.display = 'flex';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // Fallback to mobile file capture
    closeCameraModal();
    const cameraInput = document.getElementById('camera-input');
    if (cameraInput) cameraInput.click();
    return;
  }

  await startCameraStream();
}

async function startCameraStream() {
  const video = document.getElementById('camera-video');
  if (!video) return;

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    video.srcObject = cameraStream;
  } catch (err) {
    console.warn('Camera stream error:', err);
    closeCameraModal();
    showToast('Could not open live camera. Using file picker instead.', 'info');
    const cameraInput = document.getElementById('camera-input');
    if (cameraInput) cameraInput.click();
  }
}

function closeCameraModal() {
  const modal = document.getElementById('camera-modal');
  if (modal) modal.style.display = 'none';

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
}

function captureCameraPhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('Failed to capture frame.', 'error');
      return;
    }
    const capturedFile = new File([blob], `camera_leaf_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    handleFileSelect(capturedFile);
    closeCameraModal();
    showToast('Photo captured successfully!', 'success');
  }, 'image/jpeg', 0.92);
}

/**
 * ── Clipboard Paste Support ─────────────────────────────
 */
async function handlePasteFromClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    showToast('Press Ctrl+V (or Cmd+V) to paste an image from your clipboard.', 'info');
    return;
  }

  try {
    const items = await navigator.clipboard.read();
    let foundImage = false;

    for (const item of items) {
      const imageType = item.types.find((t) => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const ext = imageType.split('/')[1] || 'png';
        const file = new File([blob], `pasted_plant_leaf_${Date.now()}.${ext}`, {
          type: imageType,
        });
        handleFileSelect(file);
        showToast('Image pasted from clipboard!', 'success');
        foundImage = true;
        break;
      }
    }

    if (!foundImage) {
      showToast('No image found in clipboard. Copy an image first, then paste.', 'info');
    }
  } catch (err) {
    showToast('Could not read clipboard directly. Press Ctrl+V (or Cmd+V) to paste.', 'info');
  }
}

/**
 * ── Interactive Example Images Gallery ───────────────────
 */
function initExampleGallery() {
  const cards = document.querySelectorAll('.example-card');
  const cropSelect = document.getElementById('crop-select');

  cards.forEach((card) => {
    card.addEventListener('click', async () => {
      const imgPath = card.dataset.img;
      const crop = card.dataset.crop;
      const disease = card.dataset.disease;

      if (!imgPath) return;

      try {
        showToast(`Loading example: ${card.dataset.crop} — ${disease}...`, 'info');

        const response = await fetch(imgPath);
        if (!response.ok) throw new Error('Could not load example image');

        const blob = await response.blob();
        const filename = `${crop}_${disease.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });

        handleFileSelect(file);

        if (cropSelect && crop) {
          cropSelect.value = crop;
        }

        // Smooth scroll to upload panel so user can review & click analyze
        const uploadPanel = document.getElementById('upload-panel');
        if (uploadPanel) {
          uploadPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showToast(`Loaded "${crop.toUpperCase()} — ${disease}". Click "Analyze Plant" to run AI diagnosis!`, 'success');
      } catch (err) {
        console.error('Failed to load example:', err);
        showToast('Failed to load example image file.', 'error');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initUpload);
