import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { addDoc, collection, collectionData, doc, docData, Firestore, increment, orderBy, query, serverTimestamp, CollectionReference, setDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, Subscription, of, iif } from 'rxjs';
import { map, switchMap, filter, tap } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { Message } from '../models/message';
import { User } from '../models/user';
import { ChatService } from './chat.service';
import { Chat } from '../models/chat';

/*
    Original tut-video med chat:
    https://www.youtube.com/watch?v=xNleEVG9_yA

    Ellers moduleret fra tut "angular 15 with angularfire 7":
    https://www.youtube.com/watch?v=HXSqKW4JCr4
*/


@Injectable({
  providedIn: 'root'
})
export class MessageService {

  actChat!: Chat | any;
  cid!: any;

  constructor(
    private Auth: AuthService,
    private afs: Firestore,
    private chatService: ChatService,
    private loadingController: LoadingController,
    private route: ActivatedRoute
  ) {
    route.params.subscribe((param: any) => { this.cid = param.id })  // NB: eller 'param['id']'})
  }

  usrsColInstance = () => { return collection(this.afs, `users`) }
  userDocInstance = (id: any) => { return doc(this.afs, `users/${id}`) }
  chatDocInstance = (id: any) => { return doc(this.afs, `collectMsgs/${id}`) }
  chatUsersColInstance = (id: any) => { return collection(this.afs, `collectMsgs/${id}/chatUsers`) }
  chatUserDocInstance = (cid: string, uid: string) => { return doc(this.afs, `collectMsgs/${cid}/chatUsers/${uid}`) }
  msgsColInstance = (id: any) => { return collection(this.afs, `collectMsgs/${id}/messages`) }


  /* --- Loadings ---*/
  async loadingOn() {
    await this.loadingController.create()
      .then(load => load.present())
  }

  loadingOff(loader: any) {
    loader.then(() =>
      this.loadingController.dismiss()
    )
  }

  /* --- Update unreads on new msg --- */
  userReadsAllChats(cid: string, obs: Subscription | undefined) {
    if (!obs) {
      const uid = this.Auth.getStorageUser() //this.Auth.currentUser.uid
      obs = docData(this.chatDocInstance(cid)).subscribe((c: any) => {
        updateDoc(this.chatUserDocInstance(cid, uid), { _readMsgs: c._msgCount })
      })
    } else {
      obs.unsubscribe()
      obs = undefined
    }
    return obs
  }

  /* --- send message --- */
  async addChatMessage(id: string, msg: string) {
    const msgData = {
      _active: true, // NB: false når bliver deleted
      _type: "message", // NB: På sigt må objektet vel ændre sig, hvis man sender billeder eller positioner.
      msg,
      from: this.Auth.currentUser.uid,
      createdAt: serverTimestamp()
    }

    await addDoc(this.msgsColInstance(id), msgData)
    await updateDoc(this.chatDocInstance(id), { lastMsg: msgData, _msgCount: increment(1) })
  }


  /* --- get messages --- */
  getChatMessages(cid: string) {
    let users: any[];

    return collectionData(this.usrsColInstance(), { idField: 'uid' }).pipe(
      // OBS: 'uid' her er samme 'uid' som vi burger i vores User class/interface!
      switchMap((res: any) => {
        users = res;

        return collectionData(
          query(this.msgsColInstance(cid), orderBy('createdAt')), { idField: 'mid' }
        ) as Observable<Message[]>
      }),
      map((messages: any) => {
        for (let m of messages) {
          m.fromName = this.getUserForMsg(m.from, users)  // afsender eller 'deleted'
          m.myMsg = this.Auth.currentUser.uid === m.from  // true/false
          if (!m.createdAt) m.createdAt = new Date()
        }
        return messages;
      })
    )
  }

  getUserForMsg(msgFromId: string, users: User[]): string {
    for (let usr of users) {
      if (usr.uid == msgFromId) {
        return usr.email;
      }
    }
    return 'Deleted user';
  }


  /* --- Subscribe to getMsgs: enable scroll --- */

  public disable!: boolean //= false
  shouldScroll(cid: string, domEl: any) {
    return this.getChatMessages(cid).pipe(
      // tap((ting: any) => console.log('ting 1', ting)),
      tap(() => {
        console.log("disable before???:", this.disable)
        domEl.getScrollElement().then((el: any) => {
          let atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight - 5
          console.log("el-top in new service:", el.scrollTop)
          console.log("at bottom???:", atBottom)
          // if (!atBottom) { this.disable = true }
          // else { this.disable = false }
          // console.log("disable?:", this.disable)
        })
      })
      , tap((ting: any) => console.log('ting 2', ting))
      , filter(() => this.disable)
      , tap(() => console.log('!! (service) I MAY NOW SCROLL !!'))
    )
  }



}
