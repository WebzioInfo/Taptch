import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { ProfilesService } from './profiles.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Profiles')
@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user digital profiles' })
  async getMyProfiles(@CurrentActor() actor: ActorContext) {
    return this.profilesService.findAllForActor(actor);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Public profile lookup with snapshot' })
  async getPublicProfile(@Param('slug') slug: string) {
    return this.profilesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile details for builder studio' })
  async getProfile(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.profilesService.findOne(actor, id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new profile draft' })
  async createProfile(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.profilesService.create(actor, body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile draft' })
  async updateProfile(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.profilesService.update(actor, id, body);
  }

  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish profile and pre-compile snapshot' })
  async publishProfile(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    return this.profilesService.publish(actor, id);
  }

  @Put(':id/sections')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder and update profile sections' })
  async updateSections(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { sections: any[] },
  ) {
    return this.profilesService.updateSections(actor, id, body?.sections || []);
  }
}
