import { Timestamp } from '@angular/fire/firestore';

export interface NewChat {
  _chatName?: string
  _msgCount?: number
  lastMsg: {
    msg?: string
    from?: string
    createdAt?: Timestamp
  }
}

export interface Chat {
  cid: string
  chatName: string
  myNews: number
  unread: boolean
  lastMsg: {
    msg: string
    from: string
    createdAt: Timestamp
  };
}