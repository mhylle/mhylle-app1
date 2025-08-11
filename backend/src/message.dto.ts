export class CreateMessageDto {
  content: string;
  author?: string;
}

export class MessageResponseDto {
  id: number;
  content: string;
  author?: string;
  createdAt: Date;
}
