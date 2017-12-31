import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { tokenNotExpired } from 'angular2-jwt';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';

import { ICurrentUser } from '../auth/currentUser';

@Injectable()
export class AuthService {
    private baseUrl = 'http://localhost:8888/api/auth';
    currentUser: ICurrentUser;
    constructor(private _http: HttpClient) { }

    login(credentials): Observable<any> {
        let url = `${this.baseUrl}/login`;
        let body = { email: credentials.email, password: credentials.password };
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        let options = { headers: headers };

        // Get initial access token from the Passport server.
        return this._http.post<any>(url, body, options)
            .do(res => {
                // Set access token in LocalStorage.
                localStorage.setItem('access_token', res.access_token);
                // Get the current user.
                this.getCurrentUser().subscribe();
            })
            .catch(this.handleError);
    }

    logout(): Observable<any> {
        let url = `${this.baseUrl}/logout`;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        let options = { headers: headers };

        // Revoke the access token from the server.
        return this._http.post<any>(url, null, options)
            .do(() => {
                // Remove access_token from LocalStorage.
                localStorage.removeItem('access_token');
                // Remove the currentUser.
                this.currentUser = undefined;
            })
            .catch(this.handleError);
    }

    getCurrentUser(): Observable<ICurrentUser> {
        const url = `${this.baseUrl}/currentUser`;
        let headers = new HttpHeaders({ 'Accept': 'application/json' });
        let options = { headers: headers };

        return this._http.get<ICurrentUser>(url, options)
            .do(currentUser => {
                if (!!currentUser['id']) {
                    this.currentUser = currentUser;
                }
            })
            .catch(this.handleError);
    }

    // refresh(): Observable<any> {
    //     let apiUrl = 'http://localhost:8888/api/auth/refresh';
    //     return this._http.post<any>(apiUrl, null, {
    //         headers: new HttpHeaders({
    //             'content-type': 'application/x-www-form-urlencoded',
    //             'Accept':       'application/json'
    //         })
    //     })
    //     .do(res => console.log(res))
    //     .catch(this.handleError);
    // }

    public retrieveAccessToken()
    {
        return localStorage.getItem('access_token');
    }

    public isAuthenticated(): boolean
    {
        const token = this.retrieveAccessToken();

        return tokenNotExpired(null, token);
    }

    private handleError(err: HttpErrorResponse) {
        if (err.error instanceof Error) {
            console.log(`An error occurred: ${err.error.message}`);
        } else {
            console.log(`Backend returned code ${err.status}, body was: ${err.error.message}`);
        }

        return Observable.throw(err.error.message);
    }

}