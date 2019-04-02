import { Component } from "@angular/core";
import { isIOS } from "tns-core-modules/ui/page/page";

@Component({
    selector: "ns-app",
    moduleId: module.id,
    templateUrl: "./app.component.html"
})
export class AppComponent {
    userInteraction($event) { 
        console.log('interaction');
        if (isIOS) {
            $event.ios.cancelsTouchesInView = false;
          }
    }
 }
