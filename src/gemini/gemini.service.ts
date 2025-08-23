import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. Gemini calls will fail until provided.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async callModelForResponse(conversationId: string): Promise<string> {
    console.log('🤖 GeminiService: Starting callModelForResponse for conversation:', conversationId);
    
    try {
      if (!this.genAI) {
        throw new Error('Gemini API not initialized properly');
      }

      console.log('📚 Fetching message history...');
      const history = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      console.log('📚 History fetched, messages count:', history.length);

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      // Mapear los roles de tu base de datos a los roles de Gemini
      const geminiHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', // Cambio clave: assistant -> model
        parts: [{ text: msg.content }],
      }));

      console.log('🔄 Mapped history for Gemini:', geminiHistory.length, 'messages');

      const chat = model.startChat({
        history: geminiHistory,
      });

      // Obtener el último mensaje del usuario
      const lastUserMessage = history[history.length - 1];
      if (lastUserMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      console.log('📤 Sending message to Gemini:', lastUserMessage.content);
      const result = await chat.sendMessage(lastUserMessage.content);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Gemini response received:', text.substring(0, 100) + '...');
      return text;
    } catch (error) {
      console.error('❌ GeminiService error:', error);
      throw error;
    }
  }
}
