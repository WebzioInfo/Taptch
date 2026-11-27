import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('api/v1/templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available luxury templates' })
  @ApiQuery({ name: 'accountType', required: false, enum: ['personal', 'business'] })
  @ApiQuery({ name: 'templateType', required: false, enum: ['PERSONAL', 'BUSINESS'] })
  async getTemplates(
    @Query('accountType') accountType?: 'personal' | 'business',
    @Query('templateType') templateType?: 'PERSONAL' | 'BUSINESS'
  ) {
    return this.templatesService.findAll({ accountType, templateType });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get template definition by ID' })
  async getTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}

