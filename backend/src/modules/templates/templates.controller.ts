import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('api/v1/templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available luxury templates' })
  async getTemplates() {
    return this.templatesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get template definition by ID' })
  async getTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
