import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, MenuController, ToastController} from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JwtHelper } from 'angular2-jwt';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';

import { emailValidator } from '../../shared/email-validation.directive';

import { User } from '../../app/user';
import { SignUpService } from './sign-up.service';
import { SignInService } from './../sign-in/sign-in.service';
import { globalVars } from '../../app/globalvariables';
import { OrdersHistoryPage } from '../orders-history/orders-history';
import { LaundryMap } from '../map/map.component';
import { SignInPage } from '../sign-in/sign-in';
@Component({
  selector: 'page-sign-up',
  templateUrl: 'sign-up.html',
  providers: [SignUpService, 
              SignInService,
              Facebook, 
              JwtHelper, 
              User]
})
export class SignUpPage implements OnInit{

  signUpForm: FormGroup;
  submitted = false;
  active = true;
  token: any;
  URL: any = globalVars.PostNewUser();;
  ngOnInit(){
    this.buildForm();
  }
  buildForm(): void{
    let emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.signUpForm = this.formBuilder.group({
      username: ['',[
        Validators.required
      ]],
      firstname: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)]],
      lastname: ['',[
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)],
      ],
      password: ['',[
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(36)
      ]],
      phone: ['',[
        Validators.required
      ]],
      email: ['',[
        Validators.required,
        emailValidator(emailReg)
      ]],
      dob: ['',[
        Validators.required
      ]]
    });
  }
  validateForm(data?: any){
    
    if (!this.signUpForm) {return;}
    const form = this.signUpForm;
    
    for(const field in this.formsError){
      const control = form.get(field);
      
      if(control){
        this.formsError[field] = '';
        const messages = this.validationMessages[field];
        for (const key in control.errors){  
          console.log('Line 79', control.errors);
          this.formsError[field] = messages[key];
        }
      }
    }
  }
  formsError = {
    firstname: '',
    lastname: '',
    password: '',
    phone: '',
    email: '',
    dob: ''
  }

  validationMessages = {
    firstname:{
      'required': 'First name is required.',
      'minLength': 'First name should contain atleast 4 characters',
      'maxlength': 'First name should be less than 36 characters'
    },
    lastname:{
      'required': 'Last name is required.',
      'minLength': 'Last name should contain atleast 4 characters',
      'maxlength': 'Last name should be less than 36 characters'
    },
    password: {
      'required': 'Password is required.',
      'minlength': 'Password should contain atleast 4 characters',
      'maxlength': 'Password should be less than 36 characters'
    },
    phone:{
      'required': 'Phone number is required.',
    },
    email: {
      'required': 'Email is required.',
      'invalidEmail': 'Invalid Email address.'
    },
    dob:{
      'required': 'Date of Birth is required.',
    }
  }

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private jwtHelper: JwtHelper,
              private toastCtrl: ToastController,
              private user: User,
              private signUpService: SignUpService,
              private signInService: SignInService,
              private formBuilder: FormBuilder,
              private menuController: MenuController,
              private fb: Facebook,) {
                this.menuController.swipeEnable(false);
  }

  ionViewDidLoad() {
    console.log('Line 136','ionViewDidLoad SignUpPage');
  }
  signUp(username, password, phone, email, dob) {
    this.validateForm(this.signUpForm.value);
    this.submitted = true;
    console.log('Line 141', this.signUpForm.value);
    
    let URL, data: any;
    URL = globalVars.PostNewUser();
    data = {
      
      "firstName": this.signUpForm.value.firstname || null,
      "lastName": this.signUpForm.value.lastname || null,
      "password": this.signUpForm.value.password || null,
      "contact": {
        "phone1": this.signUpForm.value.phone || null,
        "email1": this.signUpForm.value.email || null
      },
      "dob": this.signUpForm.value.dob || null,
      "username": this.signUpForm.value.email || null
    }
    console.log('Line 157', `Sending to server ${data.username}, ${data.password}, ${data.contact.phone1}, ${data.contact.email1}`);
    let response: any;
    this.signUpService.PostNewUser(URL, data)
      .subscribe(res => {

                  if(res.status == 200){
                      
                      console.log('Line 164', JSON.parse(res['_body']));
                      let body  = JSON.parse(res['_body']);
                      response = {
                        href: body["href"],
                        data: body["data"]
                      }
                      console.log('Line 170', "response data = ",response.data);
                      if(response.data === null){
                        this.presentToast(body.error, 'bottom');
                      }else{
                        // this.navCtrl.setRoot(OrdersHistoryPage, {userID: response.data._id});
                        let signInData = {
                          username: data.contact.email1,
                          password: data.password
                        };
                        // this.requestSignIn(signInData);
                        this.navCtrl.setRoot(SignInPage, {
                          signupSucess: true,
                          username: data.username,
                          password: data.password
                        });
                      }
                      // localStorage.setItem("userID", response.data._id);
                      // this.user.saveUserAccessToken(response.data);
                      
                  }
                  
              });
  }
  requestSignIn(data){
    console.log('Line 194', data.password);
    
    console.log('Line 196', 'Inside Sign in call');
    
    this.URL = globalVars.PostSignInApi();
    console.log('Line 199', this.URL);
    
    this.signInService.signInUser(this.URL, data)
      .subscribe(res => {
        this.token = JSON.parse(res['_body'])['token'];
        let userID = this.jwtHelper.decodeToken(this.token);
        localStorage.setItem('x-access-token',this.token);
        localStorage.setItem('userID',this.jwtHelper.decodeToken(this.token)['_id']);
        localStorage.setItem('user-id', userID._id);

        this.user.saveUserId(userID);
        console.log('Line 210', userID._id);
        this.user.saveUserAccessToken(this.token);
        // this.user.scheduleRefresh(this.token);
        
        console.log('Line 214', JSON.stringify(res['_body']['data']));
        
      }, err => {
        console.log('Line 217', JSON.stringify(err));
        
      })
  }
  signinPage(){

    this.navCtrl.setRoot(SignInPage);
  }
  facebook = "facebook";
  fbSignup(){
    console.log('Line 227', 'FB Signup clicked.');

    this.fb.getLoginStatus().then(
      res =>{
        if(res.status === 'connected' || res.status !== 'connected'){
          this.fb.login(['email', 'public_profile'])
            .then(
              (res: FacebookLoginResponse) => {
                console.log('Line 235', 'Logged into facebook:', res);
                console.log('Line 236', res.authResponse.sig);
                console.log('Line 237', res.authResponse['email']);
                // console.log(res.);
                
                
                this.facebook = res.status;
                this.user.saveSocialData(res.authResponse);
                localStorage.setItem('fbData', JSON.stringify(res.authResponse));
                // this.navCtrl.setRoot(OrdersHistoryPage);

                let fbUserID = res.authResponse.userID;
                console.log('Line 247', fbUserID);
                
                let params: Array<any>;
                let data = {
                  
                }
                params = ['email', 'public_profile']
                this.fb.api(`/me?fields=
                                        name,
                                        email,
                                        link,
                                        locale,
                                        gender,
                                        first_name,
                                        last_name,
                                        hometown
                              `, params).then(
                                user => {
                                  console.log('Line 265', JSON.stringify(user), user.name);
                                  data = {
                                    "username": fbUserID,
                                    "firstName": user.first_name,
                                    "lastName": user.last_name,
                                    "contact": {
                                      "phone1": "",
                                      "email1": fbUserID
                                    },
                                    "dob":"",
                                    "isFacebookAuthenticated": true,
                                    "social":{
                                      "socialLink": user.link,
                                      "name": fbUserID,
                                      "gender": user.gender,
                                      "currentCity": "",
                                      "currentCountry":""
                                    }
                                  } 
                                  console.log('Line 284', data);  
                                }
                                
                                
                              ).then(()  => {
                                console.log('Line 289', this.URL, JSON.stringify(data), fbUserID);
                                // this.requestSignIn(data);
                                this.socialSignup(this.URL, data, fbUserID);
                              });
                
                
                
              }
            ).catch( e => {
              console.log('Line 298', 'Error logging into facebook', e);
              this.facebook = e;
            })
        }
      });


  }

socialSignup(URL, data, fbUserID){
   let response: any;
   console.log('Line 309', URL);
   
    this.signUpService.PostNewUser(URL, data)
      .subscribe(res => {

                  if(res.status = 200){
                      console.log('Line 315', res['_body']);
                      let body  = JSON.parse(res['_body']);
                      response = {
                        href: body["href"],
                        data: body["data"]
                      }
                      console.log('Line 321', "response data = ",JSON.stringify(response.data));
                      if(!!response.data && !response.error){
                        localStorage.setItem("userID", response.data._id);
                        let signInData = {
                          username: fbUserID,
                          password: fbUserID + "facebook"
                        };
                        // this.requestSignIn(signInData);

                        this.presentToast("You are now signed up. Please sign in.", 'bottom');

                        
                      }else{
                        console.log('Line 334', 'You are already signed up. Please sign in.');
                        
                        
                        this.presentToast((body.error + " Please sign in."), 'bottom');
                      }
                      
                      // //this.user.saveUserAccessToken(response.data.);
                      
                  }
              });
      }
    presentToast(message, position){
      console.log('Line 344', 'Inside toast');
      
      let toast = this.toastCtrl.create({
        message: message,
        position: position,
        closeButtonText: 'OK',
        showCloseButton: true
      });
      toast.onDidDismiss(() => {
        console.log('Line 353', 'Dismissed toast');
        this.navCtrl.setRoot(SignInPage);
      });

      toast.present();

      }
}
