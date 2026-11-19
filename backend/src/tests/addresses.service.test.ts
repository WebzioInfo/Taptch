import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressesService, type CreateAddressDto } from '../modules/addresses/addresses.service';
import type { ActorContext } from '../common/types';

describe('AddressesService — Saved Addresses Feature', () => {
  let mockDbService: any;
  let addressesService: AddressesService;

  const mockActor: ActorContext = {
    userId: 'usr_address_test_1',
    orgId: null,
    role: 'user',
    isAdmin: false,
  };

  const sampleAddressDto: CreateAddressDto = {
    label: 'Home',
    recipientName: 'Alexander Vance',
    phone: '9876543210',
    email: 'alexander@taptch.com',
    whatsappNumber: '9876543210',
    addressLine1: 'Suite 400, 100 Tech Park',
    addressLine2: 'Near Metro',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    deliveryInstructions: 'Leave with reception',
    isDefault: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation & Constraints', () => {
    it('rejects recipient name with less than 2 characters', async () => {
      mockDbService = { withActor: vi.fn() };
      addressesService = new AddressesService(mockDbService);

      await expect(
        addressesService.create(mockActor, { ...sampleAddressDto, recipientName: 'A' }),
      ).rejects.toThrow('Recipient name must be at least 2 characters long.');
    });

    it('rejects phone numbers with less than 10 digits', async () => {
      mockDbService = { withActor: vi.fn() };
      addressesService = new AddressesService(mockDbService);

      await expect(
        addressesService.create(mockActor, { ...sampleAddressDto, phone: '12345' }),
      ).rejects.toThrow('Please enter a valid 10-digit mobile phone number.');
    });

    it('rejects postal code that is not 6 digits', async () => {
      mockDbService = { withActor: vi.fn() };
      addressesService = new AddressesService(mockDbService);

      await expect(
        addressesService.create(mockActor, { ...sampleAddressDto, postalCode: '5600' }),
      ).rejects.toThrow('Please enter a valid 6-digit Indian PIN code.');
    });
  });

  describe('Business Rules & Cap Limits', () => {
    it('sets first saved address as default automatically', async () => {
      let storedValues: any = null;
      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeDb = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]), // 0 existing addresses
              }),
            }),
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockImplementation((val) => {
                storedValues = val;
                return { returning: vi.fn().mockResolvedValue([val]) };
              }),
            }),
          };
          return callback(fakeDb);
        }),
      };

      addressesService = new AddressesService(mockDbService);
      const res = await addressesService.create(mockActor, { ...sampleAddressDto, isDefault: false });

      expect(storedValues.isDefault).toBe(true);
      expect(res.isDefault).toBe(true);
    });

    it('enforces maximum 5 saved addresses per user', async () => {
      const existingFive = [
        { id: '1', recipientName: 'A1', phone: '9000000001', addressLine1: 'Line 1', postalCode: '560001' },
        { id: '2', recipientName: 'A2', phone: '9000000002', addressLine1: 'Line 2', postalCode: '560002' },
        { id: '3', recipientName: 'A3', phone: '9000000003', addressLine1: 'Line 3', postalCode: '560003' },
        { id: '4', recipientName: 'A4', phone: '9000000004', addressLine1: 'Line 4', postalCode: '560004' },
        { id: '5', recipientName: 'A5', phone: '9000000005', addressLine1: 'Line 5', postalCode: '560005' },
      ];

      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeDb = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(existingFive),
              }),
            }),
          };
          return callback(fakeDb);
        }),
      };

      addressesService = new AddressesService(mockDbService);
      await expect(
        addressesService.create(mockActor, {
          ...sampleAddressDto,
          recipientName: 'New Person',
          phone: '9999999999',
          addressLine1: 'New Unique Address',
          postalCode: '560099',
        }),
      ).rejects.toThrow('Maximum 5 saved addresses reached. Please delete an address to add another.');
    });

    it('detects exact duplicate and updates existing address instead of creating new row', async () => {
      const existing = [
        {
          id: 'addr_existing_1',
          userId: mockActor.userId,
          label: 'Old Label',
          recipientName: 'Alexander Vance',
          phone: '9876543210',
          email: 'alex@old.com',
          addressLine1: 'Suite 400, 100 Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          isDefault: true,
        },
      ];

      let updatedData: any = null;
      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeDb = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(existing),
              }),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockImplementation((val) => {
                updatedData = val;
                return {
                  where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...existing[0], ...val }]),
                  }),
                };
              }),
            }),
          };
          return callback(fakeDb);
        }),
      };

      addressesService = new AddressesService(mockDbService);
      const res = await addressesService.create(mockActor, {
        ...sampleAddressDto,
        label: 'Work', // Updated label
        deliveryInstructions: 'Ring bell twice',
      });

      expect(res.id).toBe('addr_existing_1');
      expect(updatedData.label).toBe('Work');
      expect(updatedData.deliveryInstructions).toBe('Ring bell twice');
    });

    it('promotes most recently used address to default when default address is deleted', async () => {
      const targetToDelete = {
        id: 'addr_del_1',
        userId: mockActor.userId,
        isDefault: true,
      };

      const remainingAddresses = [
        { id: 'addr_rem_1', userId: mockActor.userId, lastUsedAt: new Date('2026-11-17'), createdAt: new Date('2026-11-10') },
      ];

      let promotedId: any = null;
      mockDbService = {
        withActor: vi.fn().mockImplementation((actor, callback) => {
          const fakeDb = {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([targetToDelete]),
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([remainingAddresses[0]]),
                  }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockImplementation((val) => {
                return {
                  where: vi.fn().mockImplementation(() => {
                    promotedId = remainingAddresses[0].id;
                    return Promise.resolve();
                  }),
                };
              }),
            }),
          };
          return callback(fakeDb);
        }),
      };

      addressesService = new AddressesService(mockDbService);
      const res = await addressesService.delete('addr_del_1', mockActor);

      expect(res.success).toBe(true);
      expect(promotedId).toBe('addr_rem_1');
    });
  });
});
