export interface StereogramOptions {
  width?: number;
  height?: number;
  eyeSeparation?: number;
  depthScale?: number;
  dotSize?: number;
  viewingMode?: 'parallel' | 'cross-eyed';
  showAlignmentFrame?: boolean;
}

export type SimpleShape = 'sphere' | 'cube' | 'pyramid' | 'cylinder' | 'torus' | 'cone';

export class StereogramGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private patternWidth: number = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateFromImage(
    imageElement: HTMLImageElement,
    options: StereogramOptions = {}
  ): Promise<string> {
    const {
      width = 800,
      height = 600,
      eyeSeparation = 60,
      depthScale = 0.3,
      dotSize = 2,
      viewingMode = 'parallel',
      showAlignmentFrame = true
    } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    const depthMap = this.createDepthMap(imageElement, width, height);
    this.generateStereogram(depthMap, width, height, eyeSeparation, depthScale, viewingMode);

    if (showAlignmentFrame) {
      this.addAlignmentFrame(width, height);
    }

    return this.canvas.toDataURL('image/png');
  }

  async generateFromShape(
    shape: SimpleShape,
    options: StereogramOptions = {}
  ): Promise<string> {
    const {
      width = 800,
      height = 600,
      eyeSeparation = 60,
      depthScale = 0.3,
      dotSize = 2,
      viewingMode = 'parallel',
      showAlignmentFrame = true
    } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    const depthMap = this.createShapeDepthMap(shape, width, height);
    this.generateStereogram(depthMap, width, height, eyeSeparation, depthScale, viewingMode);

    if (showAlignmentFrame) {
      this.addAlignmentFrame(width, height);
    }

    return this.canvas.toDataURL('image/png');
  }

  private createDepthMap(img: HTMLImageElement, width: number, height: number): number[][] {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = width;
    tempCanvas.height = height;

    tempCtx.drawImage(img, 0, 0, width, height);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const depthMap: number[][] = [];
    for (let y = 0; y < height; y++) {
      depthMap[y] = [];
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        const brightness = (r + g + b) / 3;
        depthMap[y][x] = brightness / 255;
      }
    }

    return depthMap;
  }

  private createShapeDepthMap(shape: SimpleShape, width: number, height: number): number[][] {
    const depthMap: number[][] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.25;

    // Initialize with background depth
    for (let y = 0; y < height; y++) {
      depthMap[y] = [];
      for (let x = 0; x < width; x++) {
        depthMap[y][x] = 0.0; // Background depth
      }
    }

    // Draw shape with varying depth
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let depth = 0.0; // Default background depth

        switch (shape) {
          case 'sphere':
            if (distance <= size) {
              const normalizedDistance = distance / size;
              // Create sphere with smooth depth gradient
              const sphereDepth = Math.sqrt(1 - normalizedDistance * normalizedDistance);
              depth = sphereDepth;
            }
            break;

          case 'cube':
            const cubeSize = size * 0.8;
            if (Math.abs(dx) <= cubeSize && Math.abs(dy) <= cubeSize) {
              depth = 0.8;
            }
            break;

          case 'pyramid':
            const pyramidBase = size;
            if (Math.abs(dx) <= pyramidBase && Math.abs(dy) <= pyramidBase) {
              const distanceFromCenter = Math.max(Math.abs(dx), Math.abs(dy));
              const heightFactor = 1 - (distanceFromCenter / pyramidBase);
              depth = Math.max(0, heightFactor);
            }
            break;

          case 'cylinder':
            if (distance <= size) {
              depth = 0.8;
            }
            break;

          case 'torus':
            const torusRadius = size * 0.7;
            const tubeRadius = size * 0.3;
            const torusDistance = Math.abs(distance - torusRadius);
            if (torusDistance <= tubeRadius) {
              const tubeDepth = Math.sqrt(1 - (torusDistance / tubeRadius) ** 2);
              depth = tubeDepth * 0.8;
            }
            break;

          case 'cone':
            if (distance <= size) {
              const coneHeight = 1 - (distance / size);
              depth = Math.max(0, coneHeight);
            }
            break;
        }

        depthMap[y][x] = Math.min(1, Math.max(0, depth));
      }
    }

    return depthMap;
  }

  private generateStereogram(
    depthMap: number[][],
    width: number,
    height: number,
    eyeSeparation: number,
    depthScale: number,
    viewingMode: 'parallel' | 'cross-eyed'
  ): void {
    // Pattern width should be related to eye separation
    this.patternWidth = Math.round(eyeSeparation * 1.2);

    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Process each row independently
    for (let y = 0; y < height; y++) {
      // Create array to store the final pixel values for this row
      const row = new Array(width);

      // Initialize with random values
      for (let x = 0; x < width; x++) {
        row[x] = {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256)
        };
      }

      // Apply stereogram constraints from left to right
      for (let x = 0; x < width; x++) {
        const depth = depthMap[y][x];

        // Calculate the separation distance for this depth
        let separation = this.patternWidth + Math.round(depth * depthScale * eyeSeparation);

        // For cross-eyed viewing, use negative separation
        if (viewingMode === 'cross-eyed') {
          separation = this.patternWidth - Math.round(depth * depthScale * eyeSeparation);
        }

        // Ensure separation is within reasonable bounds
        separation = Math.max(10, Math.min(width - x - 1, separation));

        // Create constraint: pixel at x should match pixel at x + separation
        const constraintX = x + separation;
        if (constraintX < width) {
          // Make the pixels match
          row[constraintX] = {
            r: row[x].r,
            g: row[x].g,
            b: row[x].b
          };
        }
      }

      // Apply the row to the image data
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        data[index] = row[x].r;     // R
        data[index + 1] = row[x].g; // G
        data[index + 2] = row[x].b; // B
        data[index + 3] = 255;      // A
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private addAlignmentFrame(width: number, height: number): void {
    const frameThickness = 3;
    const frameMargin = 30;

    // Frame dimensions
    const frameWidth = 40;
    const frameHeight = height - (frameMargin * 2);

    // Position frames based on the pattern width
    // They should be separated by exactly the pattern width
    const centerX = width / 2;
    const leftFrameX = centerX - this.patternWidth / 2 - frameWidth / 2;
    const rightFrameX = centerX + this.patternWidth / 2 - frameWidth / 2;
    const frameY = frameMargin;

    // Ensure frames are within bounds
    const minX = 10;
    const maxX = width - frameWidth - 10;

    const finalLeftX = Math.max(minX, Math.min(maxX, leftFrameX));
    const finalRightX = Math.max(minX, Math.min(maxX, rightFrameX));

    // Draw frames
    this.drawFrame(finalLeftX, frameY, frameWidth, frameHeight, frameThickness);
    this.drawFrame(finalRightX, frameY, frameWidth, frameHeight, frameThickness);

    // Add instruction text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';

    const instructionY = frameY + frameHeight + 25;
    const actualSeparation = Math.round(finalRightX - finalLeftX + frameWidth);
    const instructionText = `Align these frames (pattern: ${this.patternWidth}px, separation: ${actualSeparation}px)`;

    // Draw text with outline for visibility
    this.ctx.strokeText(instructionText, width / 2, instructionY);
    this.ctx.fillText(instructionText, width / 2, instructionY);
  }

  private drawFrame(x: number, y: number, width: number, height: number, thickness: number): void {
    // Draw red frame
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = thickness;
    this.ctx.strokeRect(x, y, width, height);

    // Add white corner markers for better visibility
    const cornerSize = 12;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = thickness + 1;

    // Top-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + cornerSize);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x + cornerSize, y);
    this.ctx.stroke();

    // Top-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - cornerSize, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.lineTo(x + width, y + cornerSize);
    this.ctx.stroke();

    // Bottom-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + height - cornerSize);
    this.ctx.lineTo(x, y + height);
    this.ctx.lineTo(x + cornerSize, y + height);
    this.ctx.stroke();

    // Bottom-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(x + width - cornerSize, y + height);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.lineTo(x + width, y + height - cornerSize);
    this.ctx.stroke();
  }
}
