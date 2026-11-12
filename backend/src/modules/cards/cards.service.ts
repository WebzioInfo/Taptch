import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';

@Injectable()
export class CardsService {
  constructor(private dbService: DatabaseService) {}

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.ownerUserId, actor.userId))
        .orderBy(desc(schema.cards.createdAt));
    });
  }

  async linkCardToProfile(actor: ActorContext, cardId: string, profileId: string) {
    const cardRows = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.id, cardId))
        .limit(1);
    });

    if (cardRows.length === 0) {
      throw new NotFoundException(`Card ${cardId} not found.`);
    }

    const [updated] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .update(schema.cards)
        .set({
          profileId,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(schema.cards.id, cardId))
        .returning();
    });

    return updated;
  }
}
