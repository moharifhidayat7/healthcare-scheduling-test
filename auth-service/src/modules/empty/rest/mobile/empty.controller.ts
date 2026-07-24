import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CreateEmptyRequest } from './dto/create-empty.request';

@Controller('mobile/empty')
export class MobileEmptyController {
  @Get()
  findAll() {}

  @Get(':id')
  findById(@Param('id') id: string) {}

  @Post()
  create(@Body() body: CreateEmptyRequest) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateEmptyRequest>) {}

  @Delete(':id')
  delete(@Param('id') id: string) {}
}
