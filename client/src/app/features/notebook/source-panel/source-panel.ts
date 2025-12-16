import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-source-panel',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './source-panel.html',
  styleUrl: './source-panel.scss'
})
export class SourcePanelComponent {
  @Input() sources: any[] = [];
}
