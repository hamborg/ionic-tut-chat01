import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { redirectLoggedInTo, redirectUnauthorizedTo, canActivate } from "@angular/fire/auth-guard";
import { CheckUserGuard } from './guards/check-user.guard';

// Send unauthorized users to login
const redirectUnauthorizedToLogin = () =>  redirectUnauthorizedTo(['/login'])

// Automatically log in users
const redirectLoggedInToChat = () => redirectLoggedInTo(['/chat'])


const routes: Routes = [

  {
    path: '',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule),
    ...canActivate(redirectLoggedInToChat)
    // NOTE: Bemærk at canActivate sender os til Chat og vice versa
  },
  {
    path: 'chat',
    loadChildren: () => import('./pages/chat-list/chat-list.module').then( m => m.ChatListPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },  
  {
    path: 'chat/messages/:id',
    loadChildren: () => import('./pages/chat/chat.module').then( m => m.ChatPageModule),
    ...canActivate(redirectUnauthorizedToLogin),
    canActivate: [CheckUserGuard] // Check at uid passer til chat - hjemmelavet
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
