# Logout on user IDLE using RXJS in an Nativescript Angular Application

Nativescript is an awesome framework for building native mobile applications for both iOS and Android platforms, I've beeen using it for a while now and I'm pretty happy with the results. 

The latest application that I was working on, required an automatic logout on lack of user interactions (aka on user Idle).

The first approach that I came up with, was creating a StackLayout wrapper for the page-router-outlet in the app component; this makes sense because the app component is the container of all views inside the aplication. So I did as follows.

Previously I had:

```xml
<page-router-outlet></page-router-outlet>
```

Then:
```xml 
<StackLayout (tap)="userInteraction($event)">
    <page-router-outlet></page-router-outlet>
</StackLayout>
```

In the app.component.ts we could only create the event that is binded to the html and then use it to restart a timer to avoid the session to close it looks like this:


```typescript
userInteraction($event) {
    // do whatever you need to
  }
  ```

But it was far that easy, in iOS this worked ok and the events were propagated to all the child components and we were able to intercept the event on every user interaction, but in android the event wasn't propagated to the child components(or at least didn't work for all scenarios by the time we were building the app :P), so I was forced to find another approach. 


## Overriding native Android activity

Looking for alternatives to the mentioned problem in Android platform I found this [answer](https://stackoverflow.com/a/48789139/2989313) from Nick IIiev in StackOverflow. More information in this [detailed post](https://docs.nativescript.org/core-concepts/android-runtime/advanced-topics/extend-application-activity) on official Nativescript docs.

## Step by Step

1. Create a new NativeScript application

    ```sh
    tns create idleLogoutApp --ng
    ```

2. cd to the newly created project

3. Open the newly created app in your prefered editor

4. Modify your app.component.html to look like this:

    ```xml 
    <StackLayout (tap)="userInteraction($event)">
        <page-router-outlet></page-router-outlet>
    </StackLayout>
    ```

5. Modify your app.component.ts to add the event handler for the tap event.

    ```typescript
    // The rest of the class is omitted for simplicity
    userInteraction($event) { 
        if (isIOS) {
            $event.ios.cancelsTouchesInView = false;
        }
    }
    ```

    Up to this point you should be able to intercept the user interactions of an iOS application and do whatever you need to do, like reset the idle timer, I will show you how to do that using rxjs interval later in this post.

6. Create an empty file called user-interaction.ts and modify it to be like this.

    ```typescript
    import { Subject } from 'rxjs';

    export const ANDROID_USER_ACTIVITY_EVENTS = new Subject();
    ```

    Here we make use of a rxjs Subject class to be able to comunicate between Android native aplication context and the Nativescript application so we can be able to intercept this event and respond in consecuence

7. Install tns-platforms-declarations library as a dev dependency.

    ```sh
     npm i tns-platform-declarations --save-dev
     ```

    Be sure to add the skipLibCheck property in tsconfig.json file to avoid this lib check to take place and slow down your project compilation time

8. Create a reference.d.ts file and add the following line:

    ```typescript
    /// <reference path="./node_modules/tns-platform-declarations/android-21.d.ts" />
    ```
    This allows you to use Native Android APIs, you can learn more about it [here](https://docs.nativescript.org/core-concepts/accessing-native-apis-with-javascript#intellisense-and-access-to-the-native-apis-via-typescript)

9. Create an empty file called activity.android.ts and modify it to be like this.

    ```typescript

    import { ANDROID_USER_ACTIVITY_EVENTS } from "./user-interaction";
    import { AndroidActivityCallbacks, setActivityCallbacks } from "tns-core-modules/ui/frame/frame";


    @JavaProxy('com.tns.NativeScriptActivity')
    class Activity extends android.support.v7.app.AppCompatActivity {
        private _callbacks: AndroidActivityCallbacks;

        public onUserInteraction(): void {
            ANDROID_USER_ACTIVITY_EVENTS.next(null);
            console.log('user interaction');
        }

        public onCreate(savedInstanceState: any): void {
            if (!this._callbacks) {
                setActivityCallbacks(this);
            }

            this._callbacks.onCreate(this, savedInstanceState, super.onCreate);
        }

        public onSaveInstanceState(outState: any): void {
            this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
        }

        public onPause(): void {
            this._callbacks.onStart(this, super.onPause);
        }

        public onStart(): void {
            this._callbacks.onStart(this, super.onStart);
        }

        public onStop(): void {
            this._callbacks.onStop(this, super.onStop);
        }

        public onDestroy(): void {
            this._callbacks.onDestroy(this, super.onDestroy);
        }

        public onBackPressed(): void {
            this._callbacks.onBackPressed(this, super.onBackPressed);
        }

        public onRequestPermissionsResult(requestCode: number, permissions: Array<string>, grantResults: Array<number>): void {
            this._callbacks.onRequestPermissionsResult(this, requestCode, permissions, grantResults, undefined /*TODO: Enable if needed*/);
        }

        public onActivityResult(requestCode: number, resultCode: number, data: any): void {
            this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
        }
    }
    ```
    You have to make sure that the qualified name of the activity inside @JavaProxy anotation matches the name for the main activity in AndroidManifest.xml

    For the purpose of this written we only need to override the method onUserInteraction but the rest of the methods are shown for you to see the possibilities

10. Modify your app.component.ts file again to add the subject emitter, it should look like this:

    ```typescript
    // The rest of the class is omitted for simplicity
    userInteraction($event) { 
        if (isIOS) {
            $event.ios.cancelsTouchesInView = false;
        }

        ANDROID_USER_ACTIVITY_EVENTS.next(null);
    }
    ```
11. Create your timer logic service

    ```typescript
    import { Injectable } from "@angular/core";
    import { ANDROID_USER_ACTIVITY_EVENTS } from "./user-interaction";
    import { Observable, interval, Subscription } from "rxjs";
    import { mapTo, scan } from 'rxjs/operators';

    @Injectable()
    export class TimeoutService {
    timeoutTimer: Observable<number> = this.timeoutTimer || interval(1000);
    totalTimeOut: number = 120;
    warningTimeOut: number = 60;
    secondtime: number;
    private subscription: Subscription;
    public started = false;

    constructor() {
        ANDROID_USER_ACTIVITY_EVENTS.subscribe(() => {
        this.stop();
        this.start();
        });

    }

    start() {
        if (!this.totalTimeOut) {
        setTimeout(() => {
            this.start();
        }, 1000);
        } else {
        this.startTimer();
        }
    }

    startTimer() {
        if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = undefined;
        }

        this.subscription = this.timeoutTimer
        .pipe(
            mapTo(1000),
            scan((acum, current) => acum + current, 0)
        )
        .subscribe(timeElapsed => {
            this.started = true;
            if (timeElapsed >= this.totalTimeOut * 1000) {
            this.stop();
            // Time is up, do whatever you want here

            alert('Session closed');
            }

            //You can also alert the user X time before 
            if (timeElapsed === this.totalTimeOut * 1000 - this.warningTimeOut * 1000) {
                alert('Session is about to close');
            }
        });
    }

    stop() {
        if (this.subscription) {
        this.subscription.unsubscribe();
        }
        this.started = false;
    }
    }

    ```

12. Inject the TimeoutService and Init/Start the timer when ever you need(when user reaches dashboard after succesful login). 


    In this case I did't when reaching ItemsDetailComponent in Angular default starter template

    ```typescript
    import { Component, OnInit } from "@angular/core";
    import { ActivatedRoute } from "@angular/router";

    import { Item } from "./item";
    import { ItemService } from "./item.service";
    import { TimeoutService } from "../timeout.service";

    @Component({
        selector: "ns-details",
        moduleId: module.id,
        templateUrl: "./item-detail.component.html"
    })
    export class ItemDetailComponent implements OnInit {
        item: Item;

        constructor(
            private itemService: ItemService,
            private route: ActivatedRoute,
            private timeoutService: TimeoutService
        ) { }

        ngOnInit(): void {
            const id = +this.route.snapshot.params.id;
            this.item = this.itemService.getItem(id);
            this.timeoutService.start();
        }
    }

    ```

    Don't forget to register TimeoutService in your module's providers :P

And that's it, now you can implement this workflow in your NativeScript Angular applications, I'm eager to see if you have some comments about it or if exits a better way to accomplish it.

