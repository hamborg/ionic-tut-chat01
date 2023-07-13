import { Component, OnInit } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, Firestore, setDoc, orderBy, query, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Chat } from '../../models/chat';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.page.html',
  styleUrls: ['./chat-list.page.scss'],
})
export class ChatListPage implements OnInit {

  chats$: Observable<Chat[]>  | undefined  = this.chatService.getAllChats()

  constructor(
    private chatService: ChatService,
    private router: Router,
    private authLoginService: AuthService,
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  /* --- Chat-list page functions --- */

  newChat() {
    this.chatService.createNewChat() // NB: fungerer stadig med dummy-chat-db
  }

  /* --- App functions --- */

  logout() {
    this.authLoginService.signOut()
  }


  /* --- Dummy functions --- */
  showHideAll() {
    console.log("(Se kun dine, eller alles beskeder!)")
  }
}
