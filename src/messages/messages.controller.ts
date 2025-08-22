import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.createAndRespond(id, dto);
  }

  @Get()
  async list(@Param('id') id: string) {
    return this.messagesService.findHistory(id);
  }
}
