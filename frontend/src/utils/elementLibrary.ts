/**
 * Element & Shape Insertion Library
 * Converts primitives and SVG vectors into Fabric.js canvas objects with proper
 * scaling, positioning at center stage, and initial property normalization.
 */

import { fabric } from 'fabric';
import { generateObjectId } from './canvasJson';
import type { ElementItem } from './elementsData';
import type { ArtworkItem } from './artworkData';

export interface InsertOptions {
  themeColor?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Inserts a geometric element or vector shape onto the Fabric canvas.
 */
export function insertElementToCanvas(
  canvas: fabric.Canvas,
  element: ElementItem,
  options: InsertOptions = {}
): Promise<fabric.Object | null> {
  const cWidth = options.canvasWidth || 1050;
  const cHeight = options.canvasHeight || 600;
  const color = options.themeColor || element.fill || '#D4AF37';

  return new Promise((resolve) => {
    if (element.type === 'rect') {
      const rect = new fabric.Rect({
        left: cWidth / 2 - (element.width || 200) / 2,
        top: cHeight / 2 - (element.height || 100) / 2,
        width: element.width || 200,
        height: element.height || 100,
        fill: color,
        rx: element.rx || 0,
        ry: element.ry || 0,
        stroke: element.stroke || undefined,
        strokeWidth: element.strokeWidth || 0,
      });

      (rect as any).id = generateObjectId('shape');
      (rect as any).name = element.name;
      (rect as any).assetType = 'shape';

      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      resolve(rect);
    } else if (element.type === 'circle') {
      const radius = (element.width || 120) / 2;
      const circle = new fabric.Circle({
        left: cWidth / 2 - radius,
        top: cHeight / 2 - radius,
        radius,
        fill: color,
      });

      (circle as any).id = generateObjectId('circle');
      (circle as any).name = element.name;
      (circle as any).assetType = 'shape';

      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
      resolve(circle);
    } else if (element.type === 'line') {
      const width = element.width || 300;
      const strokeWidth = element.strokeWidth || 2;
      const line = new fabric.Line([0, 0, width, 0], {
        left: cWidth / 2 - width / 2,
        top: cHeight / 2,
        stroke: color,
        strokeWidth,
      });

      (line as any).id = generateObjectId('line');
      (line as any).name = element.name;
      (line as any).assetType = 'shape';

      canvas.add(line);
      canvas.setActiveObject(line);
      canvas.renderAll();
      resolve(line);
    } else if (element.svg) {
      fabric.loadSVGFromString(element.svg, (objects, opt) => {
        const group = fabric.util.groupSVGElements(objects, opt);
        group.set({
          left: cWidth / 2 - (group.width || 80) / 2,
          top: cHeight / 2 - (group.height || 80) / 2,
        });

        (group as any).id = generateObjectId('badge');
        (group as any).name = element.name;
        (group as any).assetType = 'shape';

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        resolve(group);
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Inserts vector artwork (NFC wave, luxury crest, social icon) onto the canvas.
 */
export function insertArtworkToCanvas(
  canvas: fabric.Canvas,
  artwork: ArtworkItem,
  options: InsertOptions = {}
): Promise<fabric.Object | null> {
  const cWidth = options.canvasWidth || 1050;
  const cHeight = options.canvasHeight || 600;
  const color = options.themeColor || artwork.defaultColor || '#D4AF37';

  // Replace currentColor with actual target color
  const preparedSvg = artwork.svg.replace(/currentColor/g, color);

  return new Promise((resolve) => {
    fabric.loadSVGFromString(preparedSvg, (objects, opt) => {
      const group = fabric.util.groupSVGElements(objects, opt);

      // Scale to reasonable dimension if oversized
      const targetSize = Math.max(artwork.width, artwork.height);
      const currentSize = Math.max(group.width || 1, group.height || 1);
      const scale = targetSize / currentSize;

      group.set({
        left: cWidth / 2 - ((group.width || 1) * scale) / 2,
        top: cHeight / 2 - ((group.height || 1) * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });

      (group as any).id = generateObjectId('artwork');
      (group as any).name = artwork.name;
      (group as any).assetType = 'artwork';
      (group as any).originalColor = color;

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      resolve(group);
    });
  });
}
