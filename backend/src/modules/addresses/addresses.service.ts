import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { savedAddresses } from '../../database/schema/addresses';
import { eq, and, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { ActorContext } from '../../common/types';

export interface CreateAddressDto {
  label?: 'Home' | 'Work' | 'Other';
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
  country?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export type UpdateAddressDto = Partial<CreateAddressDto>;

@Injectable()
export class AddressesService {
  constructor(private dbService: DatabaseService) {}

  /**
   * List all saved addresses for the authenticated user.
   * Sorted with default address first, then most recently used, then newest.
   */
  async findAll(actor: ActorContext) {
    return this.dbService.withActor(actor, async (db) => {
      const records = await db
        .select()
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, actor.userId))
        .orderBy(
          desc(savedAddresses.isDefault),
          desc(savedAddresses.lastUsedAt),
          desc(savedAddresses.createdAt)
        );
      return records;
    });
  }

  /**
   * Create a new saved address with validation, duplicate detection, and 5-address cap.
   */
  async create(actor: ActorContext, dto: CreateAddressDto) {
    this.validateAddressFields(dto);

    return this.dbService.withActor(actor, async (db) => {
      // 1. Fetch current addresses for this user
      const existing = await db
        .select()
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, actor.userId));

      // 2. Prevent exact duplicates (same name + phone + address_line1 + pincode)
      const cleanPhone = dto.phone.replace(/\D/g, '');
      const cleanPostal = dto.postalCode.replace(/\D/g, '');
      const cleanName = dto.recipientName.trim().toLowerCase();
      const cleanLine1 = dto.addressLine1.trim().toLowerCase();

      const duplicate = existing.find((a) => {
        return (
          a.recipientName.trim().toLowerCase() === cleanName &&
          a.phone.replace(/\D/g, '') === cleanPhone &&
          a.addressLine1.trim().toLowerCase() === cleanLine1 &&
          a.postalCode.replace(/\D/g, '') === cleanPostal
        );
      });

      if (duplicate) {
        // Update existing address with any updated details
        const [updated] = await db
          .update(savedAddresses)
          .set({
            label: dto.label || duplicate.label,
            customLabel: dto.customLabel !== undefined ? dto.customLabel : duplicate.customLabel,
            email: dto.email || duplicate.email,
            whatsappNumber: dto.whatsappNumber !== undefined ? dto.whatsappNumber : duplicate.whatsappNumber,
            addressLine2: dto.addressLine2 !== undefined ? dto.addressLine2 : duplicate.addressLine2,
            city: dto.city.trim(),
            state: dto.state.trim(),
            deliveryInstructions: dto.deliveryInstructions !== undefined ? dto.deliveryInstructions : duplicate.deliveryInstructions,
            updatedAt: new Date(),
          })
          .where(and(eq(savedAddresses.id, duplicate.id), eq(savedAddresses.userId, actor.userId)))
          .returning();
        return updated;
      }

      // 3. Enforce maximum 5 saved addresses per user
      if (existing.length >= 5) {
        throw new BadRequestException('Maximum 5 saved addresses reached. Please delete an address to add another.');
      }

      // 4. Default rule: first address is automatically default.
      const shouldBeDefault = existing.length === 0 ? true : Boolean(dto.isDefault);

      if (shouldBeDefault && existing.length > 0) {
        await db
          .update(savedAddresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(savedAddresses.userId, actor.userId));
      }

      const id = `addr_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
      const [newAddress] = await db
        .insert(savedAddresses)
        .values({
          id,
          userId: actor.userId,
          label: dto.label || 'Home',
          customLabel: dto.customLabel || null,
          recipientName: dto.recipientName.trim(),
          phone: cleanPhone,
          email: dto.email?.trim() || null,
          whatsappNumber: dto.whatsappNumber?.replace(/\D/g, '') || null,
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2?.trim() || null,
          city: dto.city.trim(),
          state: dto.state.trim(),
          postalCode: cleanPostal,
          country: dto.country?.trim() || 'India',
          deliveryInstructions: dto.deliveryInstructions?.trim() || null,
          isDefault: shouldBeDefault,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newAddress;
    });
  }

  /**
   * Update an existing address belonging to the user.
   */
  async update(id: string, actor: ActorContext, dto: UpdateAddressDto) {
    if (
      dto.recipientName !== undefined ||
      dto.phone !== undefined ||
      dto.addressLine1 !== undefined ||
      dto.city !== undefined ||
      dto.state !== undefined ||
      dto.postalCode !== undefined
    ) {
      this.validateAddressFields(dto as CreateAddressDto, true);
    }

    return this.dbService.withActor(actor, async (db) => {
      const [existing] = await db
        .select()
        .from(savedAddresses)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)))
        .limit(1);

      if (!existing) {
        throw new NotFoundException('Saved address not found.');
      }

      if (dto.isDefault === true) {
        await db
          .update(savedAddresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(savedAddresses.userId, actor.userId));
      }

      const updateData: Partial<typeof savedAddresses.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.label !== undefined) updateData.label = dto.label;
      if (dto.customLabel !== undefined) updateData.customLabel = dto.customLabel || null;
      if (dto.recipientName !== undefined) updateData.recipientName = dto.recipientName.trim();
      if (dto.phone !== undefined) updateData.phone = dto.phone.replace(/\D/g, '');
      if (dto.email !== undefined) updateData.email = dto.email.trim() || null;
      if (dto.whatsappNumber !== undefined) updateData.whatsappNumber = dto.whatsappNumber.replace(/\D/g, '') || null;
      if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1.trim();
      if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2?.trim() || null;
      if (dto.city !== undefined) updateData.city = dto.city.trim();
      if (dto.state !== undefined) updateData.state = dto.state.trim();
      if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode.replace(/\D/g, '');
      if (dto.country !== undefined) updateData.country = dto.country.trim() || 'India';
      if (dto.deliveryInstructions !== undefined) updateData.deliveryInstructions = dto.deliveryInstructions?.trim() || null;
      if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

      const [updated] = await db
        .update(savedAddresses)
        .set(updateData)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)))
        .returning();

      return updated;
    });
  }

  /**
   * Delete an address.
   * If deleting the default address, automatically promotes the most recently used one to default.
   */
  async delete(id: string, actor: ActorContext) {
    return this.dbService.withActor(actor, async (db) => {
      const [addressToDelete] = await db
        .select()
        .from(savedAddresses)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)))
        .limit(1);

      if (!addressToDelete) {
        throw new NotFoundException('Saved address not found.');
      }

      const wasDefault = addressToDelete.isDefault;

      await db
        .delete(savedAddresses)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)));

      // If the deleted address was default, promote the most recently used/created remaining address
      if (wasDefault) {
        const [candidate] = await db
          .select()
          .from(savedAddresses)
          .where(eq(savedAddresses.userId, actor.userId))
          .orderBy(desc(savedAddresses.lastUsedAt), desc(savedAddresses.createdAt))
          .limit(1);

        if (candidate) {
          await db
            .update(savedAddresses)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(savedAddresses.id, candidate.id));
        }
      }

      return { success: true, message: 'Address removed successfully.' };
    });
  }

  /**
   * Set a specific address as the user's default address.
   */
  async setDefault(id: string, actor: ActorContext) {
    return this.dbService.withActor(actor, async (db) => {
      const [target] = await db
        .select()
        .from(savedAddresses)
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)))
        .limit(1);

      if (!target) {
        throw new NotFoundException('Saved address not found.');
      }

      // Reset all other addresses to false
      await db
        .update(savedAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(savedAddresses.userId, actor.userId));

      // Set target to true
      const [updated] = await db
        .update(savedAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(savedAddresses.id, id))
        .returning();

      return updated;
    });
  }

  /**
   * Record that a saved address was used for an order (updates last_used_at timestamp).
   */
  async recordUsage(id: string, actor: ActorContext) {
    return this.dbService.withActor(actor, async (db) => {
      await db
        .update(savedAddresses)
        .set({ lastUsedAt: new Date() })
        .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, actor.userId)));
      return { success: true };
    });
  }

  /**
   * Private validation helper ensuring strict format requirements.
   */
  private validateAddressFields(dto: CreateAddressDto, isPartial = false) {
    if (!isPartial || dto.recipientName !== undefined) {
      if (!dto.recipientName || dto.recipientName.trim().length < 2) {
        throw new BadRequestException('Recipient name must be at least 2 characters long.');
      }
    }

    if (!isPartial || dto.phone !== undefined) {
      const cleanPhone = (dto.phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new BadRequestException('Please enter a valid 10-digit mobile phone number.');
      }
    }

    if (!isPartial || dto.addressLine1 !== undefined) {
      if (!dto.addressLine1 || dto.addressLine1.trim().length < 5) {
        throw new BadRequestException('Street address must be at least 5 characters long.');
      }
    }

    if (!isPartial || dto.city !== undefined) {
      if (!dto.city || !dto.city.trim()) {
        throw new BadRequestException('City is required.');
      }
    }

    if (!isPartial || dto.state !== undefined) {
      if (!dto.state || !dto.state.trim()) {
        throw new BadRequestException('State is required.');
      }
    }

    if (!isPartial || dto.postalCode !== undefined) {
      const cleanPostal = (dto.postalCode || '').replace(/\D/g, '');
      if (cleanPostal.length !== 6) {
        throw new BadRequestException('Please enter a valid 6-digit Indian PIN code.');
      }
    }

    if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email.trim())) {
      throw new BadRequestException('Please enter a valid email address.');
    }
  }
}
