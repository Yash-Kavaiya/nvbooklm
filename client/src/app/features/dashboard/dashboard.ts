import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatRippleModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  notebooks = [
    { id: '1', title: 'Earnings reports for top 50 corporations', date: '18 Apr 2025', sources: 168, cover: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)' },
    { id: '2', title: 'How do scientists link genetics to health?', date: '9 Jul 2025', sources: 16, cover: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
    { id: '3', title: 'Globalisation since 1997', date: '4 Nov 2025', sources: 26, cover: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)' },
    { id: '4', title: 'OpenStax Biology', date: '31 Jul 2025', sources: 13, cover: 'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)' },
  ];
}
