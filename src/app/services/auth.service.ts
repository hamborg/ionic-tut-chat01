import { Injectable } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, setDoc, deleteDoc, collectionGroup } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { } from 'rxjs/operators';
import { Router } from '@angular/router';


export interface User {
  uid: string;
  email: string;
}

/*
    Login i denne service er delvist lavet vha. 'FB auth. & File Upload'-video
    Den tutorial er nyere og inkluderer derfor FB 7, som anden video ikke gjorde.
    https://www.youtube.com/watch?v=U7RvTTF9dnk
*/

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user$!: Observable<any>
  public currentUser!: User | any;
  public LS_uidToken: string = "AuthUid"

  userDocInstance = (uid: any) => { return doc(this.afs, `users/${uid}`) }

  constructor(
    private router: Router,
    private afAuth: Auth,
    private afs: Firestore
  ) {
    console.log("AUTH CONSTRUCTOR: nu sker ting. CurrentUser:", this.currentUser)
    this.user$ = authState(afAuth)
    authState(afAuth).subscribe((user: any) => {
      // // this.getCurrentUser().then((user:any) => {
      if (user) {
        this.currentUser = user
        localStorage.setItem(this.LS_uidToken, user.uid)
        console.log('Changed user (authState): ', user); // "User indeholder meget mere end bare 'uid' og 'email'"
      }
    });
  }

  /* --- Get user funcs --- */

  getCurrentUser(): Promise<{}> { // chat-user guard
    // NB: Implementeret fra GitHub: https://github.com/firebase/firebase-js-sdk/issues/462#issuecomment-359711740
    return new Promise((resolve, reject) => {
      const unsubscribe = this.afAuth.onAuthStateChanged((user: any) => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  }

  getStorageUser(source: string = ""): any {
    // let userting: any = localStorage.getItem(this.LS_uidToken)
    // console.log(source, 'spørger efter user fra LS:', userting)
    return localStorage.getItem(this.LS_uidToken)
  }

  getUser(): Observable<User | any> {
    return this.currentUser.uid as Observable<User | any>;
  }


  /* --- Auth funcs --- */

  async signUp({ email, password }: { email: string, password: string }) {
    try {
      const credential = await createUserWithEmailAndPassword(this.afAuth, email, password)

      console.log('result from (auth) signUp: ', credential)

      this.sendToDB(credential, password)

      return credential

    } catch (e) {
      console.log('Sign-up fejl:\n',e)
      return null
    }
  }

  async login({ email, password }: { email: string, password: string }) {
    console.log('Login email: ', email, '\nLogin password: ', password)
    try {
      const user = await signInWithEmailAndPassword(this.afAuth, email, password);
      return user
    } catch (e) {
      console.log('(auth) Login fejl:\n', e)
      return null
    }
  }

  logout() {
    return signOut(this.afAuth)
  }

  async signOut(url: string = "/") {
    await this.logout().then(() => {
      console.log("Vi skriver nu!")
      localStorage.removeItem(this.LS_uidToken)
      console.log(localStorage.getItem(this.LS_uidToken))
      this.router.navigateByUrl(url, { replaceUrl: true })
    })
  }


  /* --- DB funcs ---*/
  
  sendToDB(credential: UserCredential, password: string) {
    // Opdater/indskriv 'user' i 'users' db collection på FB:

    // Fra tut "angular 15 with angularfire 7": https://www.youtube.com/watch?v=HXSqKW4JCr4
    const uid = credential.user.uid
    const updateData = { email: credential.user.email, password: password, _AuthUid: uid }

    setDoc(this.userDocInstance(uid), updateData) // NB: setDoc lader til at kunne lave et nyt document. addDoc kan KUN tilføje en ny med tilfældig uid. updateDoc tager kun eksisterende! 
      .then((suc) => {
        console.log('Data blev opdateret i DB!')
        console.log('opdaterings-succes:', suc)
      })
      .catch((e) => {
        console.log('update-error: ', e)
      })
  }

}
