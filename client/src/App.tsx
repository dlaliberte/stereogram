import React, { useState, useRef } from 'react';
import { StereogramGenerator, StereogramOptions, SimpleShape } from './utils/stereogramGenerator';
import './App.css';

type InputMode = 'file' | 'url' | 'shape';

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('shape');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<SimpleShape>('sphere');
  const [generatedStereogram, setGeneratedStereogram] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingMode, setViewingMode] = useState<'parallel' | 'cross-eyed'>('parallel');
  const [eyeSeparation, setEyeSeparation] = useState(60);
  const [depthScale, setDepthScale] = useState(0.3);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAlignmentFrame, setShowAlignmentFrame] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const shapeDescriptions: Record<SimpleShape, string> = {
    sphere: 'Gradient shaded sphere',
    cube: 'Rubik\'s cube with colored faces',
    pyramid: 'Stepped pyramid',
    cylinder: 'Circular cylinder',
    torus: 'Donut shape',
    cone: 'Pointed cone'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedStereogram(null);
    setInputMode('file');

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlLoad = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedStereogram(null);
    setInputMode('url');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setSelectedImage(imageUrl);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError('Failed to load image from URL. Make sure the URL is valid and the image is publicly accessible.');
        setIsLoading(false);
      };
      img.src = imageUrl;
    } catch (err) {
      setError('Failed to load image from URL');
      setIsLoading(false);
    }
  };

  const handleShapeSelect = (shape: SimpleShape) => {
    setSelectedShape(shape);
    setInputMode('shape');
    setSelectedImage(null);
    setGeneratedStereogram(null);
    setError(null);
  };

  const handleGenerateStereogram = async () => {
    if (inputMode !== 'shape' && (!selectedImage || !imageRef.current)) {
      setError('Please select an image or shape first');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const generator = new StereogramGenerator();
      const options: StereogramOptions = {
        width: 800,
        height: 600,
        eyeSeparation,
        depthScale,
        viewingMode,
        showAlignmentFrame
      };

      let stereogramDataUrl: string;

      if (inputMode === 'shape') {
        stereogramDataUrl = await generator.generateFromShape(selectedShape, options);
      } else {
        stereogramDataUrl = await generator.generateFromImage(imageRef.current!, options);
      }

      setGeneratedStereogram(stereogramDataUrl);
    } catch (err) {
      setError('Failed to generate stereogram. Please try again.');
      console.error('Stereogram generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedStereogram) return;

    const link = document.createElement('a');
    link.download = `stereogram-${inputMode === 'shape' ? selectedShape : 'image'}-${viewingMode}.png`;
    link.href = generatedStereogram;
    link.click();
  };

  const canGenerate = inputMode === 'shape' || (selectedImage && !isLoading);

  return (
    <div className="App">
      <header>
        <h1>Stereogram Generator</h1>
        <p>Create magic eye stereograms from your images or 3D shapes!</p>
      </header>
      <main>
        <div className="container">
          <section className="input-section">
            <h2>1. Choose Input Source</h2>

            {/* Input Mode Tabs */}
            <div className="input-mode-tabs">
              <button
                className={inputMode === 'shape' ? 'active' : ''}
                onClick={() => setInputMode('shape')}
              >
                3D Shapes
              </button>
              <button
                className={inputMode === 'file' ? 'active' : ''}
                onClick={() => setInputMode('file')}
              >
                Upload Image
              </button>
              <button
                className={inputMode === 'url' ? 'active' : ''}
                onClick={() => setInputMode('url')}
              >
                Image URL
              </button>
            </div>

            {/* Shape Selection */}
            {inputMode === 'shape' && (
              <div className="shape-selection">
                <h3>Select a 3D Shape</h3>
                <div className="shape-grid">
                  {(Object.keys(shapeDescriptions) as SimpleShape[]).map((shape) => (
                    <button
                      key={shape}
                      className={`shape-button ${selectedShape === shape ? 'selected' : ''}`}
                      onClick={() => handleShapeSelect(shape)}
                    >
                      <div className="shape-name">{shape.charAt(0).toUpperCase() + shape.slice(1)}</div>
                      <div className="shape-description">{shapeDescriptions[shape]}</div>
                    </button>
                  ))}
                </div>
                {selectedShape && (
                  <div className="selected-shape-info">
                    <strong>Selected:</strong> {shapeDescriptions[selectedShape]}
                  </div>
                )}
              </div>
            )}

            {/* File Upload */}
            {inputMode === 'file' && (
              <div className="input-options">
                <div
                  className="file-upload-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <p>Drag & drop an image here, or</p>
                  <button onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* URL Input */}
            {inputMode === 'url' && (
              <div className="input-options">
                <div className="url-input">
                  <p>Provide an image URL</p>
                  <input
                    type="text"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlLoad()}
                  />
                  <button onClick={handleUrlLoad} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Load'}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </section>

          {/* Preview Section - only show for images */}
          {inputMode !== 'shape' && (
            <section className="preview-section">
              <h2>Original Image Preview</h2>
              <div className="image-preview-placeholder">
                {isLoading ? (
                  <p>Loading...</p>
                ) : selectedImage ? (
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Selected"
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <p>Your image will appear here</p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="container">
          <section className="controls-section">
            <h2>2. Configure & Generate</h2>

            <div className="viewing-mode-selection">
              <h3>Viewing Mode</h3>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="parallel"
                    checked={viewingMode === 'parallel'}
                    onChange={(e) => setViewingMode(e.target.value as 'parallel' | 'cross-eyed')}
                  />
                  <span>Parallel Eyes (Wall-eyed)</span>
                  <small>Look through the image as if focusing on something far behind it</small>
                </label>
                <label>
                  <input
                    type="radio"
                    value="cross-eyed"
                    checked={viewingMode === 'cross-eyed'}
                    onChange={(e) => setViewingMode(e.target.value as 'parallel' | 'cross-eyed')}
                  />
                  <span>Cross-eyed</span>
                  <small>Cross your eyes slightly as if looking at something close in front of the image</small>
                </label>
              </div>
            </div>

            <div className="alignment-frame-option">
              <label>
                <input
                  type="checkbox"
                  checked={showAlignmentFrame}
                  onChange={(e) => setShowAlignmentFrame(e.target.checked)}
                />
                Show alignment frames (recommended for beginners)
              </label>
            </div>

            <div className="advanced-controls">
              <button
                className="toggle-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="advanced-settings">
                  <div className="setting">
                    <label>
                      Eye Separation: {eyeSeparation}px
                      <input
                        type="range"
                        min="30"
                        max="120"
                        value={eyeSeparation}
                        onChange={(e) => setEyeSeparation(Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="setting">
                    <label>
                      Depth Scale: {depthScale.toFixed(2)}
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.1"
                        value={depthScale}
                        onChange={(e) => setDepthScale(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              className="generate-button"
              onClick={handleGenerateStereogram}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? 'Generating...' : `Generate ${viewingMode === 'parallel' ? 'Parallel' : 'Cross-eyed'} Stereogram`}
            </button>
          </section>

          <section className="output-section">
            <h2>Generated Stereogram</h2>
            <div className="image-preview-placeholder">
              {isGenerating ? (
                <p>Generating stereogram...</p>
              ) : generatedStereogram ? (
                <img
                  src={generatedStereogram}
                  alt="Generated Stereogram"
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : (
                <p>Your stereogram will appear here</p>
              )}
            </div>
            <button
              onClick={handleDownload}
              disabled={!generatedStereogram}
              className="download-button"
            >
              Download Stereogram
            </button>
          </section>
        </div>

        {/* Viewing Instructions */}
        <div className="container">
          <section className="instructions-section">
            <h2>How to View Stereograms</h2>
            <div className="instructions">
              <div className="instruction-method">
                <h3>Parallel Viewing (Wall-eyed)</h3>
                <ol>
                  <li>Hold the image at arm's length</li>
                  <li>Look through the image as if focusing on something far behind it</li>
                  <li>Relax your eyes and let them diverge slightly</li>
                  <li>The alignment frames should merge into three frames</li>
                  <li>Once aligned, the 3D image will appear in the center</li>
                </ol>
              </div>
              <div className="instruction-method">
                <h3>Cross-eyed Viewing</h3>
                <ol>
                  <li>Hold the image close to your face</li>
                  <li>Cross your eyes slightly as if looking at your finger held close to your nose</li>
                  <li>Slowly move the image away while maintaining the cross-eyed focus</li>
                  <li>The alignment frames should overlap</li>
                  <li>The 3D image will emerge when properly focused</li>
                </ol>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
