export interface StereogramOptions {
    width?: number;
    height?: number;
    eyeSeparation?: number;
    depthScale?: number;
    dotSize?: number;
    viewingMode?: 'parallel' | 'cross-eyed';
    showAlignmentFrame?: boolean;
    alignmentType?: 'frames' | 'dots';
    colorDisparity?: number; // 0.0 to 1.0, controls color variation
}

export type SimpleShape = 'sphere' | 'cube' | 'pyramid' | 'cylinder' | 'torus' | 'cone';

export class StereogramGenerator {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private patternWidth: number = 0;
    private isShapeDepthMap: boolean = false;

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
            showAlignmentFrame = true,
            alignmentType = 'dots',
            colorDisparity = 0.3
        } = options;

        this.canvas.width = width;
        this.canvas.height = height;

        this.isShapeDepthMap = false;
        const depthMap = this.createDepthMap(imageElement, width, height);
        this.generateStereogram(depthMap, width, height, eyeSeparation, depthScale, viewingMode, colorDisparity);

        if (showAlignmentFrame) {
            if (alignmentType === 'frames') {
                this.addAlignment3DCubes(width, height);
            } else {
                this.addAlignmentDots(width, height);
            }
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
            showAlignmentFrame = true,
            alignmentType = 'dots',
            colorDisparity = 0.8
        } = options;

        this.canvas.width = width;
        this.canvas.height = height;

        this.isShapeDepthMap = true;
        const depthMap = this.createShapeDepthMap(shape, width, height);
        this.generateStereogram(depthMap, width, height, eyeSeparation, depthScale, viewingMode, colorDisparity);
        this.isShapeDepthMap = false;

        if (showAlignmentFrame) {
            if (alignmentType === 'frames') {
                this.addAlignment3DCubes(width, height, viewingMode);
            } else {
                this.addAlignmentDots(width, height);
            }
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
                            // Create smooth sphere with lighting
                            const sphereDepth = Math.sqrt(1 - normalizedDistance * normalizedDistance);
                            // Add directional lighting (light from top-left)
                            const lightX = -0.5;
                            const lightY = -0.5;
                            const lightZ = 1.0;

                            // Calculate surface normal for sphere
                            const normalX = dx / size;
                            const normalY = dy / size;
                            const normalZ = sphereDepth;

                            // Calculate lighting
                            const lightDot = Math.max(0, normalX * lightX + normalY * lightY + normalZ * lightZ);
                            depth = sphereDepth * (0.3 + 0.7 * lightDot);
                        }
                        break;

                    case 'cube':
                        const cubeSize = size * 0.8;
                        if (Math.abs(dx) <= cubeSize && Math.abs(dy) <= cubeSize) {
                            // Create Rubik's cube faces with different colors/depths
                            const faceSize = cubeSize / 3;
                            const faceX = Math.floor((dx + cubeSize) / faceSize);
                            const faceY = Math.floor((dy + cubeSize) / faceSize);

                            // Create different colored faces
                            const faceIndex = (faceX * 3 + faceY) % 6;
                            const faceColors = [
                                0.9, // White face
                                0.8, // Yellow face
                                0.7, // Red face
                                0.6, // Orange face
                                0.5, // Green face
                                0.4  // Blue face
                            ];

                            depth = faceColors[faceIndex];

                            // Add edge effects for cube structure
                            const edgeDistX = Math.abs((dx + cubeSize) % faceSize - faceSize / 2);
                            const edgeDistY = Math.abs((dy + cubeSize) % faceSize - faceSize / 2);
                            if (edgeDistX < 2 || edgeDistY < 2) {
                                depth = Math.min(1, depth + 0.1); // Raised edges
                            }
                        }
                        break;

                    case 'pyramid':
                        const pyramidBase = size;
                        if (Math.abs(dx) <= pyramidBase && Math.abs(dy) <= pyramidBase) {
                            const distanceFromCenter = Math.max(Math.abs(dx), Math.abs(dy));
                            const heightFactor = 1 - (distanceFromCenter / pyramidBase);

                            // Add stepped pyramid effect
                            const steps = 5;
                            const stepHeight = heightFactor * steps;
                            const steppedHeight = Math.floor(stepHeight) / steps;

                            // Add directional shading
                            const shadingFactor = (dx + pyramidBase) / (2 * pyramidBase);
                            depth = Math.max(0, steppedHeight * (0.4 + 0.6 * shadingFactor));
                        }
                        break;

                    case 'cylinder':
                        if (distance <= size) {
                            // Cylindrical shading based on horizontal position
                            const cylinderShading = Math.abs(dx) / size;
                            depth = 0.8 * (1 - cylinderShading * 0.5);
                        }
                        break;

                    case 'torus':
                        const torusRadius = size * 0.7;
                        const tubeRadius = size * 0.3;
                        const torusDistance = Math.abs(distance - torusRadius);
                        if (torusDistance <= tubeRadius) {
                            const tubeDepth = Math.sqrt(1 - (torusDistance / tubeRadius) ** 2);

                            // Add torus shading
                            const angle = Math.atan2(dy, dx);
                            const torusShading = (Math.sin(angle) + 1) / 2;
                            depth = tubeDepth * (0.4 + 0.4 * torusShading);
                        }
                        break;

                    case 'cone':
                        if (distance <= size) {
                            const coneHeight = 1 - (distance / size);

                            // Add directional shading for cone
                            const angle = Math.atan2(dy, dx);
                            const coneShading = (Math.cos(angle - Math.PI / 4) + 1) / 2;
                            depth = Math.max(0, coneHeight * (0.3 + 0.5 * coneShading));
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
        viewingMode: 'parallel' | 'cross-eyed',
        colorDisparity: number
    ): void {
        // Pattern width should be related to eye separation
        this.patternWidth = Math.round(eyeSeparation * 1.2);

        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        // First, create a base color map from the depth map
        const baseColorMap: Array<Array<{r: number, g: number, b: number}>> = [];
        for (let y = 0; y < height; y++) {
          baseColorMap[y] = [];
          for (let x = 0; x < width; x++) {
            const depth = depthMap[y][x];
            // Convert depth to grayscale, then add color variation
            const baseIntensity = Math.floor(depth * 255);
            baseColorMap[y][x] = {
              r: baseIntensity,
              g: baseIntensity,
              b: baseIntensity
            };
          }
        }

        // Create colored base map for shapes
        if (this.isShapeDepthMap) {
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const depth = depthMap[y][x];
              // For shapes, create more interesting base colors
              baseColorMap[y][x] = this.getShapeColor(x - width/2, y - height/2, depth, width, height);
            }
          }
        }

        // Process each row independently
        for (let y = 0; y < height; y++) {
            // Create array to store the final pixel values for this row
            const row = new Array(width);

            // Initialize with base colors plus random variation
            for (let x = 0; x < width; x++) {
                const baseColor = baseColorMap[y][x];

                if (colorDisparity === 0) {
                  // No disparity - use original colors
                  row[x] = {
                    r: baseColor.r,
                    g: baseColor.g,
                    b: baseColor.b
                  };
                } else {
                  // Add random variation based on color disparity
                  const randomR = Math.floor(Math.random() * 256);
                  const randomG = Math.floor(Math.random() * 256);
                  const randomB = Math.floor(Math.random() * 256);

                  // Blend base color with random color based on disparity
                  row[x] = {
                    r: Math.floor(baseColor.r * (1 - colorDisparity) + randomR * colorDisparity),
                    g: Math.floor(baseColor.g * (1 - colorDisparity) + randomG * colorDisparity),
                    b: Math.floor(baseColor.b * (1 - colorDisparity) + randomB * colorDisparity)
                  };
                }
            }

            // Apply stereogram constraints from left to right
            for (let x = 0; x < width; x++) {
                const depth = depthMap[y][x];

                // If eye separation is 0, skip stereogram effect
                if (eyeSeparation === 0) {
                  continue;
                }

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
                        b: row[x].b,
                    };
                }
            }

            // Apply the row to the image data
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                data[index] = row[x].r; // R
                data[index + 1] = row[x].g; // G
                data[index + 2] = row[x].b; // B
                data[index + 3] = 255; // A
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    private addAlignmentDots(width: number, height: number): void {
        const dotRadius = 8;
        const dotY = 20;

        // Position dots based on pattern width
        const centerX = width / 2;
        const leftDotX = centerX - this.patternWidth / 2;
        const rightDotX = centerX + this.patternWidth / 2;

        // Draw dots with high contrast
        this.ctx.fillStyle = '#FF0000';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;

        // Left dot
        this.ctx.beginPath();
        this.ctx.arc(leftDotX, dotY, dotRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        // Right dot
        this.ctx.beginPath();
        this.ctx.arc(rightDotX, dotY, dotRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        // Add instruction text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';

        const instructionText = `Align these dots (${this.patternWidth}px apart)`;
        this.ctx.strokeText(instructionText, width / 2, dotY + 30);
        this.ctx.fillText(instructionText, width / 2, dotY + 30);
    }

    private addAlignment3DCubes(width: number, height: number, viewingMode: 'parallel' | 'cross-eyed'): void {
        const cubeSize = 20;
        const cubeY = 30;

        // Position cubes based on pattern width
        const centerX = width / 2;
        const leftCubeX = centerX - this.patternWidth / 2;
        const rightCubeX = centerX + this.patternWidth / 2;

        // Draw 3D cubes with different perspectives for each eye
        this.draw3DCube(leftCubeX, cubeY, cubeSize, 'left', viewingMode);
        this.draw3DCube(rightCubeX, cubeY, cubeSize, 'right', viewingMode);

        // Add instruction text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';

        const instructionText = `Align these cubes (${this.patternWidth}px apart)`;
        this.ctx.strokeText(instructionText, width / 2, cubeY + cubeSize + 30);
        this.ctx.fillText(instructionText, width / 2, cubeY + cubeSize + 30);
    }

    private draw3DCube(x: number, y: number, size: number, eye: 'left' | 'right', viewingMode: 'parallel' | 'cross-eyed'): void {
        // Calculate perspective offset based on eye and viewing mode
        let perspectiveOffset = eye === 'left' ? -2 : 2;
        if (viewingMode === 'cross-eyed') {
            perspectiveOffset = -perspectiveOffset;
        }

        // Define cube vertices in 3D space
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // back face
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]      // front face
        ];

        // Project 3D vertices to 2D with perspective
        const projected = vertices.map(([vx, vy, vz]) => {
            const scale = size / 2;
            const perspective = 1 / (1 + vz * 0.1);
            return [
                x + (vx + perspectiveOffset * 0.1) * scale * perspective,
                y + vy * scale * perspective
            ];
        });

        // Draw cube faces
        this.ctx.lineWidth = 2;

        // Back face (darker)
        this.ctx.fillStyle = '#666666';
        this.ctx.strokeStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.moveTo(projected[0][0], projected[0][1]);
        this.ctx.lineTo(projected[1][0], projected[1][1]);
        this.ctx.lineTo(projected[2][0], projected[2][1]);
        this.ctx.lineTo(projected[3][0], projected[3][1]);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Right face (medium)
        this.ctx.fillStyle = '#999999';
        this.ctx.strokeStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.moveTo(projected[1][0], projected[1][1]);
        this.ctx.lineTo(projected[5][0], projected[5][1]);
        this.ctx.lineTo(projected[6][0], projected[6][1]);
        this.ctx.lineTo(projected[2][0], projected[2][1]);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Top face (lightest)
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.strokeStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.moveTo(projected[3][0], projected[3][1]);
        this.ctx.lineTo(projected[2][0], projected[2][1]);
        this.ctx.lineTo(projected[6][0], projected[6][1]);
        this.ctx.lineTo(projected[7][0], projected[7][1]);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    private getShapeColor(dx: number, dy: number, depth: number, width: number, height: number): {r: number, g: number, b: number} {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const size = Math.min(width, height) * 0.25;

        // Default background
        if (depth === 0) {
          return {r: 50, g: 50, b: 50};
        }

        // For sphere - gradient from blue to white
        if (distance <= size) {
          const intensity = Math.floor(depth * 255);
          return {
            r: Math.floor(100 + intensity * 0.6),
            g: Math.floor(150 + intensity * 0.4),
            b: Math.floor(200 + intensity * 0.2)
          };
        }

        // For cube faces - use the depth to determine color
        const colorIntensity = Math.floor(depth * 255);
        return {
          r: colorIntensity,
          g: colorIntensity * 0.8,
          b: colorIntensity * 0.6
        };
      }
}
