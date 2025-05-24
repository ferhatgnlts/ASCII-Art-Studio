document.addEventListener('DOMContentLoaded', function () {
      // DOM Elements
      const widthSlider = document.getElementById('width-slider');
      const widthValue = document.getElementById('width-value');
      const contrastSlider = document.getElementById('contrast-slider');
      const contrastValue = document.getElementById('contrast-value');
      const brightnessSlider = document.getElementById('brightness-slider');
      const brightnessValue = document.getElementById('brightness-value');
      const convertBtn = document.getElementById('convert-btn');
      const invertBtn = document.getElementById('invert-btn');
      const asciiContainer = document.getElementById('ascii-container');
      const originalImage = document.getElementById('original-image');
      const copyBtn = document.getElementById('copy-btn');
      const downloadBtn = document.getElementById('download-btn');
      const charsetSelect = document.getElementById('charset-select');
      const imageUrl = document.getElementById('image-url');
      const loadUrlBtn = document.getElementById('load-url-btn');
      const fileInput = document.getElementById('file-input');
      const loadFileBtn = document.getElementById('load-file-btn');
      const sampleSelect = document.getElementById('sample-select');
      const loadSampleBtn = document.getElementById('load-sample-btn');
      const tabButtons = document.querySelectorAll('.tab-button');
      const sourceOptions = document.querySelectorAll('.source-option');

      // Variables
      let asciiChars = ['@', '#', '8', '&', 'o', ':', '*', '.', ' '];
      let inverted = false;
      let currentImageUrl = 'image.jpg';

      // Initialize with proper width value
      updateSliderValues();
      setInitialWidth();

      // Event Listeners
      widthSlider.addEventListener('input', updateSliderValues);
      contrastSlider.addEventListener('input', updateSliderValues);
      brightnessSlider.addEventListener('input', updateSliderValues);

      charsetSelect.addEventListener('change', (e) => {
        switch(e.target.value) {
          case 'standard': asciiChars = ['@', '#', '8', '&', 'o', ':', '*', '.', ' ']; break;
          case 'blocks': asciiChars = ['█', '▓', '▒', '░', '.', ' ']; break;
          case 'dots': asciiChars = ['.', ':', '*', '+', '=', '-', ' ']; break;
          case 'detailed': asciiChars = ['@', '%', '#', '*', '+', '=', '-', ':', '.', ' ']; break;
          case 'binary': asciiChars = ['0', '1', ' ']; break;
        }
      });

      convertBtn.addEventListener('click', convertImageToAscii);
      invertBtn.addEventListener('click', toggleInvert);
      copyBtn.addEventListener('click', copyAsciiToClipboard);
      downloadBtn.addEventListener('click', downloadAsciiArt);

      // Image loading handlers
      loadUrlBtn.addEventListener('click', loadImageFromUrl);
      loadFileBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', loadImageFromFile);
      loadSampleBtn.addEventListener('click', loadSampleImage);

      // Tab switching
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tabId = button.getAttribute('data-tab');
          switchTab(tabId);
        });
      });

      // Trigger conversion when image loads
      originalImage.addEventListener('load', function() {
        currentImageUrl = originalImage.src;
        convertImageToAscii();
      });

      // Functions
      function setInitialWidth() {
        const screenBasedWidth = Math.min(150, Math.floor(window.innerWidth / 6));
        widthSlider.value = screenBasedWidth;
        widthValue.textContent = screenBasedWidth;
      }

      function updateSliderValues() {
        widthValue.textContent = widthSlider.value;
        contrastValue.textContent = contrastSlider.value;
        brightnessValue.textContent = brightnessSlider.value;
      }

      function switchTab(tabId) {
        // Update tab buttons
        tabButtons.forEach(button => {
          if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        });
        
        // Update content
        sourceOptions.forEach(option => {
          if (option.id === tabId) {
            option.classList.add('active');
          } else {
            option.classList.remove('active');
          }
        });
      }

      function loadImageFromUrl() {
        const url = imageUrl.value.trim();
        if (!url) {
          alert('Please enter a valid image URL');
          return;
        }
        
        originalImage.src = url;
        showLoadingState();
      }

      function loadImageFromFile() {
        const file = fileInput.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
          alert('Please select an image file');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
          originalImage.src = e.target.result;
          showLoadingState();
        };
        reader.readAsDataURL(file);
      }

      function loadSampleImage() {
        const sampleUrl = sampleSelect.value;
        originalImage.src = sampleUrl;
        showLoadingState();
      }

      function showLoadingState() {
        asciiContainer.textContent = 'Loading image...';
        originalImage.style.display = 'none';
        originalImage.onload = function() {
          originalImage.style.display = 'block';
          convertImageToAscii();
        };
        originalImage.onerror = function() {
          asciiContainer.textContent = 'Error loading image. Please check the URL or try another image.';
          originalImage.style.display = 'none';
        };
      }

      function toggleInvert() {
        inverted = !inverted;
        convertImageToAscii();
      }

      function convertImageToAscii() {
        try {
          const width = parseInt(widthSlider.value);
          const contrast = parseInt(contrastSlider.value) / 100;
          const brightness = parseInt(brightnessSlider.value) / 100;

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate height maintaining aspect ratio and considering character aspect
          const charAspectRatio = 0.5; // Characters are roughly twice as tall as wide
          const imgAspectRatio = originalImage.naturalHeight / originalImage.naturalWidth;
          const height = Math.floor(width * imgAspectRatio * charAspectRatio);

          canvas.width = width;
          canvas.height = height;
          
          // Apply filters
          ctx.filter = `
            contrast(${contrast * 100}%)
            brightness(${brightness * 100}%)
          `;
          
          ctx.drawImage(originalImage, 0, 0, width, height);
          
          // Reset filter for future operations
          ctx.filter = 'none';

          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;
          let asciiArt = '';

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const index = (y * width + x) * 4;
              const r = pixels[index];
              const g = pixels[index + 1];
              const b = pixels[index + 2];

              // Calculate brightness (0-1)
              let pixelBrightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              
              // Apply contrast and brightness adjustments
              pixelBrightness = (pixelBrightness - 0.5) * contrast + 0.5;
              pixelBrightness = pixelBrightness * brightness;
              pixelBrightness = Math.max(0, Math.min(1, pixelBrightness));

              // Map brightness to character
              const charIndex = Math.floor((inverted ? pixelBrightness : (1 - pixelBrightness)) * (asciiChars.length - 1));
              asciiArt += asciiChars[charIndex];
            }
            asciiArt += '\n';
          }

          asciiContainer.textContent = asciiArt;
        } catch (error) {
          console.error('Error converting image:', error);
          asciiContainer.textContent = 'Error converting image. Please try another image or adjust settings.';
        }
      }

      function copyAsciiToClipboard() {
        navigator.clipboard.writeText(asciiContainer.textContent)
          .then(() => alert('ASCII art copied to clipboard!'))
          .catch(err => alert('Failed to copy: ' + err));
      }

      function downloadAsciiArt() {
        const blob = new Blob([asciiContainer.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ascii-art.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });