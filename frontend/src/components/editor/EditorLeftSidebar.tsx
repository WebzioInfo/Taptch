/**
 * EditorLeftSidebar - Multi-Tab Studio Tool Palette
 * Provides 7 specialized tabs:
 * 1. Templates (Full card starter compositions)
 * 2. Text (Heading, Subheading, Body, Font Catalog)
 * 3. Uploads (Direct signed image uploads & asset library)
 * 4. Background (Canvas solid backgrounds & theme palettes)
 * 5. Elements (Geometric shapes, badges & dividers)
 * 6. Artwork (NFC waves, luxury crests & Iconify live vector search)
 * 7. Layers (Z-index tree, visibility, locking, reordering, duplication & deletion)
 */

import React, { useState } from 'react';
import { fabric } from 'fabric';
import {
  LayoutTemplate,
  Type,
  Upload,
  Palette,
  Shapes,
  Sparkles,
  Layers,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from './useEditorStore';
import { FONT_CATALOG, loadGoogleFont } from '../../utils/fontLoader';
import { ELEMENTS_COLLECTION } from '../../utils/elementsData';
import { ARTWORK_COLLECTION } from '../../utils/artworkData';
import { insertElementToCanvas, insertArtworkToCanvas } from '../../utils/elementLibrary';
import { searchIconifyIcons, fetchIconifySvg, IconifyResult } from '../../utils/iconifyService';
import { uploadToCloudinaryAndPersist, UploadedAsset } from '../../utils/cloudinaryDirectUpload';
import { generateObjectId } from '../../utils/canvasJson';

interface EditorLeftSidebarProps {
  templates?: any[];
  product?: any;
  onApplyTemplate?: (template: any) => void;
}

type TabType = 'templates' | 'text' | 'uploads' | 'background' | 'elements' | 'artwork' | 'layers';

export const EditorLeftSidebar: React.FC<EditorLeftSidebarProps> = ({
  templates = [],
  product,
  onApplyTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');

  const {
    canvas,
    pushHistory,
    syncSelectedProps,
    selectedObjectId,
  } = useEditorStore();

  // Typography search
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<string>('all');

  // Iconify search state
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<IconifyResult[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);

  // Uploads state
  const [userAssets, setUserAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Background colors
  const BG_PALETTES = [
    '#0A0A0C', // Deep Obsidian
    '#121216', // Charcoal
    '#18181D', // Matte Slate
    '#0B1220', // Midnight Navy
    '#1A1A24', // Deep Royal
    '#201A18', // Espresso
    '#FAF8F5', // Warm Ivory
    '#ECEEF2', // Editorial Gray
    '#FFFFFF', // Clean White
    '#D4AF37', // Brushed Gold
  ];

  // Insert Text Presets
  const handleAddText = async (preset: 'heading' | 'subheading' | 'body') => {
    if (!canvas) return;

    let fontSize = 32;
    let fontWeight: any = '700';
    let defaultText = 'Heading';
    let charSpacing = 40;

    if (preset === 'subheading') {
      fontSize = 20;
      fontWeight = '600';
      defaultText = 'Subheading or Role';
      charSpacing = 20;
    } else if (preset === 'body') {
      fontSize = 14;
      fontWeight = '400';
      defaultText = 'contact@example.com';
      charSpacing = 0;
    }

    const textObj = new fabric.IText(defaultText, {
      left: 1050 / 2 - 120,
      top: 600 / 2 - fontSize / 2,
      fontFamily: 'Inter',
      fontSize,
      fontWeight,
      fill: '#FFFFFF',
      charSpacing,
      styles: {},
    });

    (textObj as any).id = generateObjectId('text');
    (textObj as any).name = defaultText;
    (textObj as any).assetType = 'text';

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    syncSelectedProps();
    pushHistory();
  };

  // Insert font specimen
  const handleSelectFont = async (fontFamily: string) => {
    await loadGoogleFont(fontFamily);
    if (!canvas) return;

    const activeObj = canvas.getActiveObject() as any;
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      activeObj.set('fontFamily', fontFamily);
      activeObj.setCoords();
      canvas.requestRenderAll();
      syncSelectedProps();
      pushHistory();
    } else {
      // Insert new sample
      const textObj = new fabric.IText(fontFamily, {
        left: 1050 / 2 - 100,
        top: 600 / 2 - 20,
        fontFamily,
        fontSize: 28,
        fontWeight: '600',
        fill: '#D4AF37',
        styles: {},
      });
      (textObj as any).id = generateObjectId('text');
      (textObj as any).name = fontFamily;
      (textObj as any).assetType = 'text';

      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();
      syncSelectedProps();
      pushHistory();
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const asset = await uploadToCloudinaryAndPersist(file);
      setUserAssets((prev) => [asset, ...prev]);

      // Automatically insert uploaded image onto canvas
      if (canvas && asset.url) {
        fabric.Image.fromURL(
          asset.url,
          (img) => {
            const maxDim = 240;
            const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
            img.set({
              left: 1050 / 2 - ((img.width || 1) * scale) / 2,
              top: 600 / 2 - ((img.height || 1) * scale) / 2,
              scaleX: scale,
              scaleY: scale,
            });

            (img as any).id = generateObjectId('img');
            (img as any).name = asset.originalName || 'Uploaded Logo';
            (img as any).assetType = 'brand';

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            syncSelectedProps();
            pushHistory();
          },
          { crossOrigin: 'anonymous' }
        );
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Iconify search query
  const handleSearchIcons = async (q: string) => {
    setIconSearch(q);
    if (!q || q.length < 2) {
      setIconResults([]);
      return;
    }

    setIsSearchingIcons(true);
    const results = await searchIconifyIcons(q, 30);
    setIconResults(results);
    setIsSearchingIcons(false);
  };

  // Insert Iconify icon
  const handleInsertIconify = async (icon: IconifyResult) => {
    if (!canvas) return;
    const svgStr = await fetchIconifySvg(icon.fullName);
    if (!svgStr) return;

    fabric.loadSVGFromString(svgStr, (objects, opt) => {
      const group = fabric.util.groupSVGElements(objects, opt);
      const targetSize = 48;
      const currentSize = Math.max(group.width || 1, group.height || 1);
      const scale = targetSize / currentSize;

      group.set({
        left: 1050 / 2 - (targetSize / 2),
        top: 600 / 2 - (targetSize / 2),
        scaleX: scale,
        scaleY: scale,
      });

      (group as any).id = generateObjectId('icon');
      (group as any).name = icon.name;
      (group as any).assetType = 'brand';

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      syncSelectedProps();
      pushHistory();
    });
  };

  // Layer Operations
  const canvasObjects = canvas ? canvas.getObjects().slice().reverse() : [];

  const handleSelectLayer = (obj: fabric.Object) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.renderAll();
    syncSelectedProps();
  };

  const handleToggleLock = (obj: any) => {
    if (!canvas) return;
    const isLocked = !obj.isLocked;
    obj.set({
      isLocked,
      lockMovementX: isLocked,
      lockMovementY: isLocked,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      hasControls: !isLocked,
    });
    canvas.requestRenderAll();
    syncSelectedProps();
    pushHistory();
  };

  const handleToggleVisibility = (obj: any) => {
    if (!canvas) return;
    obj.set('visible', !obj.visible);
    canvas.requestRenderAll();
    pushHistory();
  };

  const handleReorderLayer = (obj: fabric.Object, direction: 'up' | 'down') => {
    if (!canvas) return;
    if (direction === 'up') {
      canvas.bringForward(obj);
    } else {
      canvas.sendBackwards(obj);
    }
    canvas.requestRenderAll();
    pushHistory();
  };

  const handleDuplicateLayer = (obj: any) => {
    if (!canvas) return;
    obj.clone((cloned: any) => {
      cloned.set({
        left: (obj.left || 0) + 20,
        top: (obj.top || 0) + 20,
      });
      cloned.id = generateObjectId(obj.type || 'layer');
      cloned.name = `${obj.name || 'Layer'} (Copy)`;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      syncSelectedProps();
      pushHistory();
    });
  };

  const handleDeleteLayer = (obj: fabric.Object) => {
    if (!canvas) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelectedProps();
    pushHistory();
  };

  return (
    <aside className="w-80 border-r border-[#23232A] bg-[#0A0A0C] flex flex-col z-10 select-none overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-around border-b border-[#23232A] bg-[#121216] px-1 py-1">
        {[
          { id: 'templates', label: 'Layouts', icon: LayoutTemplate },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'uploads', label: 'Uploads', icon: Upload },
          { id: 'background', label: 'Color', icon: Palette },
          { id: 'elements', label: 'Shapes', icon: Shapes },
          { id: 'artwork', label: 'Artwork', icon: Sparkles },
          { id: 'layers', label: 'Layers', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center py-2 px-2 rounded-lg text-[10px] font-medium transition-all ${isActive
                  ? 'bg-[#18181D] text-[#D4AF37] shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-[#18181D]/50'
                }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white">
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Card Templates</h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => onApplyTemplate && onApplyTemplate(tpl)}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border border-[#23232A] hover:border-[#D4AF37] transition-all bg-[#121216]"
                >
                  <img
                    src={tpl.previewUrl || tpl.thumbnailUrl || '/branding/cards/default-card-preview.png'}
                    alt={tpl.name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate text-white">{tpl.name}</p>
                    <p className="text-[10px] text-neutral-400 capitalize">{tpl.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Typography Presets</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleAddText('heading')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-left text-base font-bold text-white transition-colors flex items-center justify-between"
              >
                <span>Add Heading</span>
                <Plus className="w-4 h-4 text-neutral-400" />
              </button>
              <button
                onClick={() => handleAddText('subheading')}
                className="w-full py-2 px-3 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-left text-sm font-semibold text-neutral-200 transition-colors flex items-center justify-between"
              >
                <span>Add Subheading</span>
                <Plus className="w-4 h-4 text-neutral-400" />
              </button>
              <button
                onClick={() => handleAddText('body')}
                className="w-full py-1.5 px-3 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] text-left text-xs text-neutral-300 transition-colors flex items-center justify-between"
              >
                <span>Add Body / Contact</span>
                <Plus className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <hr className="border-[#23232A]" />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-400">Curated Typefaces (40+)</h4>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full bg-[#121216] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 border border-[#23232A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Font Categories */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
                {['all', 'sans-serif', 'serif', 'display', 'monospace', 'handwriting'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFontCategory(cat)}
                    className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${fontCategory === cat
                        ? 'bg-[#D4AF37] text-black font-semibold'
                        : 'bg-[#18181D] text-neutral-400 hover:text-white'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Font List */}
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {FONT_CATALOG.filter(
                  (f) =>
                    (fontCategory === 'all' || f.category === fontCategory) &&
                    f.family.toLowerCase().includes(fontSearch.toLowerCase())
                ).map((f) => (
                  <button
                    key={f.family}
                    onClick={() => handleSelectFont(f.family)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-transparent hover:border-[#23232A] flex items-center justify-between text-left text-xs transition-colors"
                  >
                    <span style={{ fontFamily: f.family }}>{f.family}</span>
                    <span className="text-[10px] text-neutral-400 capitalize">{f.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UPLOADS */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Upload Media</h3>

            <label className="border-2 border-dashed border-[#23232A] hover:border-[#D4AF37] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#121216]/50">
              <Upload className="w-6 h-6 text-[#D4AF37] mb-2" />
              <span className="text-xs font-medium text-white">Click to upload logo or image</span>
              <span className="text-[10px] text-neutral-400 mt-1">PNG, JPG, WEBP, SVG (Max 15MB)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {isUploading && (
              <div className="flex items-center space-x-2 text-xs text-[#D4AF37]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading directly to Cloudinary...</span>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/50">
                {uploadError}
              </p>
            )}

            {userAssets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-400">Your Uploads</h4>
                <div className="grid grid-cols-3 gap-2">
                  {userAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        if (!canvas) return;
                        fabric.Image.fromURL(
                          asset.url,
                          (img) => {
                            const maxDim = 200;
                            const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
                            img.set({
                              left: 1050 / 2 - ((img.width || 1) * scale) / 2,
                              top: 600 / 2 - ((img.height || 1) * scale) / 2,
                              scaleX: scale,
                              scaleY: scale,
                            });
                            (img as any).id = generateObjectId('img');
                            (img as any).name = asset.originalName || 'Image';
                            (img as any).assetType = 'brand';
                            canvas.add(img);
                            canvas.setActiveObject(img);
                            canvas.renderAll();
                            syncSelectedProps();
                            pushHistory();
                          },
                          { crossOrigin: 'anonymous' }
                        );
                      }}
                      className="cursor-pointer border border-[#23232A] hover:border-[#D4AF37] rounded-lg p-1 bg-[#121216] transition-colors"
                    >
                      <img src={asset.url} alt={asset.originalName} className="w-full h-16 object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BACKGROUND */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Card Base Color</h3>
            <div className="grid grid-cols-5 gap-2">
              {BG_PALETTES.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    if (!canvas) return;
                    canvas.backgroundColor = color;
                    canvas.requestRenderAll();
                    pushHistory();
                  }}
                  className="w-10 h-10 rounded-lg border border-[#23232A] hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs text-neutral-400 block mb-1">Custom Color Hex</label>
              <input
                type="color"
                onChange={(e) => {
                  if (!canvas) return;
                  canvas.backgroundColor = e.target.value;
                  canvas.requestRenderAll();
                  pushHistory();
                }}
                className="w-full h-9 rounded bg-[#121216] border border-[#23232A] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 5: ELEMENTS */}
        {activeTab === 'elements' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Vector Shapes</h3>
            <div className="grid grid-cols-2 gap-2">
              {ELEMENTS_COLLECTION.map((elem) => (
                <button
                  key={elem.id}
                  onClick={() => {
                    if (canvas) insertElementToCanvas(canvas, elem, { themeColor: '#D4AF37' });
                  }}
                  className="p-3 rounded-xl bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] flex flex-col items-center justify-center space-y-2 transition-colors"
                >
                  <div className="w-12 h-10 flex items-center justify-center text-[#D4AF37]">
                    {elem.type === 'circle' ? (
                      <div className="w-8 h-8 rounded-full border-2 border-current" />
                    ) : elem.type === 'line' ? (
                      <div className="w-10 h-0.5 bg-current" />
                    ) : (
                      <div className="w-10 h-6 rounded border-2 border-current" />
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-300 font-medium truncate w-full text-center">
                    {elem.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ARTWORK & ICONIFY */}
        {activeTab === 'artwork' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">NFC & Brand Artwork</h3>
            <div className="grid grid-cols-2 gap-2">
              {ARTWORK_COLLECTION.map((art) => (
                <button
                  key={art.id}
                  onClick={() => {
                    if (canvas) insertArtworkToCanvas(canvas, art, { themeColor: '#D4AF37' });
                  }}
                  className="p-3 rounded-xl bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] flex flex-col items-center justify-center space-y-2 transition-colors"
                >
                  <div
                    className="w-10 h-10 text-[#D4AF37] flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: art.svg }}
                  />
                  <span className="text-[10px] text-neutral-300 font-medium truncate w-full text-center">
                    {art.name}
                  </span>
                </button>
              ))}
            </div>

            <hr className="border-[#23232A]" />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-neutral-400">Live Iconify Search</h4>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => handleSearchIcons(e.target.value)}
                  placeholder="Search 100,000+ vector icons..."
                  className="w-full bg-[#121216] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 border border-[#23232A] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {isSearchingIcons && (
                <div className="flex items-center space-x-2 text-xs text-neutral-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching Iconify...</span>
                </div>
              )}

              {iconResults.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {iconResults.map((icon) => (
                    <button
                      key={icon.fullName}
                      onClick={() => handleInsertIconify(icon)}
                      className="p-2 rounded-lg bg-[#121216] hover:bg-[#18181D] border border-[#23232A] hover:border-[#D4AF37] flex items-center justify-center"
                      title={icon.name}
                    >
                      <img src={icon.svgUri} alt={icon.name} className="w-6 h-6 filter invert" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: LAYERS */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Canvas Layers Tree</h3>
            {canvasObjects.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No elements on canvas</p>
            ) : (
              <div className="space-y-1">
                {canvasObjects.map((obj: any, idx) => {
                  const isSelected = selectedObjectId === obj.id;
                  return (
                    <div
                      key={obj.id || idx}
                      onClick={() => handleSelectLayer(obj)}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer ${isSelected
                          ? 'bg-[#18181D] border-[#D4AF37] text-white'
                          : 'bg-[#121216] border-[#23232A] text-neutral-300 hover:border-neutral-600'
                        }`}
                    >
                      <span className="truncate max-w-[120px] font-medium">
                        {obj.name || obj.text || obj.type || `Layer ${idx + 1}`}
                      </span>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleLock(obj)}
                          className="p-1 text-neutral-400 hover:text-white"
                          title={obj.isLocked ? 'Unlock' : 'Lock'}
                        >
                          {obj.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(obj)}
                          className="p-1 text-neutral-400 hover:text-white"
                          title={obj.visible ? 'Hide' : 'Show'}
                        >
                          {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-500" />}
                        </button>
                        <button
                          onClick={() => handleReorderLayer(obj, 'up')}
                          className="p-1 text-neutral-400 hover:text-white"
                          title="Bring Forward"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderLayer(obj, 'down')}
                          className="p-1 text-neutral-400 hover:text-white"
                          title="Send Backward"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateLayer(obj)}
                          className="p-1 text-neutral-400 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLayer(obj)}
                          className="p-1 text-neutral-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
