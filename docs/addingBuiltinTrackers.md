# Developing a built-in tracker

If you are a developer looking to add a tracker with more functionality than is provided by a [custom tracker](./customTrackers.md), then you have the option to write code that works directly with some of the app's underlying services.

Reasons you may want to do this instead of a custom tracker:

- Dynamically changing which dropdowns display based on slot data.
    - This can be helpful in entrance randomizer cases where a player may desire higher separation of sections
- Renaming location names
    - This can be helpful for changing the naming scheme to something more player friendly than the archipelago names used. Though I would recommend seeing if the names can be changed on the world side first

Downsides:

- The code must be included in builds of the app as of now
    - Loading of arbitrary code from user supplied files is not something I want to deal with for now
- Harder maintenance.
    - While we will do our best to avoid breaking changes, new requirements may pop up and require code to be fixed.

> **Warning:** This feature is still in development, API's for the services may change a lot.

## The basics

### Tracker interface

A `Tracker` is defined to be any object that fits the `Tracker` interface:

```typescript
interface TrackerBuilderParams {
    locationManager: LocationManager;
    entranceManager: EntranceManager;
    groupManager: GroupManager;
    sectionManager: SectionManager;
    slotData: unknown;
}

type TrackerBuilder = (params: TrackerBuilderParams) => Promise<void>;

interface Tracker {
    name: string;
    gameName: string;
    id: string;
    gameTitle?: string;
    gameAbbreviation?: string;
    buildTracker: TrackerBuilder;
    exportTracker?: () => import("./generic/categoryGenerators/customTrackerManager").CustomCategory_V1;
}
```

You can ignore the optional parameters. `gameTitle` and `gameAbbreviation` are not used and `exportTracker` is currently only called on generic trackers.

### Services

The services you can interact with and what they do:

- `LocationManager`: Manages the state of locations within the app. Many other services interact with this one to add information about locations and their current status. The service is defined [here](../src/services/locations/locationManager.ts) and has most methods commented.
    - The main use for a built-in tracker with this service is the `updateLocationStatus` method. Here you can update any property that is defined in the `LocationStatus` interface (defined in the same file).
- `GroupManager`: Groups multiple locations together in an unbreakable group. You should only need to pass your group configuration by calling `loadGroups` to it once when your tracker is built. Load groups takes the same data as the `"groupData"` property as explained in the [custom tracker documentation](./customTrackers.md)
- `SectionManager`: Sets up the dropdowns, referencing the groups given to the group manager. You should only need to pass your section configuration by calling `setConfiguration` once when your tracker is built. Set Configuration takes the same data as `"sectionData"` property as explained in the [custom tracker documentation](./customTrackers.md)

    - There are ways to update this data afterwards, but they are untested and subject to change.

- `EntranceManager`: Not used for now, will make a comeback at a later date.

- `slotData`: This is what ever was stored in the slot data by the world developers.

### How does the app use my tracker?

The app will load your tracker object on start up and configure it as a selectable tracker option in the options menu. If the player selects your tracker and then loads a matching game, your tracker will have its `buildTracker` method called, where it is expected that all the resources the tracker needs are loaded and the `GroupManager` and `SectionManager` as expected to be configured soon after. Without those services, nothing will display. You can then update other services, such as the status of certain locations as you need.

### Registering the tracker

As of right now, you should create a folder in the `games` folder with a fitting name. Then in `builtinTrackers.ts` within the `games` folder, import your tracker and place it in the `builtInTracker` array, the `TrackerManager` will take it from there.

## An example

In this example we are going to add a built-in tracker for Ocarina of Time, that adds spider emojis to any of the Gold Skultulla locations. Why, because I was not sure what else to do for a quick example.

### Tracker object:

Here we define an object with all the needed features and export this from our module. Using a `default` export allows us to easily name this in the `builtInTrackers.ts` file to what ever we want.

The `bulidTracker` method has 3 main parts:

- Load the data, in this case there is an extra module in-between to show how a module can be imported at runtime. This helps decrease the load time of the app as this tracker object is loaded when the app starts.
- Setting up the `sectionManager` and the `groupManager`
- Updating the `displayName` of various locations

This code is in [in "Ocarina of Time/tracker.ts"](../src/games/Ocarina%20of%20Time/tracker.ts).

```typescript
import { Tracker } from "../TrackerManager";

const tracker: Tracker = {
    name: "Ocarina of Time Demo Tracker",
    gameName: "Ocarina of Time",
    id: "3d0e25d3-636d-4929-aa7d-332c72863175",
    buildTracker: async ({
        sectionManager,
        groupManager,
        locationManager,
        slotData: _slotData,
    }) => {
        // Dynamically load the the backend module, we do not need to load the module if this tracker is not being used
        const data = await import("./loadData").then(
            (module) => module.trackerData
        );
        // slotData by default is unknown, if you know the structure of your slot data, casting it like so can be helpful
        const slotData = _slotData as { tokensanity: 0 | 1 | 2 | 3 };
        // Configure the group and section managers
        groupManager.loadGroups(data.groupData);
        sectionManager.setConfiguration(data.sectionData);
        // Get all locations, and append anything with "GS" with a spider emoji for demo purposes
        if (slotData.tokensanity) {
            locationManager
                .getMatchingLocations(() => true)
                .forEach((locationName) => {
                    locationManager.updateLocationStatus(locationName, {
                        displayName: `${locationName}${locationName.includes("GS") ? " 🕷️ " : ""}`,
                    });
                });
        }
    },
};

export default tracker;
```

### Registering the tracker:

This needs to be done in the [games/builtInTrackers.ts](../src/games/builtInTrackers.ts) file.

We import the tracker (naming it `tracker_oot` to avoid future name collisions) and place it in the `builtInTrackers` array. Now the app will read this array and know to add the built-in tracker as an option.

```typescript
import tracker_oot from "./Ocarina of Time/tracker";
import { Tracker } from "./TrackerManager";

const builtInTrackers: Tracker[] = [tracker_oot];

export { builtInTrackers };
```

## Need more help?

Reach out to me on Discord or on the GitHub discussions portion of this repository.
