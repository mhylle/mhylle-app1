import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateMessageDto, MessageResponseDto } from './message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getInfo() {
    return this.appService.getInfo();
  }

  @Post('messages')
  async createMessage(@Body() createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    return this.appService.createMessage(createMessageDto);
  }

  @Get('messages')
  async getAllMessages(): Promise<MessageResponseDto[]> {
    return this.appService.getAllMessages();
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string): Promise<void> {
    return this.appService.deleteMessage(parseInt(id));
  }
}
