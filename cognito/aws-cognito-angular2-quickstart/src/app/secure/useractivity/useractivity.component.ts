import {Component} from "@angular/core";
import {LoggedInCallback, UserLoginService} from "../../service/cognito.service";
import {Router} from "@angular/router";


export class Stuff {
    public type: string;
    public date: string;
}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './useractivity.html'
})
export class UseractivityComponent implements LoggedInCallback {

    public logdata: Array<Stuff> = [];

    constructor(public router: Router,  public userService: UserLoginService) {
        this.userService.isAuthenticated(this);
        console.log("in UseractivityComponent");
    }

    isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {

        }
    }

}
