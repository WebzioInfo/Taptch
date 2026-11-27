import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { ProfilesService } from './profiles.service';
import { LeadsService } from '../leads/leads.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Profiles')
@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(
    private profilesService: ProfilesService,
    private leadsService: LeadsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user digital profiles' })
  async getMyProfiles(@CurrentActor() actor: ActorContext) {
    return this.profilesService.findAllForActor(actor);
  }

  @Public()
  @Get('check-username/:username')
  @ApiOperation({ summary: 'Check if a profile username is valid and available' })
  async checkUsername(@Param('username') username: string) {
    return this.profilesService.checkUsernameAvailability(username);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Public profile lookup with snapshot' })
  async getPublicProfile(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const profile = await this.profilesService.findBySlug(slug);
    if (res) {
      res.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    return profile;
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

  @Public()
  @Post(':id/exchange')
  @ApiOperation({ summary: 'Submit contact exchange on public profile' })
  async exchangeContact(@Param('id') id: string, @Body() body: any) {
    return this.leadsService.captureLead({ profileId: id, ...body });
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

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile and release entitlement' })
  async deleteProfile(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    return this.profilesService.remove(actor, id);
  }
}

