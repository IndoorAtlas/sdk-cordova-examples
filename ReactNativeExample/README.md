# IndoorAtlas & React.Native example

API for IndoorAtlas Cordova and React.Native plugins is shared, see https://docs.indooratlas.com/cordova/latest/
If you are not familiar with IndoorAtlas start here: https://docs.indooratlas.com

## Requirements

React.Native development environment. See https://reactnative.dev/docs/environment-setup

## Setting up

Clone the git repository:

```
git clone https://github.com/IndoorAtlas/sdk-cordova-examples
cd sdk-cordova-examples/ReactNativeExample
```

Install dependencies:

```
npm install
```

Set your IndoorAtlas API key (`IA_API_KEY`) in `App.js`. API keys can be generated at https://app.indooratlas.com/apps.

## Running on device

Get familiar with https://reactnative.dev/docs/running-on-device

### iOS

Install pods:

```
cd ios
pod install
```

Open in Xcode, build and run:

```
open ReactNativeExample.xcworkspace
```

### Android

Get a Google maps API key from https://developers.google.com/maps/documentation/android-sdk/get-api-key
Edit `android/app/src/main/AndroidManifest.xml` and replace `MAPS_API_KEY` with correct value:

```
<meta-data                                                                                                                                                                                                                                                                                      
    android:name="com.google.android.geo.API_KEY"                                                                                                                                                                                                                                                 
    android:value="MAPS_API_KEY" />    
```

Build and run:

```
npx react-native run-android
```


# Add IndoorAtlas to existing React.Native project

Add react-native-indooratlas dependency to package.json:

```
"react-native-indooratlas": "git+https://github.com/indooratlas/cordova-plugin.git#react-native"
```

Update dependencies:

```
npm install
```

## iOS

For additional info, see https://indooratlas.freshdesk.com/support/solutions/articles/36000051274-setup-positioning-with-ios

Make sure your `Info.plist` includes the required keys.

Add pod dependencies to `ios/Podfile`:

```
pod 'RCTCordova', :path => '../node_modules/@remobile/react-native-cordova/ios'
pod 'RCTIndoorAtlas', :path => '../node_modules/react-native-indooratlas/src/ios'
```

Install pods:

```
cd ios
pod install
```

## Android:

For additional info, see https://indooratlas.freshdesk.com/support/solutions/articles/36000050564-setup-positioning-sdk-with-android

Note that only targetSdkVersion >= 31 is supported by the React Native plugin.

Add projects to `android/settings.gradle`:

```
include ':react-native-cordova'
project(':react-native-cordova').projectDir = file('../node_modules/@remobile/react-native-cordova/android')

include ':react-native-indooratlas'
project(':react-native-indooratlas').projectDir = file('../node_modules/react-native-indooratlas/src/android')
```

Add react-native-indooratlas dependency to `android/app/build.gradle`:

```
implementation project(':react-native-indooratlas') 
```

Add IndoorAtlas SDK repository to `android/build.gradle`

```
maven {
    url "https://dl.cloudsmith.io/public/indooratlas/mvn-public/maven/"
}
```

Add `RCTIndoorAtlasPackage` to package list in your `MainApplication.java`

```
// ...
import com.ialocation.plugin.RCTIndoorAtlasPackage;

// ...
  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {

// ...
        @Override
        protected List<ReactPackage> getPackages() {
          List<ReactPackage> packages = new PackageList(this).getPackages();
          packages.add(new RCTIndoorAtlasPackage());
          return packages;
        }
```
