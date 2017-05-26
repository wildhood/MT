var panorama;
function streetviewyummy() {
  panorama = new google.maps.StreetViewPanorama(
      document.getElementById('street-view'),
      {
        position: {lat: 37.869260, lng: -122.254811},
        pov: {heading: 165, pitch: 0},
        zoom: 1
      });
}
