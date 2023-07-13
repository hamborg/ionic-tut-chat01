import { Component, OnInit, ViewChild, QueryList, ElementRef, ViewChildren, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, ScrollDetail } from '@ionic/angular';
import { Observable, Subscription, of, iif, empty, fromEvent } from 'rxjs';
import { map, switchMap, tap, startWith } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { MessageService } from '../../services/message.service';
import { Message } from '../../models/message';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChildren("msgBoard") msgb!: QueryList<ElementRef>;
  @ViewChild("msgcontent") private msgc!: IonContent | ElementRef | any;

  messages$!: Observable<Message[]>;
  newMsg: string = '';
  cid!: string;
  chatName!: Observable<string>;
  loader!: Promise<any>
  obs!: Subscription | undefined

  // TESTER:
  disableScrollDown: boolean = false


  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private router: Router,
    private Auth: AuthService,
    private route: ActivatedRoute,
  ) {
    route.params.subscribe((param: any) => { this.cid = param.id })  // NB: eller 'param['id']'})
  }

  ngOnInit() {
    this.chatName = this.chatService.getChatName(this.cid, this.Auth.getStorageUser())
    this.messages$ = this.messageService.getChatMessages(this.cid)
    this.loader = this.messageService.loadingOn()
  }

  ngOnChanges() {
    console.log("CHANGES!!!")
  }

  /* ------- PROJEKT: ------- 
    Jeg prøver at finde ud af, hvordan vi kan få scrollet til bunden af den skide side...
    - Det skal først ske, når msgs er loadet...
    - Det skal undgås, hvis man SELV har scrollet lidt op! (Det er faktisk lige meget om man skriver eller ej. Det er stadigt irriterende...)
    - På sigt skal der laves en "Nye beskeder"-knap, hvis man er scrollet op, og der er kommet nyt.
  */

  ngAfterViewInit() {
    this.messageService.loadingOff(this.loader)
    this.readMsgs(this.obs)
    console.log("after view init\n\n\n\n- Nyt view -\n\n\n")
    /////////////////////////////////
    

    // of(this.disableScrollDown).pipe(
    //   startWith(true),
    //   tap((e:any) => console.log(e)),
    //   // tap((e:any) => console.log(e.length)),
    //   switchMap((dis: boolean) => {
    //     console.log('dis:', dis)
    //     if (!dis) {
    //       return empty()
    //     } else {
    //       return this.messages$
    //     }
    //   }),

    //   /*
    //     17.05.23:
    //     (Denne funktion virker heller ikke helt.
    //     Men tjek lige example 2: 
    //     https://www.learnrxjs.io/learn-rxjs/operators/creation/empty) 
    //   */

    // ).subscribe(console.log)



    // this.messageService.shouldScroll(this.cid, this.msgc)
    //   .subscribe((e: any) => {
    //     console.log(e.length)
    //   })

    /*

    this.messages$.subscribe((msgs: Message[]) => {
      console.log("disable?!", this.disableScrollDown)
      // if (!this.disableScrollDown) {
      this.msgc.getScrollElement().then((el: any) => {
        // let atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight - 5
        // if (atBottom) { // NB: Kan vel skrives i en linje
        // }    

        console.log("AF.VIEW Subs! Top:", el.scrollTop) // dynamisk - viser højden for scroll
        this.content.scrollToBottom()
        // setTimeout(() => {
        console.log("AF.VIEW scroll/timeout! Top:", el.scrollTop) // dynamisk - viser højden for scroll
        // }, 100);
      })
      // } else {
      //   console.log("HELE SCROLL ELEMENT 'TEST' SKETE IKKE")
      // }

      //     // .then(() => {
      //     //   element.getScrollElement()
      //     //     .then((el: any) => {
      //     //       console.log("Scroll, placering 'then':")
      //     //       console.log("disable?", this.disableScrollDown)
      //     //       console.log("SC.END! Top:", el.scrollTop) // dynamisk - viser højden for scroll
      //     //       console.log(`${el.scrollHeight} - ${el.scrollTop} = ${el.scrollHeight - el.scrollTop} <= ${el.clientHeight}`)
      //     //     })
      //     //     .then(() =>
      //     //       console.log("Disable now??...", this.disableScrollDown)
      //     //     )
      //     //   console.log("SUBSCRIBE SCROLL!!!")
      //     // })
    })

    */
  }

  ngAfterViewChecked() { // NB: Pas på med denne her; den opdaterer HELE tiden
    // if (this.disableScrollDown) ......... SLUTTEDE PLUDSELIGT HER!
  } 
    

  ngOnDestroy() {
    this.readMsgs(this.obs)
  }

  /* --- (Tester stadigt) --- */


  isScrolledDisabled() {
    console.log("Disable scroll???", this.disableScrollDown)
  }

  onScrollStart() {
    this.disableScrollDown = true
    this.messageService.disable = true
    // console.log("scroll-start. disable true")

    // let element = this.msgc
    // element.getScrollElement().then((el: any) => {
    //   console.log("SC.START! Top:", el.scrollTop) // dynamisk - viser højden for scroll
    // })
  }

  onScroll() {
    console.log("scroller! disable true")
    this.msgc.getScrollElement().then((el: any) => {
      this.disableScrollDown = true

    })
  }

  onScrollEnd(tolerance: number = 0) {
    let element = this.msgc
    element.getScrollElement().then((el: any) => {
      // console.log(el.scrollHeight) // statisk
      // console.log("SCR.END! Top:", el.scrollTop) // dynamisk - viser højden for scroll
      // console.log(el.clientHeight) // statisk

      let atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight - tolerance

      if (atBottom) { // NB: Kan vel skrives i en linje
        // console.log('NU MÅ VI...()?')
        this.disableScrollDown = false
        this.messageService.disable = false
      } else {
        this.messageService.disable = true
        // console.log('Nu må vi ikke....()?')
        // this.disableScrollDown = true
      }
      // if (el.scrollTop == 0) this.disableScrollDown = false
    })
      .then(() => console.log('--- ON SCROLL END - disable?', this.disableScrollDown))
  }


  @HostListener("body:click") // Only: window:xxx, document:xxx, body:xxx
  onclick(ev: any) {
    // console.log("\nUser Click Event...", ev);
    let msgEl = this.msgc.el
    // msgEl.scrollToPoint(0,222)
    // msgEl.scrollToTop()
  }


  /* --- (END OF TESTS) --- */














  /* --- Chat page functions --- */

  readMsgs(sub: Subscription | undefined) {
    this.obs = this.messageService.userReadsAllChats(this.cid, sub)
  }

  sendMessage() {
    this.messageService.addChatMessage(this.cid, this.newMsg)
      .then(() => {
        this.newMsg = '';
        this.content.scrollToBottom();
        console.log("(scrolled down fordi ny besked!)")
      });
  }


  /* --- App functions --- */

  logout() {
    this.Auth.signOut()
  }
}
