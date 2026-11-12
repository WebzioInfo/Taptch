import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Orders')
@Controller('api/v1/orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user card orders' })
  async getMyOrders(@CurrentActor() actor: ActorContext) {
    return this.ordersService.findAllForActor(actor);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create card order request' })
  async createOrder(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.ordersService.createOrder(actor, body);
  }
}

