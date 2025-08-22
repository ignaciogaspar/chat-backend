import { Controller, Get, Post, Param, Delete, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create() {
    return this.conversationsService.create();
  }

  @Get()
  async findAll() {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const conversation = await this.conversationsService.findOne(id);
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }
    return conversation;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.conversationsService.remove(id);
  }
}
