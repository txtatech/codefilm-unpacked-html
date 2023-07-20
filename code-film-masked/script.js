// script.js

// Global variables
const maskedRegions = [];
let pinnedOverlays = [];
let originalCode = '';
let maskedCode = '';

// Function to mask the input
function maskInput() {
    const codeInput = document.getElementById('codeInput');
    originalCode = codeInput.value;
    maskedCode = originalCode.replace(/./g, '*'); // replace all characters with '*'
    codeInput.value = maskedCode;
}

// Function to unmask the input
function unmaskInput() {
    const codeInput = document.getElementById('codeInput');
    codeInput.value = originalCode;
}

// Function to create masked region
function createMaskedRegion() {
  const maskedRegion = document.createElement('span');
  maskedRegion.classList.add('masked-region');
  maskedRegion.textContent = '[MASKED]';
  return maskedRegion;
}

// Function to handle paste event
function handlePaste(e) {
  const pastedCode = e.clipboardData.getData('text/plain');
  const text = e.target;

  // Iterate through masked regions
  for (const maskedRegion of maskedRegions) {
    const originalCode = maskedRegion.dataset.originalCode;
    const regex = new RegExp(`\\[${originalCode}\\]`, 'g');
    const maskedText = text.textContent.replace(regex, `[${pastedCode}]`);
    text.innerHTML = maskedText;
  }
}

// Function to compare the pasted code with the original code
function compareCodes() {
  const codeInput = document.getElementById('codeInput');
  const pastedCode = codeInput.value;

  // Clear previous highlights
  codeInput.value = originalCode;

  let highlightedCode = ''; // Store the code with highlighted differences

  // Compare pasted code with original code
  for (let i = 0; i < originalCode.length; i++) {
    if (pastedCode[i] !== originalCode[i]) {
      // Add highlighted character to the code
      highlightedCode += '<span class="highlight">' + pastedCode[i] + '</span>';
    } else {
      // Add unchanged character to the code
      highlightedCode += pastedCode[i];
    }
  }

  // Update the code input with highlighted differences
  codeInput.innerHTML = highlightedCode;
}

// Function to detach overlay
function detachOverlay(filmOverlay) {
  // Remove event listeners
  filmOverlay.removeEventListener('mousedown');
  filmOverlay.removeEventListener('mouseup');
  window.removeEventListener('mousemove');
  filmOverlay.removeEventListener('mousewheel');
  window.removeEventListener('resize');

  // Remove detach button
  const detachButton = filmOverlay.querySelector('.detach-button');
  detachButton.parentNode.removeChild(detachButton);

  // Add overlay to pinnedOverlays array
  pinnedOverlays.push(filmOverlay);
}

// Function to create the overlay
function createOverlay() {
  // Create overlay element
  const filmOverlay = document.createElement('div');
  filmOverlay.classList.add('film-overlay');

  // Create text element
  const text = document.createElement('pre');
  text.classList.add('overlay-text');

  // Create resizer element
  const resizer = document.createElement('div');
  resizer.classList.add('overlay-resizer');

  // Create detach button
  const detachButton = document.createElement('button');
  detachButton.textContent = 'Pin';
  detachButton.classList.add('detach-button');

  // Append elements
  filmOverlay.appendChild(text);
  filmOverlay.appendChild(resizer);
  filmOverlay.appendChild(detachButton);

  return filmOverlay;
}

// Function to add overlay listeners
function addOverlayListeners(filmOverlay, text, resizer) {
  // Variables for storing the current position and the mouse offset
  let drag = false;
  let currentX;
  let currentY;
  let offsetX;
  let offsetY;
  let isResizing = false;
  let scale = 1;

  // mousedown event for dragging
  filmOverlay.addEventListener('mousedown', function (e) {
    if (e.shiftKey) {
      offsetX = e.clientX - parseInt(window.getComputedStyle(this).left);
      offsetY = e.clientY - parseInt(window.getComputedStyle(this).top);
      drag = true;
    }
  });

  // mousedown event for resizing
  resizer.addEventListener('mousedown', function (e) {
    isResizing = true;
  });

  // mousemove event for dragging and resizing
  window.addEventListener('mousemove', function (e) {
    e.preventDefault();
    if (drag) {
      currentX = e.clientX - offsetX;
      currentY = e.clientY - offsetY;
      filmOverlay.style.left = currentX + 'px';
      filmOverlay.style.top = currentY + 'px';
    } else if (isResizing) {
      let newWidth = e.pageX - filmOverlay.offsetLeft;
      let newHeight = e.pageY - filmOverlay.offsetTop;
      filmOverlay.style.width = newWidth + 'px';
      filmOverlay.style.height = newHeight + 'px';
      text.style.transform = `scale(${scale})`;
      adjustTextSize(filmOverlay, text);
    }
  }, { passive: false });

  // mouseup event for dragging and resizing
  window.addEventListener('mouseup', function () {
    drag = false;
    isResizing = false;
  });

  // mousewheel event for zooming
  filmOverlay.addEventListener('mousewheel', function (e) {
    e.preventDefault();
    const zoomSpeed = 0.1;
    scale += e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    scale = Math.max(scale, 0.1); // Minimum scale
    filmOverlay.style.transform = `scale(${scale})`;
    adjustTextSize(filmOverlay, text);
  }, { passive: false });

  // Adjust text size initially and whenever the window is resized
  adjustTextSize(filmOverlay, text);
  window.addEventListener('resize', () => adjustTextSize(filmOverlay, text));
}


// Function to adjust text size
function adjustTextSize(filmOverlay, text) {
  const containerWidth = filmOverlay.offsetWidth;
  const containerHeight = filmOverlay.offsetHeight;
  const textWidth = text.offsetWidth;
  const textHeight = text.offsetHeight;
  const scaleX = containerWidth / textWidth;
  const scaleY = containerHeight / textHeight;
  const finalScale = Math.min(scaleX, scaleY);
  text.style.transform = `scale(${finalScale})`;
}

// Function to initialize the application
function initialize() {
  const toggleButton = document.querySelector('#toggle-button');

  toggleButton.addEventListener('click', async function () {
    try {
      const copiedCode = await navigator.clipboard.readText();

      // Create overlay for each click
      const filmOverlay = createOverlay();
      const text = filmOverlay.querySelector('.overlay-text');
      const resizer = filmOverlay.querySelector('.overlay-resizer');
      const detachButton = filmOverlay.querySelector('.detach-button');

      // Add masked region
      const maskedRegion = createMaskedRegion();
      maskedRegion.dataset.originalCode = copiedCode;
      maskedRegions.push(maskedRegion);
      text.appendChild(maskedRegion);

      // Auto-populate masked region with clipboard contents
      text.innerHTML = text.innerHTML.replace('[MASKED]', `[${copiedCode}]`);

      // Add listeners to the overlay
      addOverlayListeners(filmOverlay, text, resizer);

      // Append to parent container
      document.body.appendChild(filmOverlay);

      detachButton.addEventListener('click', function () {
        detachOverlay(filmOverlay);
      });
    } catch (error) {
      console.log('Failed to read clipboard:', error);
    }
  });

  document.addEventListener('paste', handlePaste);
}

// Initialize the application
initialize();
