import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Stereogram Generator</h1>
      </header>
      <main>
        <div className="container">
          <section className="input-section">
            <h2>1. Choose an Image</h2>
            <div className="input-options">
              <div className="file-upload-zone">
                <p>Drag & drop an image here, or</p>
                <button>Select File</button>
              </div>
              <div className="url-input">
                <p>Or provide a URL</p>
                <input type="text" placeholder="https://example.com/image.png" />
                <button>Load</button>
              </div>
            </div>
          </section>

          <section className="preview-section">
            <h2>Original Image Preview</h2>
            <div className="image-preview-placeholder">
              <p>Your image will appear here</p>
            </div>
          </section>
        </div>

        <div className="container">
          <section className="controls-section">
            <h2>2. Generate</h2>
            <button className="generate-button">Generate Stereogram</button>
            {/* Optional settings panel can go here */}
          </section>

          <section className="output-section">
            <h2>Generated Stereogram</h2>
            <div className="image-preview-placeholder">
              <p>Your stereogram will appear here</p>
            </div>
            <button disabled>Download Stereogram</button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
