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