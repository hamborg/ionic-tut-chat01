import { Timestamp } from '@firebase/firestore';

export interface Message {
    mid?: string
    _type?: string // 'message', 'picture', 'position', (andre?)
    _active: boolean // NB: true, kan ses. false, er slettet.
    createdAt: Timestamp
    from: string
    msg?: string
    fromName?: string
    myMsg?: boolean
  }