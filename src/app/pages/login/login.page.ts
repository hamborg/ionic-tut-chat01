import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController, AlertController } from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  // // @ts-ignore
  credentialForm: FormGroup = this.fb.group({
    email: ['', Validators.compose([Validators.required, Validators.email])],
    password: ['',Validators.compose([ Validators.required, Validators.minLength(6)])],
  })

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authLoginService: AuthService,
    // Nice2haves:
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  get epost() { // NB: Bruges i html af *ngIf. Derfor testet med 'epost'-navn i stedet for 'email'
  // @ts-ignore
  return this.credentialForm.get('email');
  }

  get password() {
  // @ts-ignore
  return this.credentialForm.get('password');
  }

  ngOnInit() { }

  
  async login() {
    console.log('indtastet: ',this.credentialForm.value) // TEST
    const loading = await this.loadingController.create();
    await loading.present();
    
  // @ts-ignore
    const user = await this.authLoginService.login(this.credentialForm.value)
    await loading.dismiss();

    if(user) {
      this.router.navigateByUrl('/chat', {replaceUrl: true})
    } else {
      this.showAlert('Login slog fejl!','Prøv lige igen...')
    }
  }

  
  async register(){
    console.log('indtastet: ',this.credentialForm.value) // TEST
    
    const loading = await this.loadingController.create();
    await loading.present();
    
    // NB: Denne sign up skulle også tilføje bruger til db-col 'users'
    const user = await this.authLoginService.signUp(this.credentialForm.value)
    await loading.dismiss();
    
    if(user) {
      this.router.navigateByUrl('/chat', {replaceUrl: true})
    } else {
      this.showAlert('Registrering slog fejl!','Prøv lige igen...')
    }
  }

  
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['OK']
    })
    await alert.present()
  }
  

}
