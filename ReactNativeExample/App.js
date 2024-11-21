import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import IndoorAtlas from 'react-native-indooratlas';
import MapView, { Marker, Circle, Overlay } from 'react-native-maps';


const IA_API_KEY = 'YOUR IndoorAtlas API KEY HERE';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu'
});

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      location: {
        latitude: 0,
        longitude: 0
      },
      accuracy: 1,
      blueDotRadius: 5,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
      region: {
        latitude: 65.06,
        longitude: 25.43,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      },
      floorPlanImageUrl: null,
      bounds: null,
      bearing: 0,
      bottomLeftMarkerLoc: null,
      topRightMarkerLoc: null,
      logMessage: ''
    };
  }

  componentDidMount() {
    // start positioning

    console.log("starting positioning");

    IndoorAtlas.initialize({ apiKey: IA_API_KEY })
      .watchPosition(position => {
        //console.log("position: " + JSON.stringify(position));
        console.log(
          "latitude: " + position.coords.latitude + ", " +
          "longitude: " + position.coords.longitude + ", " +
          "accuracy: " + position.coords.accuracy + ", " +
          "floor: " + position.coords.floor
        );


        this.setState({
          location: position.coords,
          accuracy: position.coords.accuracy,
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: this.state.latitudeDelta, // Smaller value for higher zoom level
            longitudeDelta: this.state.longitudeDelta // Smaller value for higher zoom level
          }
        });
      })
      .getTraceId(traceId => console.log('traceId: ' + traceId))
      .onStatusChanged(status => console.log('status: ' + status.name))
      
      // Stop existing venue watch if any
      if (this.state.venueWatchHandle) {
        this.state.venueWatchHandle.remove();
      }
      const venueWatchHandle = IndoorAtlas.watchVenue(venue => console.log('venue: ' + (venue.name || 'EXIT')));
      this.setState({ venueWatchHandle });

      // Stop existing floor plan watch if any
      if (this.state.floorPlanWatchHandle) {
        this.state.floorPlanWatchHandle.remove();
      }
      const floorPlanWatchHandle = IndoorAtlas.watchFloorPlan(fp => this.handleFloorPlan(fp));
      this.setState({ floorPlanWatchHandle });

      // Stop existing geofence watch if any
      if (this.state.geofenceWatchHandle) {
        this.state.geofenceWatchHandle.remove();
      }
      const geofenceWatchHandle = IndoorAtlas.watchGeofences((type, geofence) => console.log('geofence ' + type + ' ' + JSON.stringify(geofence)));
      this.setState({ geofenceWatchHandle });
  }

  componentWillUnmount() {
    IndoorAtlas.clearWatch();
  }


  handleFloorPlan = (floorPlan) => {
    if (floorPlan && floorPlan.url && floorPlan.topLeft && floorPlan.bottomLeft) {
      
      console.log("Entered floor plan: " +JSON.stringify(floorPlan));

      const logMessage = `Entered floor plan: ${floorPlan.name}`;
      this.setState({ logMessage: logMessage });

      // You may want to use this to scale your blue dot to show the uncertainty of the location
      const blueDotRadius = Math.round(this.state.accuracy * floorPlan.metersToPixels);
      console.log(`blueDotRadius: ${blueDotRadius}`);
      this.setState({ blueDotRadius: blueDotRadius });



      // See: https://github.com/IndoorAtlas/cordova-plugin/blob/master/www/FloorPlan.js#L94

      // There's discrepancy between the react-native-maps API and IndoorAtlas API:
      // 
      //  The react-native-maps API uses the lat,lon of topLeft and bottomRight of _unrotated_ image and the center point lat,lon
      //  to draw the floor plan overlay on the world map. Rotated here means "overlayed on the world map in the correct orientation and size".
      // 
      //  However, the IndoorAtlas floorPlan object gives the lat,lon of the bottomLeft, topLeft and center of the _rotated_ image.
      //
      // To accomodate this discrepancy, we need to calculate the lat,lon of the bottomLeft and topRight of the _unrotated_ image i.e.
      // temporarily reset the rotation by rotating backwards with the angle defined by floorPlan.bearing.
      // 
      // Note that floorPlan.pointToCoordinate(0,0) doesn't gives the bottomLeft lat,lon of the overlayed i.e. rotated image, which we can't use.
      

      // Calculate the bottomLeft and topRight of the _unrotated_ image, for react-native-maps Overlay

      const fpBearing = floorPlan.bearing;
      // reset bearing temporarily
      floorPlan.bearing = 0;
      const bottomLeft = floorPlan.pointToCoordinate(0, floorPlan.bitmapHeight);
      const topRight = floorPlan.pointToCoordinate(floorPlan.bitmapWidth, 0);
      // restore bearing
      floorPlan.bearing = fpBearing;

      console.log("bottomLeft: " + JSON.stringify(bottomLeft));
      console.log("topRight: " + JSON.stringify(topRight));

      const bounds = [
        [bottomLeft.latitude, bottomLeft.longitude], // bottomLeft
        [topRight.latitude, topRight.longitude] // topRight
      ];
      
      console.log("bounds: " + JSON.stringify(bounds));

      // Just for debugging purposes, let's visualize as markers the bottomLeft and topRight corners of the rotated image

      // Convert bottomLeft to coordinates that can be used for Marker
      const bottomLeftMarker = {
        latitude: bottomLeft.latitude,
        longitude: bottomLeft.longitude
      };
      // Convert topRight to coordinates that can be used for Marker
      const topRightMarker = {
        latitude: topRight.latitude,
        longitude:  topRight.longitude
      };

      this.setState({
        floorPlanImageUrl: floorPlan.url,
        bounds: bounds,
        bearing: floorPlan.bearing,
        bottomLeftMarkerLoc: bottomLeftMarker,
        topRightMarkerLoc: topRightMarker
      });


      // Calculate the latitudeDelta and longitudeDelta for react-native-maps zoom level
      // Note, the deltas are used in watchPosition above to set the region and zoom for the map view

      const latitudeDelta = Math.abs(topRight.latitude - bottomLeft.latitude)/2;
      const longitudeDelta = Math.abs(topRight.longitude - bottomLeft.longitude)/2;

      console.log(`latitudeDelta: ${latitudeDelta}`);
      console.log(`longitudeDelta: ${longitudeDelta}`);

      this.setState({
          latitudeDelta: latitudeDelta, 
          longitudeDelta: longitudeDelta
      });
      

    } else {
      console.log('Exited floor plan or incomplete floor plan data');
      const logMessage = 'Exited floor plan or incomplete floor plan data';

      this.setState({
        floorPlanImageUrl: null,
        bounds: null,
        bearing: 0,
        logMessage: logMessage
      });    }
  };

  
  render() {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={this.state.region}
          initialRegion={{
            latitude: 65.06,
            longitude: 25.43,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
          }}
        >
          {this.state.bottomLeftMarkerLoc && (
            <Marker 
              coordinate={this.state.bottomLeftMarkerLoc} 
              pinColor="yellow"
            />
          )}
          {this.state.topRightMarkerLoc && (
            <Marker 
              coordinate={this.state.topRightMarkerLoc} 
              pinColor="green"
            />
          )}

          {this.state.floorPlanImageUrl && this.state.bounds && (
            <Overlay
              image={this.state.floorPlanImageUrl}
              bounds={this.state.bounds}
              bearing={this.state.bearing}
            />
          )}
          {this.state.location && (
            <Marker
              coordinate={this.state.location}
              pinColor="blue"
            />
          )}
        </MapView>
        <View style={styles.logContainer}>
          <Text style={styles.logText}>{this.state.logMessage}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 650,
    width: 400
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  logContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
  },
  logText: {
    fontSize: 12,
    color: 'black',
  }

});