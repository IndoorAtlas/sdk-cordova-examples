import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import IndoorAtlas from 'react-native-indooratlas';
import MapView, { Marker, Circle, Overlay } from 'react-native-maps';

const IA_API_KEY = '';

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
      region: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001
      },
      floorPlanImageUrl: null,
      bounds: null,
      bearing: 0,
      bottomLeftMarkerLoc: null,
      topRightMarkerLoc: null,
      logMessage: ''
    };
  }

  UNSAFE_componentWillMount() {
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
            latitudeDelta: 0.0005, // Smaller value for higher zoom level
            longitudeDelta: 0.0005 // Smaller value for higher zoom level
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


  handleFloorPlan = (floorPlan) => {
    if (floorPlan && floorPlan.url && floorPlan.topLeft && floorPlan.bottomLeft) {
      
      console.log("Entered floor plan: " +JSON.stringify(floorPlan));

      const logMessage = `Entered floor plan: ${floorPlan.name}`;
      this.setState({ logMessage: logMessage });

      // See: https://github.com/IndoorAtlas/cordova-plugin/blob/master/www/FloorPlan.js#L94

      // There's discrepancy between the react-native-maps API and IndoorAtlas API:
      // 
      //  The react-native-maps API uses the lat,lon of topLeft and bottomRight of _unrotated_ image and the center point lat,lon
      //  to draw the floor plan overlay on the world map. Rotated here means "overlayed on the world map in the correct orientation and size".
      // 
      //  However, the IndoorAtlas floorPlan object gives the lat,lon of the bottomLeft, topLeft and center of the _rotated_ image.
      //
      // To accomodate this discrepancy, we need to calculate the lat,lon of the bottomLeft and topRight of the _unrotated_ image i.e.
      // reset the rotation by rotating backwards with the angle defined by floorPlan.bearing.
      // 
      // Note that floorPlan.pointToCoordinate(0,0) doesn't gives the bottomLeft lat,lon of the overlayed i.e. rotated image, which we can't use.
      
      // Calculate 4th corner of a rectangle given 3 corners
      const p_BL = { lat: floorPlan.bottomLeft[1], lon: floorPlan.bottomLeft[0] };
      const p_TR = { lat: floorPlan.topRight[1], lon: floorPlan.topRight[0] };
      const p_TL = { lat: floorPlan.topLeft[1], lon: floorPlan.topLeft[0] };
      
      const p_BR = this.calculateFourthCorner(p_BL, p_TL, p_TR);
      console.log("Fourth Corner bottom-right:", p_BR);

      const corners = [
        p_BL,
        p_TL,
        p_TR,
        p_BR
      ];

      const center = { lat: floorPlan.center[1], lon: floorPlan.center[0] };
      const angle = floorPlan.bearing;

      // This returns coordinates in the following format:
      // LOG  Rotated corners:[
      //   {"lat":65.04541835106184,"lon":25.498826553131217},
      //   {"lat":65.04553810667029,"lon":25.498826553642473},
      //   {"lat":65.0455379863724,"lon":25.49908096647423},
      //   {"lat":65.04541823076394,"lon":25.499080965962975}]

      const rotatedCorners = this.rotateRectangle(corners, center, angle);
      console.log("Rotated corners:" + JSON.stringify(rotatedCorners));

      console.log(`floorPlan.bitmapWidth: ${floorPlan.bitmapWidth}`);
      console.log(`floorPlan.bitmapHeight: ${floorPlan.bitmapHeight}`);

      const bounds = [
        [rotatedCorners[0].lat, rotatedCorners[0].lon], // bottomLeft
        [rotatedCorners[2].lat, rotatedCorners[2].lon] // topRight
      ];

      
      // Just for debugging purposes, let's visualize as markers the bottomLeft and topRight corners of the rotated image

      // Convert bottomLeft to coordinates that can be used for Marker
      const bottomLeftMarker = {
        latitude: rotatedCorners[0].lat,
        longitude: rotatedCorners[0].lon
      };
      // Convert topRight to coordinates that can be used for Marker
      const topRightMarker = {
        latitude: rotatedCorners[2].lat,
        longitude: rotatedCorners[2].lon
      };

      this.setState({
        floorPlanImageUrl: floorPlan.url,
        bounds: bounds,
        bearing: floorPlan.bearing,
        bottomLeftMarkerLoc: bottomLeftMarker,
        topRightMarkerLoc: topRightMarker
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



  rotateRectangle = (corners, center, angleDegrees) => {
    const R = 6371 * 1000; // Earth's radius in meters
    const angleRad = (angleDegrees * Math.PI) / 180; // Convert angle to radians

    function latLonToXY(lat, lon, centerLat) {
        const x = R * lon * Math.cos((centerLat * Math.PI) / 180);
        const y = R * lat;
        return { x, y };
    }

    function xyToLatLon(x, y, centerLat) {
        const lat = y / R;
        const lon = x / (R * Math.cos((centerLat * Math.PI) / 180));
        return { lat, lon };
    }

    // Convert all corners to x, y relative to center
    const centerXY = latLonToXY(center.lat, center.lon, center.lat);
    const rotatedCorners = corners.map(({ lat, lon }) => {
        const { x, y } = latLonToXY(lat, lon, center.lat);

        // Translate to origin
        const relX = x - centerXY.x;
        const relY = y - centerXY.y;

        // Apply rotation
        const rotatedX = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
        const rotatedY = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);

        // Translate back and convert to lat/lon
        const finalX = rotatedX + centerXY.x;
        const finalY = rotatedY + centerXY.y;

        return xyToLatLon(finalX, finalY, center.lat);
    });

    return rotatedCorners;
}


  calculateFourthCorner = (p1, p2, p3) => {
    return {
        lat: p1.lat + p3.lat - p2.lat,
        lon: p1.lon + p3.lon - p2.lon,
    };
  }


  
  render() {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={this.state.region}
          initialRegion={{
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001
          }}
        >
          {this.state.bottomLeftMarkerLoc && (
            <Marker 
              coordinate={this.state.bottomLeftMarkerLoc} 
              pinColor="red"
            />
          )}
          {this.state.topRightMarkerLoc && (
            <Marker 
              coordinate={this.state.topRightMarkerLoc} 
              pinColor="pink"
            />
          )}
          {this.state.floorPlanImageUrl && this.state.bounds && (
            <Overlay
              image={this.state.floorPlanImageUrl}
              bounds={this.state.bounds}
              bearing={this.state.bearing}
            />
          )}
         <Circle 
            center={this.state.location} 
            radius={1} 
            fillColor="rgba(0, 0, 0, 1.0)" // last value is the opacity
            strokeColor="rgba(0, 0, 0, 1.0)"
          />
         <Circle 
            center={this.state.location} 
            radius={this.state.accuracy} 
            fillColor="rgba(0, 0, 255, 0.8)" // last value is the opacity
            strokeColor="rgba(0, 0, 255, 1.0)"
          />
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