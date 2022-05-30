import { Component, Inject, OnInit } from '@angular/core';
import { DTOPerson } from '@datacentricdesign/types'
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AppService } from 'app/app.service';
import { AxiosResponse } from 'axios'

import { V0alpha2Api, SelfServiceLoginFlow } from '@ory/kratos-client'

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html'
})
export class SignInComponent implements OnInit {

  auth$: Observable<any>;

  // id: string;
  // description: string
  // name: string
  // login_challenge: string
  // csrf: string
  // client: any
  // error: any
  // apiURL: string

  ready = false
  data: any
  kratos: V0alpha2Api
  flowId: string
  csrf: string
  action: string
  message: string
  cookie: string
  error: any

  // coming from hydra (OAuth client requesting log in)
  login_challenge: string

  constructor(private route: ActivatedRoute,
    private _router: Router,
    private http: HttpClient,
    private appService: AppService) {
    // this.apiURL = this.appService.settings.apiURL;
  }

  model: DTOPerson = {
    id: '',
    email: '',
    password: ''
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // coming from hydra
      this.login_challenge = params["login_challenge"]
      // this.auth$ = this.http.get<any>(this.apiURL + "/auth/signin?login_challenge=" + this.login_challenge).pipe(
      //   map((data: any) => {
      //     this.csrf = data.csrfToken
      //     this.client = data.client
      //     return data;
      //   }), catchError(error => {
      //     return throwError(error);
      //   })
      // )


      this.kratos = new V0alpha2Api(undefined, 'http://localhost')
      const refresh = false;
      this.kratos.initializeSelfServiceLoginFlowForBrowsers(refresh, 'aal1', 'http://localhost/profile', { headers: { 'Accept': 'application/json' } })
        .then((data: AxiosResponse<SelfServiceLoginFlow>) => {
          this.flowId = data.data.id;
          this.csrf = data.data.ui.nodes[0].attributes['value'];
          this.action = data.data.ui.action
          // this.message = data.data.ui.messages[0].text
          this.ready = true
        })
        .catch((error) => {
          if (error.response.data.error.id === "session_already_available") {
            window.location = "./settings" as any
          } else {
            console.log(error.response)
          }
        })
    });

  }

  postSignIn(): void {

    // Check whether we deal with an email or a username, and make sure username start with person prefix
    let emailOrUsername = this.model.email
    // if (!emailOrUsername.includes('@') && !emailOrUsername.startsWith('dcd:persons:')) {
    //   emailOrUsername = 'dcd:persons:' + emailOrUsername
    // }
    // build the body
    const body = {
      identifier: emailOrUsername,
      password: this.model.password,
      method: 'password',
      csrf_token: this.csrf
      // challenge: this.login_challenge
    }

    // const url = this.apiURL + "/auth/signin?login_challenge=" + this.login_challenge + "&_csrf=" + this.csrf
    // this.http.post(url, body).subscribe((data: any) => {
    //   if (data.error) {
    //     this.error = data.error
    //     console.error(this.error)
    //   } else if (data.redirect_to) {
    //     window.location = data.redirect_to
    //   }
    // });


    const httpOptions = { credentials: 'include', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
    this.kratos.submitSelfServiceLoginFlow(this.flowId, undefined, body, httpOptions)
      .then(() => {
        window.location = "./settings" as any
      })
      .catch((error) => {
        this.error = error
      })
  }

}