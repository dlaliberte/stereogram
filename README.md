# stereogram


# Random Dot Stereogram Generator App Specification

## App Overview

This application allows users to create full-color random dot stereograms from their images. Users can either upload an image file or provide a URL to an image, and the app will generate a stereogram that, when viewed with the proper technique, reveals the original image in full color with 3D depth perception.

## User Interface & Experience

### Main Page Layout

* **Header**: Simple app title "Stereogram Generator"
* **Input Section**: Two options for image input
  * File upload button with drag-and-drop zone
  * Text input field for image URL with "Load" button
* **Preview Section**: Shows the original uploaded/loaded image
* **Generation Controls**:
  * "Generate Stereogram" button
  * Optional settings panel with basic parameters (dot density, separation distance)
* **Output Section**: Displays the generated stereogram
* **Download Section**: Button to download the generated stereogram

### User Flow

#### Image Input

1. User arrives at the main page
2. User chooses between two input methods:
   * **File Upload**: Click upload button or drag image file into designated zone
   * **URL Input**: Paste image URL and click "Load" button
3. Once image is loaded, a preview appears showing the original image
4. Image dimensions and basic info are displayed below the preview

#### Stereogram Generation

1. User clicks "Generate Stereogram" button
2. Loading indicator appears with progress message
3. App processes the image:
   * Analyzes each pixel's color values
   * Creates depth map based on color intensity or user-defined mapping
   * Generates random dot pattern split for left/right eye viewing
   * Maintains original color information in the stereogram pattern
4. Generated stereogram appears in the output section

#### Viewing Instructions

* Built-in instructions panel explaining how to view stereograms
* Tips for proper viewing technique (parallel or cross-eyed viewing)
* Option to toggle between different viewing method instructions

#### Download & Sharing

* Download button to save stereogram as high-quality image file
* Copy link functionality to share the generated stereogram
* Option to save generation settings for future use

### Advanced Features

* **Settings Panel**:
  * Dot size adjustment slider
  * Eye separation distance control
  * Depth intensity modifier
  * Color preservation options
* **Batch Processing**: Upload multiple images for batch stereogram generation
* **Real-time Preview**: Live preview updates as settings are adjusted

## User Interactions & Feedback

### Success States

* Successful image upload shows green checkmark and image preview
* Successful URL load displays the fetched image immediately
* Completed stereogram generation shows success message and result
* Download completion shows confirmation notification

### Error Handling

* Invalid image formats show clear error messages with supported format list
* Broken URLs display "Image not found" with retry option
* Large file uploads show file size warnings with compression options
* Processing failures provide retry button with error explanation

### Loading States

* File upload shows progress bar for large files
* URL loading displays spinner with "Fetching image..." message
* Stereogram generation shows progress indicator with estimated time
* All loading states include cancel option

## 3rd Party Technologies Required

### Image Processing Libraries

* **Sharp or Canvas API**: For server-side image manipulation, pixel analysis, and color processing
* **Image format support**: JPEG, PNG, GIF, WebP handling capabilities

### File Upload Services

* **Multer or similar**: For handling multipart file uploads
* **File validation**: Image format verification and file size limits

### URL Image Fetching

* **HTTP client library**: For fetching images from external URLs
* **Image validation**: Verify fetched content is valid image format

### Stereogram Generation Algorithm

* **Custom stereogram library or implementation**: Core algorithm for creating random dot stereograms
* **Color space conversion**: RGB to depth mapping utilities
* **Pattern generation**: Random dot pattern creation with color preservation

### Image Download/Export

* **File serving capabilities**: For generating downloadable image files
* **Image compression**: Optional quality/size optimization for downloads

The app prioritizes simplicity and immediate results, allowing users to quickly transform their images into engaging stereograms without requiring technical knowledge of the underlying stereogram creation process.
