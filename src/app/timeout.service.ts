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
        console.log('Time Elapsed: ' + timeElapsed / 1000 + ' second(s)');
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
