import {Injectable, Inject} from "@angular/core";
import {RegistrationUser} from "../public/auth/register/registration.component";
import {environment} from "../../environments/environment";

/**
 * Created by Vladimir Budilov
 */


declare var AWSCognito: any;
declare var AWS: any;
declare var WebTCP: any;

export interface CognitoCallback {
    cognitoCallback(message: string, result: any): void;
}

export interface LoggedInCallback {
    isLoggedIn(message: string, loggedIn: boolean): void;
}

export interface Callback {
    callback(): void;
    callbackWithParam(result: any): void;
}

@Injectable()
export class CognitoUtil {

    public static _REGION               = environment.region;

    public static _IDENTITY_POOL_ID     = environment.identityPoolId;
    public static _USER_POOL_ID         = environment.userPoolId;
    public static _CLIENT_ID            = environment.clientId;

    // public _REDIRECT_URL                = "http://klouddms.github.io/#/app";
    public _REDIRECT_URL                = "http://localhost:4201/#/app";
    public _SERVER_URL                  = "127.0.0.1";
    public _LIVE_PORT                   = "4200";
    public _TCP_PORT                    = "1337";

    public static _POOL_DATA            = {
        UserPoolId: CognitoUtil._USER_POOL_ID,
        ClientId: CognitoUtil._CLIENT_ID
    };


    public static getAwsCognito(): any {
        return AWSCognito
    }

    getUserPool() {
        return new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(CognitoUtil._POOL_DATA);
    }

    getCurrentUser() {
        return this.getUserPool().getCurrentUser();
    }


    getCognitoIdentity(): string {
        return AWS.config.credentials.identityId;
    }

    getAccessToken(callback: Callback): void {
        if (callback == null) {
            throw("CognitoUtil: callback in getAccessToken is null...returning");
        }
        if (this.getCurrentUser() != null)
            this.getCurrentUser().getSession(function (err, session) {
                if (err) {
                    console.log("CognitoUtil: Can't set the credentials:" + err);
                    callback.callbackWithParam(null);
                }

                else {
                    if (session.isValid()) {
                        callback.callbackWithParam(session.getAccessToken().getJwtToken());
                    }
                }
            });
        else
            callback.callbackWithParam(null);
    }

    getIdToken(callback: Callback): void {
        if (callback == null) {
            throw("CognitoUtil: callback in getIdToken is null...returning");
        }
        if (this.getCurrentUser() != null)
            this.getCurrentUser().getSession(function (err, session) {
                if (err) {
                    console.log("CognitoUtil: Can't set the credentials:" + err);
                    callback.callbackWithParam(null);
                }
                else {
                    if (session.isValid()) {
                        callback.callbackWithParam(session.getIdToken().getJwtToken());
                    } else {
                        console.log("CognitoUtil: Got the id token, but the session isn't valid");
                    }
                }
            });
        else
            callback.callbackWithParam(null);
    }

    getRefreshToken(callback: Callback): void {
        if (callback == null) {
            throw("CognitoUtil: callback in getRefreshToken is null...returning");
        }
        if (this.getCurrentUser() != null)
            this.getCurrentUser().getSession(function (err, session) {
                if (err) {
                    console.log("CognitoUtil: Can't set the credentials:" + err);
                    callback.callbackWithParam(null);
                }

                else {
                    if (session.isValid()) {
                        callback.callbackWithParam(session.getRefreshToken());
                    }
                }
            });
        else
            callback.callbackWithParam(null);
    }

    refresh(): void {
        this.getCurrentUser().getSession(function (err, session) {
            if (err) {
                console.log("CognitoUtil: Can't set the credentials:" + err);
            }

            else {
                if (session.isValid()) {
                    console.log("CognitoUtil: refreshed successfully");
                } else {
                    console.log("CognitoUtil: refreshed but session is still not valid");
                }
            }
        });
    }

    getRedirectUrl() {
        return this._REDIRECT_URL;
    }

    getServerUrl() {
        return this._SERVER_URL;
    }

    getLivePort() {
        return this._LIVE_PORT;
    }

    getTCPPort() {
        return this._TCP_PORT;
    }
}

@Injectable()
export class UserRegistrationService {

    constructor(@Inject(CognitoUtil) public cognitoUtil: CognitoUtil) {

    }

    register(user: RegistrationUser, callback: CognitoCallback): void {
        console.log("UserRegistrationService: user is " + user);

        let attributeList = [];

        let dataEmail = {
            Name: 'email',
            Value: user.email
        };
        let dataName = {
            Name: 'name',
            Value: user.name
        };
        attributeList.push(new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail));
        attributeList.push(new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataName));

        this.cognitoUtil.getUserPool().signUp(user.email, user.password, attributeList, null, function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                console.log("UserRegistrationService: registered user is " + result);
                callback.cognitoCallback(null, result);
            }
        });

    }

    confirmRegistration(username: string, confirmationCode: string, callback: CognitoCallback): void {

        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.confirmRegistration(confirmationCode, true, function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                callback.cognitoCallback(null, result);
            }
        });
    }

    resendCode(username: string, callback: CognitoCallback): void {
        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.resendConfirmationCode(function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                callback.cognitoCallback(null, result);
            }
        });
    }

}

@Injectable()
export class UserLoginService {

    constructor( public cognitoUtil: CognitoUtil) {
    }

    authenticate(username: string, password: string, callback: CognitoCallback) {
        console.log("UserLoginService: stgarting the authentication")
        // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
        AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})

        let authenticationData = {
            Username: username,
            Password: password,
        };
        let authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        console.log("UserLoginService: Params set...Authenticating the user");
        let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
        console.log("UserLoginService: config is " + AWS.config);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {

                var logins = {}
                logins['cognito-idp.' + CognitoUtil._REGION + '.amazonaws.com/' + CognitoUtil._USER_POOL_ID] = result.getIdToken().getJwtToken();

                // Add the User's Id Token to the Cognito credentials login map.
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
                    Logins: logins
                });

                console.log("UserLoginService: set the AWS credentials - " + JSON.stringify(AWS.config.credentials));
                console.log("UserLoginService: set the AWSCognito credentials - " + JSON.stringify(AWSCognito.config.credentials));
                callback.cognitoCallback(null, result);
            },
            onFailure: function (err) {
                callback.cognitoCallback(err.message, null);
            },
		     newPasswordRequired: function(userAttributes, requiredAttributes) {
            // User was signed up by an admin and must provide new 
            // password and required attributes, if any, to complete 
            // authentication.

				// the api doesn't accept this field back
				delete userAttributes.email_verified;

				callback.cognitoCallback("Please provide a new password to complete authentication", userAttributes);
				
				// Get these details and call 
				//callback.cognitoCallback(null, result);
        }
        });
    }

    forgotPassword(username: string, callback: CognitoCallback) {
        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function (result) {

            },
            onFailure: function (err) {
                callback.cognitoCallback(err.message, null);
            },
            inputVerificationCode() {
                callback.cognitoCallback(null, null);
            }
        });
    }

    confirmNewPassword(email: string, verificationCode: string, password: string, callback: CognitoCallback) {
        let userData = {
            Username: email,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, password, {
            onSuccess: function (result) {
                callback.cognitoCallback(null, result);
            },
            onFailure: function (err) {
                callback.cognitoCallback(err.message, null);
            },
			
        });
    }

    logout() {
        console.log("UserLoginService: Logging out");

        this.cognitoUtil.getCurrentUser().signOut();

    }

    isAuthenticated(callback: LoggedInCallback) {
        if (callback == null)
            throw("UserLoginService: Callback in isAuthenticated() cannot be null");

        let cognitoUser = this.cognitoUtil.getCurrentUser();

        if (cognitoUser != null) {
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    console.log("UserLoginService: Couldn't get the session: " + err, err.stack);
                    callback.isLoggedIn(err, false);
                }
                else {
                    console.log("UserLoginService: Session is " + session.isValid());
                    callback.isLoggedIn(err, session.isValid());
                }
            });
        } else {
            console.log("UserLoginService: can't retrieve the current user");
            callback.isLoggedIn("Can't retrieve the CurrentUser", false);
        }
    }

}

@Injectable()
export class UserParametersService {

    constructor(public cognitoUtil: CognitoUtil) {
    }

    getParameters(callback: Callback) {
        let cognitoUser = this.cognitoUtil.getCurrentUser();

        if (cognitoUser != null) {
            cognitoUser.getSession(function (err, session) {
                if (err)
                    console.log("UserParametersService: Couldn't retrieve the user");
                else {
                    cognitoUser.getUserAttributes(function (err, result) {
                        if (err) {
                            console.log("UserParametersService: in getParameters: " + err);
                        } else {
                            callback.callbackWithParam(result);
                        }
                    });
                }

            });
        } else {
            callback.callbackWithParam(null);
        }


    }
}


@Injectable()
export class TransferService {
    net: any;
    socket: any;

    constructor(public cognitoUtil: CognitoUtil) {        
    }

    connect() {
        this.net     = new WebTCP(this.cognitoUtil.getServerUrl(), this.cognitoUtil.getLivePort());
        this.socket  = this.net.createSocket(this.cognitoUtil.getServerUrl(), this.cognitoUtil.getTCPPort());

        this.socket.on('connect', () => {
          console.log('connected');
        });
    }

    send(data) {
        this.socket.write(JSON.stringify(data));
    }

    receive(callback) {
        this.socket.on('data', (data)=> {
            console.log("data: ", data);
            callback(JSON.parse(data));
        });
    }

    end() {
        this.socket.on('end', () => {
          console.log('connected');
        });
    }
}