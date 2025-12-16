import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SourcePanelComponent } from '../source-panel/source-panel';
import { ChatInterfaceComponent } from '../chat-interface/chat-interface';

@Component({
  selector: 'app-notebook-layout',
  standalone: true,
  imports: [CommonModule, SourcePanelComponent, ChatInterfaceComponent],
  templateUrl: './notebook-layout.html',
  styleUrl: './notebook-layout.scss'
})
export class NotebookLayoutComponent {
  sources = [
    { id: 1, title: 'Annual Report 2024.pdf', type: 'pdf' },
    { id: 2, title: 'Meeting Notes.docx', type: 'doc' },
    { id: 3, title: 'Company Website', type: 'web' }
  ];

  messages = [
    { role: 'model', content: 'Hello! I have analyzed the sources you uploaded. What would you like to know about them?' }
  ];
}
