import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell/app-shell';
import { DashboardComponent } from './features/dashboard/dashboard';
import { NotebookLayoutComponent } from './features/notebook/notebook-layout/notebook-layout';
import { LoginComponent } from './features/auth/login/login';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'notebook/:id', component: NotebookLayoutComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
