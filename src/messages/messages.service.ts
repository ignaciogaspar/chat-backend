import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async createAndRespond(conversationId: string, dto: CreateMessageDto) {
    // 1. Persist user message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    try {
      // 2. Call Gemini for a response, providing the full conversation history
      const assistantText = await this.gemini.callModelForResponse(conversationId);

      // 3. Persist assistant's response
      const assistantMsg = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantText,
        },
      });

      // 4. Return the latest assistant message
      return assistantMsg;
    } catch (err) {
      if (err?.status === 429) {
        throw new HttpException('Rate limit from Gemini', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new HttpException('Error contacting Gemini', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findHistory(conversationId: string) {
    // Primero verificamos si la conversación existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }
    
    // Si existe, entonces devolvemos sus mensajes
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
