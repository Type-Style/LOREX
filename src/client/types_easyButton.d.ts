import 'leaflet';

declare module 'leaflet' {
  namespace Control {
    // Define the EasyButton interface with a button property
    interface EasyButton extends L.Control {
      button: HTMLElement;
    }
  }
}