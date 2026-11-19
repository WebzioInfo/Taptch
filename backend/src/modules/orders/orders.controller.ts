import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { OrdersService, CreateOrderDto, VerifyPaymentDto } from './orders.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Orders')
@Controller('api/v1/orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) { }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user card orders' })
  async getMyOrders(@CurrentActor() actor: ActorContext) {
    return this.ordersService.findAllForActor(actor);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single card order with tracking timeline' })
  async getOrderById(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.ordersService.findOneForActor(id, actor);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create card order request' })
  async createOrder(@CurrentActor() actor: ActorContext, @Body() body: CreateOrderDto) {
      return this.ordersService.createOrder(actor, body);
    }

    @Post(':id/verify-payment')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify payment authorization (Razorpay / UPI test simulation)' })
    async verifyPayment(
      @Param('id') id: string,
      @CurrentActor() actor: ActorContext,
      @Body() body: VerifyPaymentDto,
    ) {
      return this.ordersService.verifyPayment(id, actor, body);
    }

    @Post(':id/cancel')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel pending or confirmed card order' })
    async cancelOrder(
      @Param('id') id: string,
      @CurrentActor() actor: ActorContext,
      @Body() body: { reason?: string },
    ) {
      return this.ordersService.cancelOrder(id, actor, body?.reason);
    }
  }

