import React, { useState, Suspense } from 'react';
import { fabric } from 'fabric';
import {
  Type,
  Upload,
  Palette,
  Shapes,
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
  Heading,
  Text as TextIcon,
} from 'lucide-react';
import { useEditorStore } from '../useEditorStore';
import { StudioFontList } from '../../../studio/fonts/StudioFontList';
import { loadFont, snapToNearestWeight, FontDef } from '../../../studio/fonts/fontLoader';
import { ELEMENTS_COLLECTION } from '../../../utils/elementsData';
import { ARTWORK_COLLECTION } from '../../../utils/artworkData';
import { insertElementToCanvas, insertArtworkToCanvas } from '../../../utils/elementLibrary';
import { searchIconifyIcons, fetchIconifySvg, IconifyResult } from '../../../utils/iconifyService';
import { uploadToCloudinaryAndPersist, UploadedAsset } from '../../../utils/cloudinaryDirectUpload';
import { generateObjectId } from '../../../utils/canvasJson';
import { MobileTabId } from './MobileBottomTabBar';

interface MobileToolPanelsProps {
  activeTab: MobileTabId;
  templates?: any[];
  product?: any;
  onApplyTemplate?: (template: any) => void;
  onClose?: () => void;
}

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
  '#FF6A00', // Taptch Orange
];

export const MobileToolPanels: React.FC<MobileToolPanelsProps> = ({
  activeTab,
  templates = [],
  product,
  onApplyTemplate,
  onClose,
}) => {
  const {
    canvas,
    pushHistory,
    syncSelectedProps,
    selectedObjectId,
    selectedObjectProps,
  } = useEditorStore();

  // Iconify search state
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<IconifyResult[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);

  // Uploads state
  const [userAssets, setUserAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      defaultText = 'Subheading';
      charSpacing = 30;
    } else if (preset === 'body') {
      fontSize = 14;
      fontWeight = '400';
      defaultText = 'hello@example.com';
      charSpacing = 20;
    }

    const textObj = new fabric.IText(defaultText, {
      left: 120,
      top: 180 + (preset === 'subheading' ? 60 : preset === 'body' ? 110 : 0),
      fontSize,
      fontWeight,
      fontFamily: 'Inter',
      fill: preset === 'subheading' ? '#D4AF37' : '#FFFFFF',
      charSpacing,
      lineHeight: 1.15,
      textAlign: 'left',
    });

    (textObj as any).id = generateObjectId('text');
    (textObj as any).name = preset.toUpperCase();

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.requestRenderAll();
    syncSelectedProps();
    pushHistory();
    onClose?.();
  };

  // Font Selection
  const handleSelectFont = async (fontDef: FontDef) => {
    if (!canvas) return;
    await loadFont(fontDef);
    const activeObj = canvas.getActiveObject() as any;
    if (activeObj && (activeObj.type === 'text' || activeObj.type === 'i-text' || activeObj.type === 'textbox')) {
      activeObj.set('fontFamily', fontDef.family);
      if (activeObj.initDimensions) activeObj.initDimensions();
      activeObj.setCoords();
      canvas.requestRenderAll();
      syncSelectedProps();
      pushHistory();
    }
  };

  // Background Color Change
  const handleApplyBackground = (color: string) => {
    if (!canvas) return;
    const bgPlate = canvas.getObjects().find((o: any) => o.id === 'bg_plate');
    if (bgPlate) {
      bgPlate.set('fill', color);
    } else {
      canvas.setBackgroundColor(color, () => { });
    }
    canvas.requestRenderAll();
    pushHistory();
  };

  // Upload Asset
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const asset = await uploadToCloudinaryAndPersist(file);
      setUserAssets((prev) => [asset, ...prev]);

      // Insert onto canvas
      fabric.Image.fromURL(
        asset.url,
        (img) => {
          if (!canvas) return;
          const maxDim = 280;
          const scale = Math.min(maxDim / (img.width || 1), maxDim / (img.height || 1), 1);
          img.scale(scale);
          img.set({
            left: 140,
            top: 140,
          });
          (img as any).id = generateObjectId('img');
          (img as any).name = asset.originalName || 'Uploaded Logo';
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          syncSelectedProps();
          pushHistory();
          onClose?.();
        },
        { crossOrigin: 'anonymous' }
      );
    } catch (err: any) {
      console.warn('Upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Iconify Search
  const handleSearchIcons = async (query: string) => {
    setIconSearch(query);
    if (!query.trim()) {
      setIconResults([]);
      return;
    }
    setIsSearchingIcons(true);
    try {
      const results = await searchIconifyIcons(query, 24);
      setIconResults(results);
    } catch (err) {
      console.warn('Iconify search failed:', err);
    } finally {
      setIsSearchingIcons(false);
    }
  };

  const handleInsertIconify = async (icon: IconifyResult) => {
    if (!canvas) return;
    try {
      const svgText = await fetchIconifySvg(icon.fullName);
      if (!svgText) return;
      fabric.loadSVGFromString(svgText, (objects, options) => {
        const svgGroup = fabric.util.groupSVGElements(objects, options);
        svgGroup.set({
          left: 180,
          top: 180,
          scaleX: 1.5,
          scaleY: 1.5,
        });
        (svgGroup as any).id = generateObjectId('icon');
        (svgGroup as any).name = icon.name;
        canvas.add(svgGroup);
        canvas.setActiveObject(svgGroup);
        canvas.requestRenderAll();
        syncSelectedProps();
        pushHistory();
        onClose?.();
      });
    } catch (err) {
      console.warn('Insert icon failed:', err);
    }
  };

  const canvasObjects = canvas ? canvas.getObjects().filter((o: any) => o.id !== 'bg_plate') : [];

  return (
    <div className="w-full">
      {/* 1. LAYOUTS / TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--ink-muted)]">Choose a designer template as your starting layout:</p>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  onApplyTemplate?.(tpl);
                  onClose?.();
                }}
                className="group relative cursor-pointer rounded-xl overflow-hidden border border-[var(--border)] active:border-[var(--accent)] transition-all bg-[var(--bg-raised)] p-2 flex flex-col space-y-1.5"
              >
                <div className="aspect-[1.75/1] bg-[var(--bg-page)] rounded-lg overflow-hidden flex items-center justify-center">
                  <span className="font-head text-xs font-semibold text-[var(--ink)]">{tpl.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[var(--ink)] truncate">{tpl.name}</span>
                  <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase">{tpl.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TEXT TAB */}
      {activeTab === 'text' && (
        <div className="flex flex-col space-y-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-2">
              Add Typography Preset
            </span>
            {/* 3-Column Grid with label under each */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAddText('heading')}
                className="h-16 flex flex-col items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] transition-colors"
              >
                <Heading className="w-5 h-5 mb-1 text-[var(--accent)]" />
                <span className="text-xs font-bold">Heading</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddText('subheading')}
                className="h-16 flex flex-col items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] transition-colors"
              >
                <Type className="w-5 h-5 mb-1 text-[var(--accent)]" />
                <span className="text-xs font-semibold">Subhead</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddText('body')}
                className="h-16 flex flex-col items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--ink)] transition-colors"
              >
                <TextIcon className="w-5 h-5 mb-1 text-[var(--ink-muted)]" />
                <span className="text-xs">Body Text</span>
              </button>
            </div>
          </div>

          <hr className="border-[var(--border)]" />

          {/* Full-width Font Picker */}
          <div className="flex flex-col h-[280px]">
            <StudioFontList
              selectedFont={selectedObjectProps?.fontFamily || ''}
              onSelectFont={handleSelectFont}
            />
          </div>
        </div>
      )}

      {/* 3. UPLOADS TAB */}
      {activeTab === 'uploads' && (
        <div className="space-y-4">
          <label className="border-2 border-dashed border-[var(--border)] active:border-[var(--accent)] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-[var(--bg-raised)]/40 transition-colors">
            <Upload className="w-7 h-7 text-[var(--accent)] mb-2" />
            <span className="text-xs font-medium text-[var(--ink)]">Tap to upload logo or image</span>
            <span className="text-[10px] text-[var(--ink-muted)] mt-1">PNG, JPG, WEBP, SVG (Max 15MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>

          {isUploading && (
            <div className="flex items-center justify-center space-x-2 text-xs text-[var(--accent)] py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading asset...</span>
            </div>
          )}

          {uploadError && <p className="text-xs text-rose-400 text-center">{uploadError}</p>}

          {userAssets.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {userAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    fabric.Image.fromURL(asset.url, (img) => {
                      if (!canvas) return;
                      img.scale(0.3);
                      canvas.add(img);
                      canvas.setActiveObject(img);
                      canvas.requestRenderAll();
                      syncSelectedProps();
                      pushHistory();
                      onClose?.();
                    });
                  }}
                  className="aspect-square rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] p-1 flex items-center justify-center cursor-pointer"
                >
                  <img src={asset.url} alt="Asset" className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. COLORS TAB */}
      {activeTab === 'background' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--ink-muted)]">Select card surface color:</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {BG_PALETTES.map((color) => (
              <button
                key={color}
                onClick={() => handleApplyBackground(color)}
                style={{ backgroundColor: color }}
                className="h-12 rounded-xl border border-[var(--border-strong)] flex items-center justify-center active:scale-95 transition-transform"
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. SHAPES TAB */}
      {activeTab === 'elements' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--ink-muted)]">Tap to add vector shape to card:</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ELEMENTS_COLLECTION.map((elem) => (
              <button
                key={elem.id}
                onClick={() => {
                  if (canvas) insertElementToCanvas(canvas, elem, { themeColor: '#FF6A00' });
                  onClose?.();
                }}
                className="h-16 rounded-xl bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col items-center justify-center space-y-1 transition-colors"
              >
                <div className="w-8 h-4 rounded border border-[var(--accent)]" />
                <span className="text-[11px] font-medium text-[var(--ink)] truncate">{elem.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. ARTWORK TAB */}
      {activeTab === 'artwork' && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-muted)]">NFC Waves & Luxury Crests:</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ARTWORK_COLLECTION.map((art) => (
              <button
                key={art.id}
                onClick={() => {
                  if (canvas) insertArtworkToCanvas(canvas, art, { themeColor: '#FF6A00' });
                  onClose?.();
                }}
                className="p-3 rounded-xl bg-[var(--bg-raised)] active:bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col items-center justify-center space-y-2 transition-colors"
              >
                <div
                  className="w-8 h-8 text-[var(--accent)] flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: art.svg }}
                />
                <span className="text-[11px] font-medium text-[var(--ink)] truncate">{art.name}</span>
              </button>
            ))}
          </div>

          <hr className="border-[var(--border)]" />

          {/* Iconify Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => handleSearchIcons(e.target.value)}
                placeholder="Search 100,000+ vector icons..."
                className="w-full h-11 bg-[var(--bg-raised)] text-[16px] text-[var(--ink)] rounded-lg pl-9 pr-3 border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {isSearchingIcons && (
              <div className="flex items-center space-x-2 text-xs text-[var(--ink-muted)] py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                <span>Searching vector icons...</span>
              </div>
            )}

            {iconResults.length > 0 && (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {iconResults.map((icon) => (
                  <button
                    key={icon.fullName}
                    onClick={() => handleInsertIconify(icon)}
                    className="h-12 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center p-2"
                  >
                    <img src={icon.svgUri} alt={icon.name} className="w-6 h-6 filter invert" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. LAYERS TAB */}
      {activeTab === 'layers' && (
        <div className="space-y-2">
          {canvasObjects.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)] py-6 text-center">No elements on canvas</p>
          ) : (
            <div className="space-y-1.5">
              {canvasObjects.map((obj: any, idx) => {
                const isSelected = selectedObjectId === obj.id;
                return (
                  <div
                    key={obj.id || idx}
                    onClick={() => {
                      if (!canvas) return;
                      canvas.setActiveObject(obj);
                      canvas.requestRenderAll();
                      syncSelectedProps();
                    }}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${isSelected
                        ? 'bg-[var(--bg-raised)] border-[var(--accent)] text-[var(--ink)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--ink-muted)]'
                      }`}
                  >
                    <span className="font-medium truncate max-w-[140px]">
                      {obj.name || obj.text || obj.type || `Layer ${idx + 1}`}
                    </span>
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          obj.set('visible', !obj.visible);
                          canvas?.requestRenderAll();
                          pushHistory();
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      >
                        {obj.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
                      </button>
                      <button
                        onClick={() => {
                          canvas?.remove(obj);
                          canvas?.discardActiveObject();
                          canvas?.requestRenderAll();
                          syncSelectedProps();
                          pushHistory();
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded text-[var(--ink-muted)] hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};
