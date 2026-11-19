export interface SavedAddress {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other';
  customLabel?: string | null;
  recipientName: string;
  phone: string;
  email?: string | null;
  whatsappNumber?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
}

export interface AddressFormData {
  label: 'Home' | 'Work' | 'Other';
  customLabel?: string;
  recipientName: string;
  phone: string;
  email?: string;
  whatsappNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}
