import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { AddressesService, CreateAddressDto, UpdateAddressDto } from './addresses.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Saved Addresses')
@Controller('api/v1/addresses')
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all saved addresses for the current user' })
  async listAddresses(@CurrentActor() actor: ActorContext) {
    return this.addressesService.findAll(actor);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a new delivery address' })
  async createAddress(@CurrentActor() actor: ActorContext, @Body() body: CreateAddressDto) {
    return this.addressesService.create(actor, body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing saved address' })
  async updateAddress(
    @Param('id') id: string,
    @CurrentActor() actor: ActorContext,
    @Body() body: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, actor, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a saved address' })
  async deleteAddress(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.addressesService.delete(id, actor);
  }

  @Post(':id/default')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set an address as the default' })
  async setDefaultAddress(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.addressesService.setDefault(id, actor);
  }

  @Post(':id/use')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record usage of an address for checkout analytics' })
  async recordAddressUsage(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.addressesService.recordUsage(id, actor);
  }
}
