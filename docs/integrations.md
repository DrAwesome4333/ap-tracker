# Integrations

This page documents interactions external applications may have with the this tracker.

## URL Parameters

> **NOTE**: all parameters must be URI encoded to work properly, examples will show fully encoded URL's

### Connect to a server with a slot name and password

Use this section to connect directly to the server if you have the slot name, password, and server address.

Example URL for slot name `Dr. Awesome`, no password, on `archipelago.gg:38281`: `https://drawesome4333.github.io/ap-tracker/?connect=Dr.%2520Awesome%3ANone%40archipelago.gg%3A38281`

#### Parameters

- `connect`: This component will take the following form: `<slot>:<password>@<origin>`
    - `slot`: The slot name for the slot you wish to connect to, URI Component encoded.
    - `password`: The password for the server you wish to connect to, URI Component encoded. (Use `None` if there is no password)
    - `origin`: The `host:port`address of the server to connect to.
    - Example (prior to final component encoding) for slot `Dr. Awesome`, no password, on `archipelago.gg:38281`:
        - `Dr.%20Awesome:None@archipelago.gg:38281`

#### Construction Code Example (JavaScript)

```js
let slot = "Dr. Awesome";
let password = "";
let host = "archipelago.gg";
let port = 38281;

let connectParam = `${encodeURIComponent(slot)}:${encodeURIComponent(password || "None")}@${host}:${port}`;
let connectURL = `https://drawesome4333.github.io/ap-tracker/?connect=${encodeURIComponent(connectParam)}`;
console.log(connectURL); // https://drawesome4333.github.io/ap-tracker/?connect=Dr.%2520Awesome%3ANone%40archipelago.gg%3A38281
```

### Connect to a room with a slot name and password

Use this option if you have the room link, slot name, and password of the room. This will link the room to the saved multi-world data to enable related features (such as automatic port updates).

Example URL for the room `https://archipelago.gg/room/ABCDEFGvTvSzKHOgpaPAvQ`, slot `Dr. Awesome`, with no password: `https://drawesome4333.github.io/ap-tracker/?room=https%3A%2F%2Farchipelago.gg%2Froom%2FABCDEFGvTvSzKHOgpaPAvQ&slot=Dr.%20Awesome`

#### Parameters

- `room`: The URL of the room on an archipelago web host to connect to
- `slot`: The slot name of the slot to connect to
- `password` (optional): The password of the server

#### Construction Code Example (JavaScript)

```js
let slot = "Dr. Awesome";
let roomURL = "https://archipelago.gg/room/ABCDEFGvTvSzKHOgpaPAvQ";
let password = "";

let connectURL = `https://drawesome4333.github.io/ap-tracker/?room=${encodeURIComponent(roomURL)}&slot=${encodeURIComponent(slot)}${password && `&password=${encodeURIComponent(password)}`}`;
console.log(connectURL);
// https://drawesome4333.github.io/ap-tracker/?room=https%3A%2F%2Farchipelago.gg%2Froom%2FABCDEFGvTvSzKHOgpaPAvQ&slot=Dr.%20Awesome
```
