import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List physical NFC card products' })
  async getProducts() {
    return this.productsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get card product by ID or slug' })
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get(':id/templates')
  @ApiOperation({ summary: 'Get compatible design templates for a card product' })
  async getProductTemplates(@Param('id') id: string) {
    return this.productsService.findTemplatesForProduct(id);
  }
}
