import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { addDoc, collection, collectionData, doc, docData, Firestore, updateDoc, orderBy, query, serverTimestamp, where, WhereFilterOp } from '@angular/fire/firestore';
import 'firebase/firestore';
import { Observable, of, Subscription } from 'rxjs';
import { map, switchMap, filter, tap, first, retry, exhaustMap, concatMap, last } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { MessageService } from './message.service';
import { Chat, NewChat } from '../models/chat';
import { Message } from '../models/message';
// import { Timestamp } from 'rxjs/dist/types/internal/types';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  public chats$!: Observable<Chat[]>;

  constructor(
    private router: Router,
    private Auth: AuthService,
    // !!! private messageService: MessageService, // !!! OBS: Dette må man ikke: Det skaber loop, da MessageService henter denne (ChatService).
    private afs: Firestore) {
  }

  /* --- FB-Instances --- */
  // usrsColInstance = () => { return collection(this.afs, `users`) }
  userDocInstance = (uid: any) => { return doc(this.afs, `users/${uid}`) }
  chatColInstance = () => { return collection(this.afs, `collectMsgs`) }
  chatDocInstance = (cid: string) => { return doc(this.afs, `collectMsgs/${cid}`) }
  chatUsersColInstance = (cid: any) => { return collection(this.afs, `collectMsgs/${cid}/chatUsers`) }
  chatUserDocInstance = (cid: string, uid: string) => { return doc(this.afs, `collectMsgs/${cid}/chatUsers/${uid}`) }
  msgsColInstance = (cid: string) => { return collection(this.afs, `collectMsgs/${cid}/messages`) }

  // private uidLS = (source: string = "") => this.Auth.getStorageUser(source)


  getAllChats(): Observable<Chat[]> {
    let myuser: any

    return this.Auth.user$.pipe(
      switchMap((user: any) => {
        if (!user) return []

        myuser = user

        return collectionData(
          query(this.chatColInstance(),
            // orderBy('lastMsg.createdAt', "desc"), // ERROR FirebaseError: The query requires an index.(???)
            where("userRefs", "array-contains", this.userDocInstance(myuser.uid)), // this.uidLS("getAllChats, query")
          ), { idField: 'cid' }) as Observable<Chat[] | undefined>
      }), // end switchMap
      map((chats: any | undefined) => {
        for (let chat of chats) {
          this.getChatName(chat.cid, myuser.uid).subscribe((name: string) => { chat.chatName = name })
          this.getNumberOfNewMessages(chat, myuser.uid).subscribe((n: number) => {
            chat.myNews = n
            chat.unread = n > 0 ? true : false
          })
        }

        return chats
      }) // end map
    )
  }


  createNewChat() { // NB: skriver til Dummy-db - ER IKKE UP TO DATE!
    console.log("Vi laver en ny chat til dig!")
    const newChatData: NewChat = {
      lastMsg: {},
      _chatName: "",
      _msgCount: 0
    }

    /* tester chat-length (Virker ikke) */
    let testChatID: string = "chat"
    let cd = () => { return collectionData(this.chatColInstance(), { idField: 'cid' }).subscribe((c: any) => { return testChatID + c.length }) }
    /* (tester end) */

    // Lav nyt doc:
    // return setDoc(this.chatDocInstance(cd()), newChatData) // NB: tester (virker ikke helt)
    return addDoc(collection(this.afs, `dummyChats`), newChatData)
      // return addDoc(this.chatColInstance(), newChatData)
      .then((newChat: any) => {
        // Hent doc og brug data:
        return docData(newChat, { idField: "cid" }).pipe(map((data: any) => { return data.cid }))
      })
      .then((chat) => {
        chat.subscribe((c: any) => {
          this.router.navigateByUrl(`chat/messages/${c}`, { replaceUrl: true }).catch(console.error)
        })
      })
  }


  /* --- Get chat-info functions --- */

  getNumberOfNewMessages(chat: any, uid: string): Observable<number> {
    return docData(this.chatUserDocInstance(chat.cid, uid)).pipe(
      map((c: any) => {
        return c ? chat._msgCount - c._readMsgs : 0
      })
    )
  }

  getChatName(cid: string, uid: string) {
    return this.getDefaultChatName(cid, uid).pipe(
      switchMap((defaultName: string) => {
        // console.log("1: Get Chat Name (inside)")
        // console.log('(getChatName) default:', defaultName)
        return docData(this.chatDocInstance(cid)).pipe(map((chat: any) => {
          // console.log('(getChatName) chat:', chat)
          if (!chat) return "Unknown Chat(0)"
          if (chat._chatName !== "") return chat._chatName
          // if (!chat._chatName) return defaultName
          // if (chat._chatName == "") return defaultName
          else return defaultName
        }))
      }) // end switchMap
    )
  }

  getDefaultChatName(cid: string, uid: string): string | any {
    return this.getChatUsers(cid).pipe(
      map((users: any) => {
        // console.log("2: Get Default Name (inside)")
        if (users == undefined) return "Chat(3)" // 0 users - Burde ikke ske. - chat3
        // console.log('chatUsers', users.length, ':', users)
        if (users.length < 2) return "Solo chat(4)" // 1 user - Burde ikke ske. - chat4
        if (users.length > 2) return "Group(1)" // - chat1
        if (users.length == 2) { // - chat2 (aaa og lasse)
          let otherUserName!: string;
          if ([users[0].uid, users[1].uid].some(u => u == uid)) {
            for (let user of users) {
              if (user.uid !== uid) {
                otherUserName = user.nickname ? user.nickname : user.name
              }
            }
          }
          return otherUserName ? otherUserName : `NOT YOUR CHAT(2) (${cid})!` // - chat2 (alle andre brugere)
        }
        return "Ukendt chat"
      }))
  }

  getChatUsers(cid: string | null) { // bruges af chat-guard
    // console.log("3: Get Chat Users")
    /* --- Bruger chatUsers-collection i 'chatXX'-doc --- */
    return collectionData(this.chatUsersColInstance(cid), { idField: 'uid' }).pipe(
      map((users: any) => {
        // console.log("(getChatUsers) users:", users)
        return users.length > 0 ? users : undefined
      }))
  }






}
