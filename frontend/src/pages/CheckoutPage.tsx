/**
 * CheckoutPage - Premium Light & Orange NFC Smart Card Checkout Experience
 * 
 * Features:
 * - 4-Step Progressive Wizard:
 *   Step 1: Choose NFC Smart Card (Material selection, realistic live preview, quantity, collapsible tech specs)
 *   Step 2: Link Digital Profile (Select live profile OR free concierge assistance)
 *   Step 3: Delivery Address (Saved address card, address picker modal, multi-row responsive form)
 *   Step 4: Review & Payment (Shipping summary, UPI / Cards / COD payment methods, dynamic pricing breakdown)
 * - Navigation:
 *   Desktop: Stepper progress indicator, sticky order summary card, and inline navigation CTAs
 *   Mobile: Compact horizontal stepper, mobile-first single column, expandable summary drawer, sticky bottom action bar
 * - Light + Orange Design System:
 *   Background #F8F9FA, pure white surface cards, TAPTCH safety orange (#FF6A00) primary accents & buttons with white text,
 *   subtle light grey borders (#E5E7EB), soft orange selected states (#FFF8F3 / border #FF6A00), minimal natural shadows.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  QrCode,
  Truck,
  Check,
  AlertCircle,
  Loader2,
  PackageCheck,
  MapPin,
  Lock,
  ArrowRight,
  ShoppingBag,
  Edit3,
  Plus,
  Home,
  Briefcase,
  X,
  Wallet,
  Smartphone,
  Layers,
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';
import { defaultBrandConfig } from '../config/brand';
import { useEditorStore } from '../components/editor/useEditorStore';
import { BrandLogo } from '../components/brand';
import { AddressForm, type AddressFormValues } from '../components/address/AddressForm';
import { SavedAddressesList } from '../components/address/SavedAddressesList';
import type { SavedAddress } from '../types/address';
import { renderSideToPreview } from '../utils/canvasRenderer';
import { CardPreview } from '../components/cards/CardPreview';

interface ProfileOption {
  id: string;
  slug: string;
  displayName: string;
  profileType: string;
  avatarUrl?: string;
  status: string;
}

type CheckoutStep = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, label: 'Card' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Delivery' },
  { id: 4, label: 'Payment' },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [maxStepReached, setMaxStepReached] = useState<CheckoutStep>(1);

  // Mobile expandable summary state
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState<boolean>(false);

  // Global & API Error Banners
  const [formBannerError, setFormBannerError] = useState<string | null>(null);
  const [errorReferenceId, setErrorReferenceId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Idempotency Key: preserved per checkout attempt to prevent duplicate orders
  const idempotencyKeyRef = useRef<string>(`idem_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`);

  // Query parameters
  const queryProductId = searchParams.get('productId') || 'prod_matte_pvc_01';
  const queryDesignId = searchParams.get('designId');

  // Backend Design Fetching: if a designId exists and is not 'draft', query backend
  const { data: fetchedDesign, isLoading: isDesignLoading } = useQuery<any>({
    queryKey: ['design', queryDesignId],
    queryFn: async () => {
      if (!queryDesignId || queryDesignId === 'draft') return null;
      return ApiClient.get<any>(`/api/v1/designs/${queryDesignId}`);
    },
    enabled: Boolean(queryDesignId && queryDesignId !== 'draft'),
    staleTime: 5 * 60 * 1000,
  });

  // Local storage draft backup for page refresh resilience
  const [localDraft] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('taptch_checkout_design_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // In-memory Canvas Editor store state (active when navigating directly from editor)
  const storeFrontJson = useEditorStore((state) => state.frontJson);
  const storeBackJson = useEditorStore((state) => state.backJson);
  const storeFrontPreview = useEditorStore((state) => state.frontPreview);
  const storeBackPreview = useEditorStore((state) => state.backPreview);

  // Consolidated JSON states
  const effectiveFrontJson = useMemo(() => {
    return storeFrontJson || fetchedDesign?.frontCanvasJson || localDraft?.frontCanvasJson || '';
  }, [storeFrontJson, fetchedDesign, localDraft]);

  const effectiveBackJson = useMemo(() => {
    return storeBackJson || fetchedDesign?.backCanvasJson || localDraft?.backCanvasJson || '';
  }, [storeBackJson, fetchedDesign, localDraft]);

  // Headless rendering fallback state if previews need to be computed on-the-fly
  const [renderedFrontPreview, setRenderedFrontPreview] = useState<string>('');
  const [renderedBackPreview, setRenderedBackPreview] = useState<string>('');
  const [isRenderingArtwork, setIsRenderingArtwork] = useState<boolean>(false);

  // Consolidated Preview image URLs
  const effectiveFrontPreview = useMemo(() => {
    return storeFrontPreview || fetchedDesign?.previewUrl || localDraft?.previewUrl || renderedFrontPreview || '';
  }, [storeFrontPreview, fetchedDesign, localDraft, renderedFrontPreview]);

  const effectiveBackPreview = useMemo(() => {
    return storeBackPreview || fetchedDesign?.backPreviewUrl || localDraft?.backPreviewUrl || renderedBackPreview || '';
  }, [storeBackPreview, fetchedDesign, localDraft, renderedBackPreview]);

  // On-the-fly fallback headless render if preview URLs are missing but JSON exists
  useEffect(() => {
    let isCancelled = false;
    async function generateMissingPreviews() {
      if (effectiveFrontJson && !effectiveFrontPreview && !renderedFrontPreview) {
        setIsRenderingArtwork(true);
        const p = await renderSideToPreview(effectiveFrontJson);
        if (!isCancelled && p) setRenderedFrontPreview(p);
      }
      if (effectiveBackJson && !effectiveBackPreview && !renderedBackPreview) {
        setIsRenderingArtwork(true);
        const p = await renderSideToPreview(effectiveBackJson);
        if (!isCancelled && p) setRenderedBackPreview(p);
      }
      if (!isCancelled) setIsRenderingArtwork(false);
    }
    generateMissingPreviews();
    return () => {
      isCancelled = true;
    };
  }, [effectiveFrontJson, effectiveBackJson, effectiveFrontPreview, effectiveBackPreview, renderedFrontPreview, renderedBackPreview]);

  // Freezable design snapshot for order submission
  const studioDesignSnapshot = useMemo(() => {
    if (!effectiveFrontJson && !effectiveBackJson && !effectiveFrontPreview && !effectiveBackPreview) return null;
    return {
      frontCanvasJson: effectiveFrontJson,
      backCanvasJson: effectiveBackJson,
      previewUrl: effectiveFrontPreview,
      backPreviewUrl: effectiveBackPreview,
      previewFrontUrl: effectiveFrontPreview,
      previewBackUrl: effectiveBackPreview,
      capturedAt: new Date().toISOString(),
    };
  }, [effectiveFrontJson, effectiveBackJson, effectiveFrontPreview, effectiveBackPreview]);

  // Step 1: Card Configuration
  const [cardMaterial, setCardMaterial] = useState<'pvc' | 'metal' | 'wood'>('pvc');
  const [quantity, setQuantity] = useState<number>(1);
  const [showTechSpecs, setShowTechSpecs] = useState<boolean>(false);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

  // Pricing based on material
  const unitPrice = useMemo(() => {
    switch (cardMaterial) {
      case 'metal':
        return 2499;
      case 'wood':
        return 1999;
      case 'pvc':
      default:
        return 1499;
    }
  }, [cardMaterial]);

  const subtotal = unitPrice * quantity;
  const shippingCost = subtotal >= 2000 ? 0 : 99; // Free above ₹2,000
  const taxAmount = Math.round(subtotal * 0.18); // 18% GST
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Step 2: Digital Profile Association
  const [profileChoice, setProfileChoice] = useState<'attach' | 'assistance'>('attach');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [conciergeNotes, setConciergeNotes] = useState<string>('');

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<ProfileOption[]>({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<ProfileOption[]>('/api/v1/profiles'),
    enabled: Boolean(sessionData?.user),
  });

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  // Step 3: Saved Addresses & Delivery
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState<boolean>(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [orderDeliveryInstructions, setOrderDeliveryInstructions] = useState<string>('');
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // Manual Address Form State
  const [addressForm, setAddressForm] = useState<AddressFormValues>({
    fullName: sessionData?.user?.name || '',
    phone: '',
    email: sessionData?.user?.email || '',
    whatsappNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateName: '',
    postalCode: '',
    country: 'India',
    deliveryInstructions: '',
    label: 'Home',
    customLabel: '',
    isDefault: false,
    saveForLater: true,
  });

  // Query: Fetch saved addresses
  const {
    data: savedAddresses = [],
    isLoading: addressesLoading,
  } = useQuery<SavedAddress[]>({
    queryKey: ['saved-addresses'],
    queryFn: () => ApiClient.get<SavedAddress[]>('/api/v1/addresses'),
    enabled: Boolean(sessionData?.user),
  });

  // Automatically select the default address or first address on load
  useEffect(() => {
    if (savedAddresses.length > 0) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (!selectedAddressId || !savedAddresses.some((a) => a.id === selectedAddressId)) {
        setSelectedAddressId(defaultAddr.id);
      }
    } else {
      setSelectedAddressId(null);
    }
  }, [savedAddresses, selectedAddressId]);

  // Selected address object
  const selectedSavedAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    return savedAddresses.find((a) => a.id === selectedAddressId) || null;
  }, [savedAddresses, selectedAddressId]);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'cod'>('upi');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Form Field Change Handler
  const handleAddressFieldChange = (field: keyof AddressFormValues, value: any) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formBannerError) setFormBannerError(null);
  };

  // Address Validation
  const validateAddressForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!addressForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addressForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(addressForm.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }
    if (!addressForm.addressLine1.trim()) errors.addressLine1 = 'Street / House / Flat details are required';
    if (!addressForm.city.trim()) errors.city = 'City / District is required';
    if (!addressForm.stateName.trim()) errors.stateName = 'State is required';
    if (!addressForm.postalCode.trim()) {
      errors.postalCode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(addressForm.postalCode.replace(/\D/g, ''))) {
      errors.postalCode = 'Please enter a valid 6-digit PIN code';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step Navigation Handlers
  const handleNextStep = () => {
    setFormBannerError(null);
    setErrorReferenceId(null);

    if (currentStep === 1) {
      setCurrentStep(2);
      setMaxStepReached((prev) => Math.max(prev, 2) as CheckoutStep);
    } else if (currentStep === 2) {
      if (profileChoice === 'attach' && profiles.length > 0 && !selectedProfileId) {
        setFormBannerError('Please choose a digital profile to attach to your card.');
        return;
      }
      setCurrentStep(3);
      setMaxStepReached((prev) => Math.max(prev, 3) as CheckoutStep);
    } else if (currentStep === 3) {
      if (savedAddresses.length > 0 && !isAddingNewAddress) {
        if (!selectedAddressId) {
          setFormBannerError('Please select a delivery address or enter a new one.');
          return;
        }
      } else {
        if (!validateAddressForm()) {
          setFormBannerError('Please fix the highlighted fields in your address.');
          return;
        }
      }
      setCurrentStep(4);
      setMaxStepReached((prev) => Math.max(prev, 4) as CheckoutStep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setFormBannerError(null);
    setErrorReferenceId(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Save new address from modal or manual form
  const handleSaveNewAddress = async () => {
    if (!validateAddressForm()) return;
    setIsSavingAddress(true);
    setFormBannerError(null);

    try {
      if (editingAddress) {
        const updated = await ApiClient.patch<SavedAddress>(`/api/v1/addresses/${editingAddress.id}`, {
          recipientName: addressForm.fullName,
          phone: addressForm.phone,
          email: addressForm.email || undefined,
          whatsappNumber: addressForm.whatsappNumber || undefined,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2 || undefined,
          city: addressForm.city,
          state: addressForm.stateName,
          postalCode: addressForm.postalCode,
          country: addressForm.country || 'India',
          deliveryInstructions: addressForm.deliveryInstructions || undefined,
          label: addressForm.label || 'Home',
          customLabel: addressForm.customLabel || undefined,
          isDefault: addressForm.isDefault,
        });
        await queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
        setSelectedAddressId(updated.id);
        setEditingAddress(null);
        setIsAddingNewAddress(false);
        setShowAddressPicker(false);
      } else {
        const created = await ApiClient.post<SavedAddress>('/api/v1/addresses', {
          recipientName: addressForm.fullName,
          phone: addressForm.phone,
          email: addressForm.email || undefined,
          whatsappNumber: addressForm.whatsappNumber || undefined,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2 || undefined,
          city: addressForm.city,
          state: addressForm.stateName,
          postalCode: addressForm.postalCode,
          country: addressForm.country || 'India',
          deliveryInstructions: addressForm.deliveryInstructions || undefined,
          label: addressForm.label || 'Home',
          customLabel: addressForm.customLabel || undefined,
          isDefault: addressForm.isDefault,
        });
        await queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
        setSelectedAddressId(created.id);
        setIsAddingNewAddress(false);
        setShowAddressPicker(false);
      }
    } catch (err: any) {
      const message = err?.message || 'Unable to save address. Please verify your details.';
      setFormBannerError(message);
      if (err?.referenceId) setErrorReferenceId(err.referenceId);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete saved address
  const handleDeleteAddress = async (id: string) => {
    try {
      await ApiClient.delete(`/api/v1/addresses/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
      if (selectedAddressId === id) {
        const remaining = savedAddresses.filter((a) => a.id !== id);
        setSelectedAddressId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      setFormBannerError(err?.message || 'Failed to delete address.');
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      await ApiClient.post(`/api/v1/addresses/${id}/default`, {});
      await queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
    } catch (err: any) {
      setFormBannerError(err?.message || 'Failed to set default address.');
    }
  };

  // Edit existing address
  const handleStartEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.recipientName,
      phone: addr.phone,
      email: addr.email || '',
      whatsappNumber: addr.whatsappNumber || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      stateName: addr.state,
      postalCode: addr.postalCode,
      country: (addr as any).country || 'India',
      deliveryInstructions: addr.deliveryInstructions || '',
      label: addr.label,
      customLabel: addr.customLabel || '',
      isDefault: addr.isDefault,
      saveForLater: false,
    });
    setIsAddingNewAddress(true);
    setShowAddressPicker(false);
  };

  // Final Order Submission Handler
  const handlePlaceOrder = async () => {
    setIsSubmittingOrder(true);
    setFormBannerError(null);
    setErrorReferenceId(null);

    try {
      let shippingAddressPayload: any;

      if (savedAddresses.length > 0 && !isAddingNewAddress && selectedSavedAddress) {
        shippingAddressPayload = {
          fullName: selectedSavedAddress.recipientName,
          phone: selectedSavedAddress.phone,
          email: selectedSavedAddress.email || sessionData?.user?.email || '',
          whatsappNumber: selectedSavedAddress.whatsappNumber || undefined,
          addressLine1: selectedSavedAddress.addressLine1,
          addressLine2: selectedSavedAddress.addressLine2 || undefined,
          city: selectedSavedAddress.city,
          state: selectedSavedAddress.state,
          postalCode: selectedSavedAddress.postalCode,
          country: (selectedSavedAddress as any).country || 'India',
          deliveryInstructions: orderDeliveryInstructions || selectedSavedAddress.deliveryInstructions || undefined,
        };

        ApiClient.post(`/api/v1/addresses/${selectedSavedAddress.id}/use`, {}).catch(() => { });
      } else {
        shippingAddressPayload = {
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          email: addressForm.email || sessionData?.user?.email || '',
          whatsappNumber: addressForm.whatsappNumber || undefined,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2 || undefined,
          city: addressForm.city,
          state: addressForm.stateName,
          postalCode: addressForm.postalCode,
          country: addressForm.country || 'India',
          deliveryInstructions: orderDeliveryInstructions || addressForm.deliveryInstructions || undefined,
        };

        if (addressForm.saveForLater && sessionData?.user) {
          ApiClient.post('/api/v1/addresses', {
            recipientName: addressForm.fullName,
            phone: addressForm.phone,
            email: addressForm.email || undefined,
            whatsappNumber: addressForm.whatsappNumber || undefined,
            addressLine1: addressForm.addressLine1,
            addressLine2: addressForm.addressLine2 || undefined,
            city: addressForm.city,
            state: addressForm.stateName,
            postalCode: addressForm.postalCode,
            country: addressForm.country || 'India',
            deliveryInstructions: addressForm.deliveryInstructions || undefined,
            label: addressForm.label || 'Home',
            customLabel: addressForm.customLabel || undefined,
            isDefault: addressForm.isDefault,
          }).catch(() => { });
        }
      }

      const orderPayload = {
        designId: queryDesignId && queryDesignId !== 'draft' ? queryDesignId : (fetchedDesign?.id || undefined),
        designSnapshot: studioDesignSnapshot,
        productId: queryProductId,
        quantity,
        cardMaterial,
        profileId: profileChoice === 'attach' ? selectedProfileId : null,
        requestProfileAssistance: profileChoice === 'assistance',
        profileAssistanceNotes: profileChoice === 'assistance' ? conciergeNotes : undefined,
        shippingAddress: shippingAddressPayload,
        paymentMethod,
        idempotencyKey: idempotencyKeyRef.current,
        notes: orderDeliveryInstructions || undefined,
      };

      const createdOrder = await ApiClient.post<any>('/api/v1/orders', orderPayload);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${createdOrder.id}/confirmation`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      const safeMessage = err?.message || 'We could not place your order. Please check your information and try again.';
      setFormBannerError(safeMessage);
      if (err?.referenceId) {
        setErrorReferenceId(err.referenceId);
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const getProductName = (mat: string) => {
    switch (mat) {
      case 'metal':
        return 'Obsidian Matte Metal';
      case 'wood':
        return 'Handcrafted Wood';
      case 'pvc':
      default:
        return 'Matte Obsidian PVC';
    }
  };

  return (
    <div data-theme="light" className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Checkout Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-lg text-gray-500 hover:text-zinc-900 hover:bg-gray-100 transition-colors"
              title="Go Back"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
              aria-label="Taptch Home"
            >
              <BrandLogo variant="symbol" className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="font-bold tracking-tight text-base sm:text-lg text-zinc-900">
                {defaultBrandConfig.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">256-Bit SSL Encrypted Checkout</span>
            <span className="sm:hidden text-emerald-700 font-medium">Secure</span>
          </div>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="max-w-2xl mx-auto px-4 pb-2.5 sm:pb-3">
          <div className="flex items-center justify-between relative">
            {/* Base line */}
            <div className="absolute left-4 right-4 top-3.5 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
            {/* Active filled line */}
            <div
              className="absolute left-4 top-3.5 -translate-y-1/2 h-0.5 bg-[#FF6A00] transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * (100 - (100 / STEPS.length))}%` }}
            />
            {STEPS.map((step) => {
              const isPassed = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isAccessible = step.id <= maxStepReached;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.id as CheckoutStep);
                    }
                  }}
                  disabled={!isAccessible}
                  aria-label={`Step ${step.id}: ${step.label}`}
                  className={`relative z-10 flex flex-col items-center group transition-all ${!isAccessible ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isPassed
                      ? 'bg-[#FF6A00] text-white shadow-xs'
                      : isCurrent
                        ? 'bg-[#FF6A00] text-white ring-4 ring-orange-100 shadow-xs'
                        : 'bg-white text-gray-400 border border-gray-300'
                      }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.id}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs mt-1 transition-colors ${isCurrent
                      ? 'text-zinc-900 font-semibold'
                      : isPassed
                        ? 'text-zinc-600 font-medium'
                        : 'text-gray-400'
                      }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-28 lg:pb-12">
        {/* Error Alert Banner */}
        {formBannerError && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Please review your information</p>
              <p className="text-red-700 mt-0.5">{formBannerError}</p>
              {errorReferenceId && (
                <p className="text-xs text-red-600 mt-1 font-mono">
                  Reference: <span className="font-semibold">{errorReferenceId}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setFormBannerError(null);
                setErrorReferenceId(null);
              }}
              className="text-red-500 hover:text-red-800 p-1 rounded-md"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Checkout Wizard Steps */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* STEP 1: CHOOSE NFC SMART CARD */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                    Choose Your NFC Smart Card
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select your card material, preview artwork, and choose quantity.
                  </p>
                </div>

                {/* Material Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'pvc',
                      name: 'Matte Obsidian PVC',
                      price: '₹1,499',
                      desc: 'Lightweight, durable & water-resistant matte finish.',
                    },
                    {
                      id: 'wood',
                      name: 'Handcrafted Wood',
                      price: '₹1,999',
                      desc: 'Authentic dark walnut finish with precision laser engraving.',
                    },
                    {
                      id: 'metal',
                      name: 'Obsidian Matte Metal',
                      price: '₹2,499',
                      desc: 'Aerospace-grade stainless steel with weighted luxury feel.',
                    },
                  ].map((mat) => {
                    const isSelected = cardMaterial === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => setCardMaterial(mat.id as any)}
                        className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all relative flex flex-col justify-between ${isSelected
                          ? 'bg-[#FFF8F3] border-2 border-[#FF6A00] ring-1 ring-[#FF6A00]/20 shadow-xs'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-zinc-900">{mat.name}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-1.5 ${isSelected
                                ? 'border-[#FF6A00] bg-[#FF6A00] text-white'
                                : 'border-gray-300 bg-white'
                                }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{mat.desc}</p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-baseline justify-between">
                          <span className="text-base font-bold text-zinc-900">{mat.price}</span>
                          <span className="text-[11px] text-gray-400">per card</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Card Artwork Preview */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-700">Live Card Artwork Preview</span>
                    <div className="flex items-center p-0.5 rounded-lg bg-gray-200/70 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setPreviewSide('front')}
                        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${previewSide === 'front'
                          ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                          : 'text-gray-600 hover:text-zinc-900'
                          }`}
                      >
                        Front Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewSide('back')}
                        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${previewSide === 'back'
                          ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                          : 'text-gray-600 hover:text-zinc-900'
                          }`}
                      >
                        Back Side
                      </button>
                    </div>
                  </div>

                    <div className="max-w-[260px] mx-auto">
                      {isDesignLoading || isRenderingArtwork ? (
                          <div className="aspect-[85.6/54] rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center p-4 space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[#FF6A00]" />
                            <span className="text-[11px] font-medium text-gray-500">Loading custom artwork...</span>
                          </div>
                          ) : (
                            <>
                              <CardPreview
                                frontUrl={effectiveFrontPreview}
                                backUrl={effectiveBackPreview}
                                frontJson={effectiveFrontJson}
                                backJson={effectiveBackJson}
                                side={previewSide}
                                allowFlip={true}
                                showFlipHint={true}
                                onFlip={(s) => setPreviewSide(s)}
                                cloudinaryWidth={800}
                                className="rounded-xl shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => navigate(`/design-studio?productId=${encodeURIComponent(queryProductId)}`)}
                                className="text-[11px] font-semibold text-[#FF6A00] hover:underline block mx-auto pt-2"
                              >
                                Customize in Design Studio
                              </button>
                          </>
                    )}
                        </div>
                </div>

                    {/* Quantity Selector */}
                    {/* <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200">
                  <div>
                    <label className="text-sm font-semibold text-zinc-900 block">Quantity</label>
                    <p className="text-xs text-gray-500">Order multiple cards for team members or spares</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-zinc-800 flex items-center justify-center font-bold text-base transition-colors disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-sm text-zinc-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-zinc-800 flex items-center justify-center font-bold text-base transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div> */}

                    {/* Technical Specifications Accordion (Collapsed by Default) */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setShowTechSpecs(!showTechSpecs)}
                        className="w-full px-4 py-3 bg-white flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-zinc-700 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#FF6A00]" />
                          Technical Specifications
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${showTechSpecs ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showTechSpecs && (
                        <div className="p-4 bg-gray-50/70 text-xs text-gray-600 space-y-2 border-t border-gray-100">
                          <div className="flex justify-between py-1 border-b border-gray-200/60">
                            <span>Chip Type:</span>
                            <span className="text-zinc-800 font-medium font-mono">NXP NTAG213 / NTAG216 High Speed</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200/60">
                            <span>Operating Frequency:</span>
                            <span className="text-zinc-800 font-medium font-mono">13.56 MHz (ISO 14443A)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200/60">
                            <span>Compatibility:</span>
                            <span className="text-zinc-800 font-medium">Apple iPhone (iOS 13+) & all NFC Androids</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Durability:</span>
                            <span className="text-zinc-800 font-medium">IP68 Water-resistant, Scratch-resistant coating</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
            )}

                  {/* STEP 2: LINK DIGITAL PROFILE */}
                  {currentStep === 2 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                          Link Digital Profile
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Choose what happens when someone taps your physical NFC card with their phone.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Option A: Link an existing profile */}
                        <label
                          className={`block p-4 rounded-xl border cursor-pointer transition-all ${profileChoice === 'attach'
                            ? 'bg-[#FFF8F3] border-2 border-[#FF6A00] ring-1 ring-[#FF6A00]/20 shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="profileChoice"
                              checked={profileChoice === 'attach'}
                              onChange={() => setProfileChoice('attach')}
                              className="mt-1 text-[#FF6A00] focus:ring-[#FF6A00] accent-[#FF6A00]"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-zinc-900 block">
                                Link to one of my existing digital profiles
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5 block leading-relaxed">
                                Your physical card tap will immediately open your chosen live profile.
                              </span>

                              {profileChoice === 'attach' && (
                                <div className="mt-3.5 pt-3 border-t border-gray-200/70">
                                  {profilesLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
                                      Loading your profiles...
                                    </div>
                                  ) : profiles.length === 0 ? (
                                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800">
                                      No published profiles found on your account. Choose Free Concierge Setup below, and our team will build one for you!
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-zinc-700 block">Select Profile:</label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {profiles.map((p) => {
                                          const isSel = selectedProfileId === p.id;
                                          return (
                                            <div
                                              key={p.id}
                                              onClick={() => setSelectedProfileId(p.id)}
                                              className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${isSel
                                                ? 'bg-white border-2 border-[#FF6A00] text-zinc-900 shadow-xs'
                                                : 'bg-gray-50 border-gray-200 text-zinc-700 hover:border-gray-300'
                                                }`}
                                            >
                                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-zinc-700 overflow-hidden shrink-0">
                                                {p.avatarUrl ? (
                                                  <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  p.displayName.slice(0, 2).toUpperCase()
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate text-zinc-900">{p.displayName}</p>
                                                <p className="text-[11px] text-gray-500 font-mono truncate">/{p.slug}</p>
                                              </div>
                                              {isSel && <Check className="w-4 h-4 text-[#FF6A00] shrink-0" />}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>

                        {/* Option B: Free Concierge Assistance */}
                        <label
                          className={`block p-4 rounded-xl border cursor-pointer transition-all ${profileChoice === 'assistance'
                            ? 'bg-[#FFF8F3] border-2 border-[#FF6A00] ring-1 ring-[#FF6A00]/20 shadow-xs'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="profileChoice"
                              checked={profileChoice === 'assistance'}
                              onChange={() => setProfileChoice('assistance')}
                              className="mt-1 text-[#FF6A00] focus:ring-[#FF6A00] accent-[#FF6A00]"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-zinc-900 block">
                                Free Concierge Profile Setup
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5 block leading-relaxed">
                                Our digital identity specialists will contact you after order placement to design and configure your digital profile before dispatch.
                              </span>

                              {profileChoice === 'assistance' && (
                                <div className="mt-3">
                                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                                    Special Instructions or Details (Optional):
                                  </label>
                                  <textarea
                                    value={conciergeNotes}
                                    onChange={(e) => setConciergeNotes(e.target.value)}
                                    placeholder="e.g. Please use my LinkedIn link or contact me on WhatsApp for branding assets..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: DELIVERY ADDRESS */}
                  {currentStep === 3 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                            Delivery Address
                          </h2>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Choose where you want your physical NFC smart card delivered.
                          </p>
                        </div>

                        {savedAddresses.length > 0 && !isAddingNewAddress && (
                          <button
                            type="button"
                            onClick={() => setShowAddressPicker(true)}
                            className="text-xs font-semibold text-[#FF6A00] hover:underline transition-colors"
                          >
                            Change Address
                          </button>
                        )}
                      </div>

                      {/* Returning User: Saved Address Card Display */}
                      {savedAddresses.length > 0 && !isAddingNewAddress && selectedSavedAddress ? (
                        <div className="space-y-4">
                          <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-xs relative">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-zinc-900">
                                  {selectedSavedAddress.recipientName}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                                  {selectedSavedAddress.label === 'Home' && <Home className="w-3 h-3 text-[#FF6A00]" />}
                                  {selectedSavedAddress.label === 'Work' && <Briefcase className="w-3 h-3 text-[#FF6A00]" />}
                                  {selectedSavedAddress.customLabel || selectedSavedAddress.label}
                                </span>
                                {selectedSavedAddress.isDefault && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-[#FF6A00] border border-orange-200">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleStartEditAddress(selectedSavedAddress)}
                                className="text-xs text-gray-500 hover:text-zinc-900 flex items-center gap-1 p-1 rounded-md"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            </div>

                            <div className="text-xs text-gray-600 space-y-0.5 mt-2 leading-relaxed">
                              <p>{selectedSavedAddress.addressLine1}</p>
                              {selectedSavedAddress.addressLine2 && <p>{selectedSavedAddress.addressLine2}</p>}
                              <p>
                                {selectedSavedAddress.city}, {selectedSavedAddress.state} -{' '}
                                <span className="font-semibold text-zinc-800">{selectedSavedAddress.postalCode}</span>
                              </p>
                              <p className="text-gray-500 pt-1 font-mono">
                                Phone: <span className="text-zinc-800 font-medium">{selectedSavedAddress.phone}</span>
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setShowAddressPicker(true)}
                                className="text-xs font-semibold text-[#FF6A00] hover:underline"
                              >
                                Select a different address
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddressForm({
                                    fullName: sessionData?.user?.name || '',
                                    phone: '',
                                    email: sessionData?.user?.email || '',
                                    whatsappNumber: '',
                                    addressLine1: '',
                                    addressLine2: '',
                                    city: '',
                                    stateName: '',
                                    postalCode: '',
                                    country: 'India',
                                    deliveryInstructions: '',
                                    label: 'Home',
                                    customLabel: '',
                                    isDefault: false,
                                    saveForLater: true,
                                  });
                                  setEditingAddress(null);
                                  setIsAddingNewAddress(true);
                                }}
                                className="text-xs text-gray-600 hover:text-zinc-900 flex items-center gap-1 font-medium"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#FF6A00]" />
                                Add new address
                              </button>
                            </div>
                          </div>

                          {/* Delivery Instructions Input */}
                          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200">
                            <label className="text-xs font-semibold text-zinc-700 block mb-1">
                              Delivery Instructions for Courier (Optional):
                            </label>
                            <input
                              type="text"
                              value={orderDeliveryInstructions}
                              onChange={(e) => setOrderDeliveryInstructions(e.target.value)}
                              placeholder="e.g. Leave package with society guard, call before delivery..."
                              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-zinc-900 placeholder:text-gray-400 focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Manual Form for New Users or when adding/editing */
                        <div className="space-y-4">
                          {savedAddresses.length > 0 && (
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-xs font-semibold text-zinc-800">
                                {editingAddress ? 'Edit Address' : 'Enter New Delivery Address'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewAddress(false);
                                  setEditingAddress(null);
                                }}
                                className="text-xs text-gray-500 hover:text-zinc-900"
                              >
                                Cancel & Use Saved
                              </button>
                            </div>
                          )}

                          <AddressForm
                            values={addressForm}
                            onChange={handleAddressFieldChange}
                            fieldErrors={fieldErrors}
                            onClearError={(field) => {
                              setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next[field];
                                return next;
                              });
                            }}
                            showSaveOptions={Boolean(sessionData?.user)}
                            showInstructionsField={true}
                          />

                          {sessionData?.user && isAddingNewAddress && (
                            <div className="pt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewAddress(false);
                                  setEditingAddress(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-zinc-900 bg-gray-100 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveNewAddress}
                                disabled={isSavingAddress}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FF6A00] hover:bg-[#E85F00] transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                {isSavingAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {editingAddress ? 'Update Address' : 'Save Address'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: REVIEW AND PAYMENT */}
                  {currentStep === 4 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                          Review Your Order & Payment
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Review your order details and choose your preferred payment method.
                        </p>
                      </div>

                      {/* Shipping Summary */}
                      <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#FF6A00]" />
                            Shipping To
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-xs font-semibold text-[#FF6A00] hover:underline"
                          >
                            Change
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {savedAddresses.length > 0 && !isAddingNewAddress && selectedSavedAddress ? (
                            <>
                              <p className="font-bold text-zinc-900">{selectedSavedAddress.recipientName}</p>
                              <p>{selectedSavedAddress.addressLine1}, {selectedSavedAddress.city}, {selectedSavedAddress.state} - {selectedSavedAddress.postalCode}</p>
                              <p className="text-gray-500">Phone: {selectedSavedAddress.phone}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-zinc-900">{addressForm.fullName}</p>
                              <p>{addressForm.addressLine1}, {addressForm.city}, {addressForm.stateName} - {addressForm.postalCode}</p>
                              <p className="text-gray-500">Phone: {addressForm.phone}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-800 block">Select Payment Method</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            {
                              id: 'upi',
                              name: 'UPI / Instant QR',
                              desc: 'Pay using Google Pay, PhonePe, Paytm, or BHIM UPI.',
                              icon: QrCode,
                            },
                            {
                              id: 'razorpay',
                              name: 'Cards / Net Banking',
                              desc: 'Credit Card, Debit Card, Net Banking via secure gateway.',
                              icon: CreditCard,
                            },
                            {
                              id: 'cod',
                              name: 'Pay Upon Delivery',
                              desc: 'Pay cash or UPI upon package handover at your door.',
                              icon: Wallet,
                            },
                          ].map((pm) => {
                            const isSel = paymentMethod === pm.id;
                            const Icon = pm.icon;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setPaymentMethod(pm.id as any)}
                                className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${isSel
                                  ? 'bg-[#FFF8F3] border-2 border-[#FF6A00] ring-1 ring-[#FF6A00]/20 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <Icon className="w-4 h-4 text-[#FF6A00]" />
                                      <h3 className="text-xs font-bold text-zinc-900">{pm.name}</h3>
                                    </div>
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isSel
                                        ? 'border-[#FF6A00] bg-[#FF6A00] text-white'
                                        : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                      {isSel && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-relaxed">{pm.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Satisfaction Guarantee */}
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>100% Satisfaction Guarantee. Free replacement if card hardware is defective.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Order Summary (Desktop Sticky) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs sticky top-24">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                      <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
                      Order Summary
                    </h3>

                    {/* Product item row with Quantity adjustment */}
                    <div className="space-y-2 pb-2 border-b border-gray-100">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {getProductName(cardMaterial)}
                          </p>
                          <p className="text-[11px] text-gray-400">₹{unitPrice} per card</p>
                        </div>
                        <span className="font-bold text-zinc-900">₹{subtotal}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-gray-500 font-medium">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-zinc-800 flex items-center justify-center font-bold text-xs transition-colors disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-zinc-900">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-zinc-800 flex items-center justify-center font-bold text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Linked Profile Badge */}
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                      <span className="text-[11px] text-gray-500 block mb-0.5">Card Linked To:</span>
                      <span className="font-semibold text-[#FF6A00]">
                        {profileChoice === 'attach'
                          ? profiles.find((p) => p.id === selectedProfileId)?.displayName || 'Linked Profile'
                          : 'Free Concierge Setup'}
                      </span>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="text-zinc-800 font-medium">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Express Shipping:</span>
                        <span className={shippingCost === 0 ? 'text-emerald-700 font-semibold' : 'text-zinc-800 font-medium'}>
                          {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span className="text-zinc-800 font-medium">₹{taxAmount}</span>
                      </div>
                      <div className="pt-2.5 border-t border-gray-200 flex justify-between items-baseline text-sm font-bold text-zinc-900">
                        <span>Total Payable:</span>
                        <span className="text-lg font-bold text-[#FF6A00]">₹{totalAmount}</span>
                      </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="pt-2 hidden lg:flex flex-col gap-2">
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#FF6A00] hover:bg-[#E85F00] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {/* <span>Proceed to {STEPS[currentStep].label}</span> */}
                          <span>{`Proceed to ${STEPS[currentStep].label}`}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={isSubmittingOrder}
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#FF6A00] hover:bg-[#E85F00] text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingOrder ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing Order...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Place Order • ₹{totalAmount}</span>
                            </>
                          )}
                        </button>
                      )}

                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-600 hover:text-zinc-900 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          Back to {STEPS[currentStep - 2].label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
      </main>

          {/* Mobile Sticky Bottom Action Bar with Expandable Drawer */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            {/* Expandable Breakdown Drawer on Mobile */}
            {isMobileSummaryOpen && (
              <div className="p-4 border-b border-gray-200 bg-gray-50/95 space-y-2.5 text-xs text-gray-600 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex justify-between items-center font-bold text-zinc-900 pb-1.5 border-b border-gray-200">
                  <span>{getProductName(cardMaterial)}</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white text-zinc-800 flex items-center justify-center font-bold text-xs transition-colors disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-zinc-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white text-zinc-800 flex items-center justify-center font-bold text-xs transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Profile Association:</span>
                  <span className="font-semibold text-[#FF6A00]">
                    {profileChoice === 'attach'
                      ? profiles.find((p) => p.id === selectedProfileId)?.displayName || 'Linked Profile'
                      : 'Free Concierge Setup'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Express Shipping:</span>
                  <span className={shippingCost === 0 ? 'text-emerald-700 font-semibold' : 'text-zinc-800'}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span className="text-zinc-800">₹{taxAmount}</span>
                </div>
              </div>
            )}

            {/* Bottom Bar Controls */}
            <div className="p-3 px-4 flex items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                  className="flex items-center gap-1 text-[11px] text-gray-500 font-medium hover:text-zinc-900"
                >
                  <span>Total Payable</span>
                  {isMobileSummaryOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-lg font-bold text-[#FF6A00]">₹{totalAmount}</span>
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:text-zinc-900 transition-colors"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-[#FF6A00] hover:bg-[#E85F00] text-white shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmittingOrder}
                    className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-[#FF6A00] hover:bg-[#E85F00] text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Pay ₹{totalAmount}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Address Picker Modal (Light Theme) */}
          {showAddressPicker && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF6A00]" />
                      Select Delivery Address
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose from your saved addresses (Maximum 5 addresses saved)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-zinc-900 hover:bg-gray-100 transition-colors"
                    aria-label="Close address picker"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                  <SavedAddressesList
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    onSelect={(addr) => {
                      setSelectedAddressId(addr.id);
                      setShowAddressPicker(false);
                    }}
                    onAddNew={() => {
                      setAddressForm({
                        fullName: sessionData?.user?.name || '',
                        phone: '',
                        email: sessionData?.user?.email || '',
                        whatsappNumber: '',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        stateName: '',
                        postalCode: '',
                        country: 'India',
                        deliveryInstructions: '',
                        label: 'Home',
                        customLabel: '',
                        isDefault: false,
                        saveForLater: true,
                      });
                      setEditingAddress(null);
                      setIsAddingNewAddress(true);
                      setShowAddressPicker(false);
                    }}
                    onEdit={(addr) => handleStartEditAddress(addr)}
                    onDelete={(id) => handleDeleteAddress(id)}
                    onSetDefault={(id) => handleSetDefaultAddress(id)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        );
}
