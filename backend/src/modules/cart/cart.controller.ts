import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Cart')
@Controller('api/v1/cart')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) { }

  @Get()
  @ApiOperation({ summary: 'Get current customer cart summary' })
  async getCart(@CurrentActor() actor: ActorContext) {
    return this.cartService.getCart(actor);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add customized design or product to cart' })
  async addItem(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.cartService.addItem(actor, body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.cartService.removeItem(actor, id);
  }
}
