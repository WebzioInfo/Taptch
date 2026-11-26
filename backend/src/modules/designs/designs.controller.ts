import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { DesignsService } from './designs.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Designs')
@Controller('api/v1/designs')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DesignsController {
  constructor(private designsService: DesignsService) { }

  @Get()
  @ApiOperation({ summary: 'List customer saved card designs' })
  async getMyDesigns(@CurrentActor() actor: ActorContext) {
    return this.designsService.findAllForActor(actor);
  }

  @Get('draft')
  @ApiOperation({ summary: 'Get template draft design' })
  async getDraft(
    @CurrentActor() actor: ActorContext,
    @Query('productId') productId: string,
    @Query('templateId') templateId?: string
  ) {
    return this.designsService.findDraft(actor, productId, templateId);
  }

  @Post('draft')
  @ApiOperation({ summary: 'Upsert template draft design (autosave)' })
  async upsertDraft(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.designsService.upsertDraft(actor, body);
  }

  @Post('reset-draft')
  @ApiOperation({ summary: 'Reset draft back to original template layout' })
  async resetDraft(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.designsService.resetDraft(actor, body.productId, body.templateId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new card design instance' })
  async createDesign(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.designsService.create(actor, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific card design state' })
  async getDesign(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.designsService.findOne(actor, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update existing card design' })
  async updateDesign(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.designsService.update(actor, id, body);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate card design' })
  async duplicateDesign(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.designsService.duplicate(actor, id);
  }

  @Post(':id/attach-profile')
  @ApiOperation({ summary: 'Attach a card design to a customer digital profile' })
  async attachProfile(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { profileId: string },
  ) {
    return this.designsService.attachProfile(actor, id, body?.profileId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete card design' })
  async deleteDesign(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.designsService.delete(actor, id);
  }
}
