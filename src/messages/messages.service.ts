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
    console.log('🔵 Starting createAndRespond with:', { conversationId, content: dto.content });
    
    try {
      // Verificar que la conversación existe
      console.log('🔍 Checking if conversation exists...');
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      
      if (!conversation) {
        console.log('❌ Conversation not found:', conversationId);
        throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
      }
      console.log('✅ Conversation found:', conversation.id);

      // 1. Persist user message
      console.log('💾 Saving user message...');
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'user',
          content: dto.content,
        },
      });
      console.log('✅ User message saved:', userMessage.id);

      // 2. Call Gemini for a response
      console.log('🤖 Calling Gemini API...');
      const assistantText = await this.gemini.callModelForResponse(conversationId);
      console.log('✅ Gemini response received, length:', assistantText.length);

      // 3. Persist assistant's response
      console.log('💾 Saving assistant message...');
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantText,
        },
      });
      console.log('✅ Assistant message saved:', assistantMessage.id);

      // 4. Return only the assistant message (lo que espera tu frontend)
      return assistantMessage;
    } catch (error) {
      console.error('❌ Error in createAndRespond:', error);
      
      if (error?.status === 429) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Log the full error for debugging
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      throw new HttpException(
        `Error processing message: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
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
