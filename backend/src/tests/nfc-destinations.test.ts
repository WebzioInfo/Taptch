import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CardsService } from '../modules/cards/cards.service';

  describe('CardsService — Username-Based NFC Profiles & Legacy Token Compatibility', () => {
    let cardsService: CardsService;
    let mockDbService: any;

    beforeEach(() => {
      mockDbService = {
        db: {
          select: vi.fn(),
        },
        withActor: vi.fn(),
      };
      cardsService = new CardsService(mockDbService);
    });

      it('rejects custom_url destinationType with BadRequestException (profile-only NFC)', async () => {
        await expect(
          cardsService.setPurchasedCardDestination(
            { userId: 'user_1', orgId: null, role: 'user', isAdmin: false },
            'card_1',
            { destinationType: 'custom_url' as any },
          ),
        ).rejects.toThrow(BadRequestException);
      });

        it('rejects card attachment from non-owners with ForbiddenException', async () => {
          mockDbService.withActor.mockImplementation(async (_actor: any, fn: any) => {
            return fn({
              select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      { id: 'card_1', userId: 'owner_user', redirectToken: 'tok123' },
                    ]),
                  }),
                }),
              }),
            });
          });

          await expect(
              cardsService.attachProfileToPurchasedCard(
                { userId: 'attacker_user', orgId: null, role: 'user', isAdmin: false },
                'card_1',
                'prof_1',
              ),
            ).rejects.toThrow(ForbiddenException);
        });

          it('rejects attaching another customer profile with ForbiddenException', async () => {
            let callCount = 0;
            mockDbService.withActor.mockImplementation(async (_actor: any, fn: any) => {
              return fn({
                select: vi.fn().mockImplementation(() => ({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockImplementation(async () => {
                        callCount += 1;
                        if (callCount === 1) {
                          return [{ id: 'card_1', userId: 'user_1', redirectToken: 'tok123' }];
                        }
                        return [{ id: 'prof_other', ownerId: 'other_user', slug: 'other' }];
                      }),
                    }),
                  }),
                })),
              });
            });

            await expect(
              cardsService.attachProfileToPurchasedCard(
                { userId: 'user_1', orgId: null, role: 'user', isAdmin: false },
                'card_1',
                'prof_other',
              ),
            ).rejects.toThrow(ForbiddenException);
          });

          it('buildCanonicalNfcUrl always generates permanent https://taptch.com/p/{token} regardless of username', () => {
            expect(
              cardsService.buildCanonicalNfcUrl({
                profileUsername: 'john',
                redirectToken: '50f8b595acd3',
              }),
            ).toBe('https://taptch.com/p/50f8b595acd3');

            expect(
              cardsService.buildCanonicalNfcUrl({
                profileUsername: 'acmecompany',
                profileType: 'business',
                redirectToken: 'abc123def456',
              }),
            ).toBe('https://taptch.com/p/abc123def456');
          });

          it('resolvePublicNfcToken resolves legacy token to /{username} and unconfigured states safely', async () => {
            // 1. Legacy purchased card linked to published profile
            mockDbService.db.select
              .mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([]),
                  }),
                }),
              })
              .mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      { id: 'pc_1', redirectToken: 'tok_legacy', profileId: 'prof_1' },
                    ]),
                  }),
                }),
              })
              .mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      { slug: 'john', status: 'PUBLISHED', profileType: 'personal' },
                    ]),
                  }),
                }),
              });

              const activeRes = await cardsService.resolvePublicNfcToken('tok_legacy');
              expect(activeRes).toEqual({
                status: 'active',
                destinationType: 'profile',
                destinationUrl: '/john',
                profileSlug: 'john',
                profileType: 'personal',
              });

              // 2. Unconfigured card
              mockDbService.db.select
                .mockReturnValueOnce({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([]),
                    }),
                  }),
                })
                .mockReturnValueOnce({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([
                        { id: 'pc_2', redirectToken: 'tok_empty', profileId: null },
                      ]),
                    }),
                  }),
                });

              const emptyRes = await cardsService.resolvePublicNfcToken('tok_empty');
              expect(emptyRes).toEqual({
                status: 'unconfigured',
                destinationType: null,
                destinationUrl: null,
              });
            });

            it('resolvePublicNfcToken falls back to published profile slug for legacy /p/:slug URLs', async () => {
              mockDbService.db.select
                .mockReturnValueOnce({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([]),
                    }),
                  }),
                })
                .mockReturnValueOnce({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([]),
                    }),
                  }),
                })
                .mockReturnValueOnce({
                  from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([
                        { slug: 'sinan', status: 'PUBLISHED', profileType: 'personal' },
                      ]),
                    }),
                  }),
                });

              const slugRes = await cardsService.resolvePublicNfcToken('sinan', 'personal');
              expect(slugRes).toEqual({
                status: 'active',
                destinationType: 'profile',
                destinationUrl: '/sinan',
                profileSlug: 'sinan',
                profileType: 'personal',
              });
            });
          });
