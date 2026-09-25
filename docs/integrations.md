# Integrations

This page documents interactions external applications may have with the this tracker.

## URL Parameters

> **NOTE**: all parameters must be URI encoded to work properly, examples will show fully encoded URL's.
>
> Some parameters should be safe to encode without any additional encoding

### Connect to a room or server with a slot name and password

#### Parameters

- `host`: The hostname of the archipelago server or archipelago web host
    - Required if `port` or `room` is provided
    - Example: `archipelago.gg`
- `port`: The port number of the archipelago server
    - Required if `host` is provided but not `room`
    - Example: `38281`
- `room`: The url of the room on an archipelago web host to connect to
    - Required of `host` is provided but not `port`
    - Causes `port`field to be ignored
    - Must be URI component encoded
    - Example: `https://archipelago.gg/room/7nDDDDHvBBBBKHOgpaAAAA`
- `slot`: The slot name of the slot to connect to
    - Required if `host` is provided
    - Must be URI component encoded
- `password`: The password of the server
    - Must be URI component encoded

#### Construction Code Example (JavaScript)

```js
// Normally you would use only one of the the port parameter or the room parameter, but both are provided as an example
let host = "archipelago.gg";
let port = 38281;

let slot = "Dr. Awesome";
let roomURL = "https://archipelago.gg/room/7nDDDDHvBBBBKHOgpaAAAA";
let password = "";

let connectURL = `https://drawesome4333.github.io/ap-tracker/?host=${host}&port=${port}&room=${encodeURIComponent(roomURL)}&slot=${encodeURIComponent(slot)}${password && `&password=${encodeURIComponent(password)}`}`;
console.log(connectURL);
// 'https://drawesome4333.github.io/ap-tracker/?host=archipelago.gg&port=38281&room=https%3A%2F%2Farchipelago.gg%2Froom%2F7nDDDDHvBBBBKHOgpaAAAA&slot=Dr.%20Awesome'
```
