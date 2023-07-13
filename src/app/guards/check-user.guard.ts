import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { User } from '../models/user';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { MessageService } from '../services/message.service';

@Injectable({
  providedIn: 'root'
})
export class CheckUserGuard implements CanActivate {

  constructor(
    private authLoginService: AuthService,
    private chatService: ChatService,
    private messageService: MessageService,
    private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Get Url-id:
    const cid = route.paramMap.get('id')

    // Get current user:
    const uid = this.authLoginService.getStorageUser("chat guard")
    // NB: Virker, men er ikke sikker på, dette er korrekt metode...
    //      Kan vi være sikre på, at locSto altid har den mest opdaterede user?
    //      (Men tidligere benyttede Promise virkede ikke rigtigt...)

    // Get chat users:
    let acceptedUsers: any[] = [];
    return this.chatService.getChatUsers(cid).pipe(map((users: any) => {
      console.log("(guard) users: ", users)

      if (!users) { // Navigate back? (Det her sker jo aldrig i virkeligheden...)
        // this.router.navigate(['/']);
        console.log(`NO USERS in the ${cid}!?!?`)
        return true
      }

      users.forEach((user: any) => acceptedUsers.push(user.uid))
      if (acceptedUsers.includes(uid)) {
        return true
      } else {
        this.router.navigate(['/']);
        return false
      }

    }))
  }


} // End Class