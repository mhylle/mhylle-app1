import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/message';
import { Message, CreateMessage } from '../../models/message.interface';

@Component({
  selector: 'app-message-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-manager.html',
  styleUrl: './message-manager.css'
})
export class MessageManagerComponent implements OnInit {
  messages: Message[] = [];
  newMessage: CreateMessage = { content: '', author: '' };
  loading = false;
  error = '';

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.loading = true;
    this.error = '';
    
    this.messageService.getAllMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.error = 'Error loading messages. Please check if the backend is running.';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (!this.newMessage.content.trim()) {
      this.error = 'Please enter a message';
      return;
    }

    this.loading = true;
    this.error = '';

    const messageToSend = {
      content: this.newMessage.content.trim(),
      author: this.newMessage.author?.trim() || 'Anonymous'
    };

    this.messageService.createMessage(messageToSend).subscribe({
      next: (savedMessage) => {
        this.messages.unshift(savedMessage);
        this.newMessage = { content: '', author: '' };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving message:', error);
        this.error = 'Error saving message. Please try again.';
        this.loading = false;
      }
    });
  }

  deleteMessage(id: number) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    this.messageService.deleteMessage(id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== id);
      },
      error: (error) => {
        console.error('Error deleting message:', error);
        this.error = 'Error deleting message. Please try again.';
      }
    });
  }
}
