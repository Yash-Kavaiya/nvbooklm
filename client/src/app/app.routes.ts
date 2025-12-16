import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell/app-shell';
import { DashboardComponent } from './features/dashboard/dashboard';
import { NotebookLayoutComponent } from './features/notebook/notebook-layout/notebook-layout';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'notebook/:id', component: NotebookLayoutComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
