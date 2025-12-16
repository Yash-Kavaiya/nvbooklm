import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.scss'
})
export class ChatInterfaceComponent {
  @Input() messages: any[] = [];
  newMessage = '';

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.messages.push({ role: 'user', content: this.newMessage });

    // Simulate thinking
    setTimeout(() => {
      this.messages.push({ role: 'model', content: 'This is a simulated response. The backend is not connected yet.' });
    }, 1000);

    this.newMessage = '';
  }
}
