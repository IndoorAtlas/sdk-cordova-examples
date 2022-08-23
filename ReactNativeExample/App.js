import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import IndoorAtlas from 'react-native-indooratlas';

import MapView, { Marker } from 'react-native-maps';

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
      }
    };
  }

  UNSAFE_componentWillMount() {
    // start positioning
    IndoorAtlas.initialize({ apiKey: IA_API_KEY })
     .watchPosition(position => {
       console.log(
         "latitude: " + position.coords.latitude + ", " +
         "longitude: " + position.coords.longitude + ", " +
         "floor: " + position.coords.floor
       );
       this.setState({location: position.coords, region: { latitude: position.coords.latitude, longitude: position.coords.longitude, latitudeDelta: 0.001, longitudeDelta: 0.001 }});
     })
     .getTraceId(traceId => console.log('traceId: ' + traceId))
     .onStatusChanged(status => console.log('status: +' + status.name))
     .watchVenue(venue => console.log('venue: ' + (venue.name || 'EXIT')))
     .watchFloorPlan(fp => console.log('fp: ' + JSON.stringify(fp)))
     .watchGeofences((type, geofence) => console.log('geofence ' + type + ' ' + JSON.stringify(geofence)));
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
          <Marker coordinate={this.state.location} />
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
    width: 400
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});
