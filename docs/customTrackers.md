# Custom Tracker Guide

In this guide, we will explain how to create and use a custom tracker. I highly recommend checking out the [specification](#custom-tracker-specification) as well.

> Looking for the old guide for the previous format? It is now located here: [previous format spec](./customTrackers_V0.md). Trackers that were made using the previous format will work fine on the current version.

> There are some examples in [the example folder](./examples/) of the repository.

## Using a custom tracker

If you are trying to use a custom tracker and already have the file for it, you can use it by following these steps:

1.  Go to the options screen
2.  Scroll down to the Custom Tracker Manager
3.  Press the `+` button below the table
4.  Upload the file under "Add Custom Tracker"

You will be notified if it loaded correctly or not. If it did not load correctly the app may tell you why. If it did correctly, the tracker will be added to the list of available tracker options and set to be used for the defined game.

## Making a custom tracker

I recommend using the app to help generate a template for you, this template will:

- Assign a random UUID to your tracker
- Get all the required fields in the manifest ready
- Have a list of all locations (location tracker only), possibly grouped nicely

### Getting a template

Start by opening the app and connecting to the game you wish to generate a template for.

1.  Go to the options screen
2.  Scroll down to the Custom Tracker Manager
3.  Press the `+` button below the table

You now have 3 options for generating a template.

1. Location Group:
    - This gets a location tracker generated using the game's defined location groups. These are specified by the world developers for that game. This is the default location tracker.
2. Item Group:
    - This gets an item tracker generated using the game's defined item groups. These are specified by the world developers for that game. This is the default item tracker.
3. Name Analysis:
    - This provides a way to group locations by name and is helpful in the event there are no location groups defined.
    - There is an explanation of how to use this in the app using the help button at the bottom of the add tracker screen.

Once you have your template, you can edit it as much as you like. The [specification](#custom-tracker-specification) is defined below. You can load your custom tracker to see if it produces any error messages. Most errors should tell you what is going on.

Note that as of right now, if you upload a tracker with the same UUID and Version number as one that is currently in use, you may need to reload the app to see any changes.

Feel free to ask for help if needed on the GitHub discussions page of this repository or on the archipelago Discord in this tracker's thread (Archipelago Checklist Tracker) in the future-game-design forum (in the custom section).

# Custom Tracker Specification

This covers the format for version 2 Location Trackers and version 1 Item trackers. For version 1 Location trackers please see [the v1 documentation](./customTrackers_V0.md)

> Note that comments (anything after `//`) are not a part of the file format and must not be present in `json` files.

## Manifest Format:

Here is the basic structure of the manifest within a tracker file.

```json
{
    "manifest": {
        "uuid": "00000000-0000-0000-0000-000000000000", // a unique id for your tracker
        "name": "A fitting name",
        "version": "0.0.0", // A version for your tracker
        "description": "An optional field, not currently used",
        "type": "must be 'location_tracker' or 'item_tracker'"
        // Type specific information...
    }
    // Type specific information...
}
```

## Location Tracker Format

### Manifest

```json
{
    "manifest": {
        "uuid": "00000000-0000-0000-0000-000000000000", // a unique id for your tracker
        "name": "A fitting name for a location tracker",
        "version": "0.0.0", // A version for your tracker
        "description": "An optional field, not currently used",
        "type": "location_tracker",
        "formatVersion": 1, // Must be 1 for now
        "game": "Game name according to ap", // Must match what you put in the game field for an ap yaml
        "locationTrackerType": "dropdown" // The only supported type at this time
    },
    "themes": {}, // see theme format below
    "sections": {}, // see section format below
    "groups": {} // Now optional, see groups format below
}
```

### Themes

Themes are a way to change the look of a section up. Currently though you can only change the color of the line that appears to the left of a section.

Note that a `"default"` theme is defined, but can be over written with your own default.

```json
{
    "manifest": {}, // see the manifest section above
    "themes": {
        "<theme name>": {
            "color": "<any web supported color>"
        },
        // real example
        "fire": {
            "color": "orange"
        }
    }
}
```

### Sections

Sections are placed in the document as so:

```json
{
    "manifest": {}, // see the manifest section above
    "sections": {
        "a unique name for the section": {
            "title": "An optional title to use",
            "locations": ["An optional list of location names"],
            "groups": "An optional group name or list of group names to pull locations from",
            "children": [
                "An optional list of section names to include as children or a dictionary of section defs"
            ],
            "theme": "an optional theme name to apply, will use 'default' if not defined"
        },
        // realistic examples
        "crystal caverns": {
            "title": "Crystal Caverns",
            "locations": [
                "Mine chest 1",
                "Mine chest 2",
                "Item beneath crystal"
            ],
            "groups": "Crystal Bugs", // This wold refer to a group called "Crystal Bugs"
            "children": ["crystal mines"], // this would refer to another section called "crystal mines"
            "theme": "crystal"
        },
        "fire caverns": {
            "title": "Fire Caverns",
            "groups": ["fire cavern chests", "fire cavern drops"],
            "children": {
                // notice how this can be a section definition instead of an array of names
                "fire cavern boss": {
                    "title": "Boss",
                    "locations": ["Fire Cavern Boss drop"]
                }
            },
            "theme": "fire"
        }
    }
}
```

There **MUST** be a section with the name of `"root"`. The app will look for this section and use it as the initial dropdown.

### Groups

Groups are now an optional feature that can be used to easily have the same list of locations shared across multiple sections. They used to be required in the previous version of the format.

```json
{
    "manifest": {}, // see the manifest section above
    "groups": {
        "<group name>": {
            "locations": ["A list of location names"]
        },
        // realistic example
        "fire cavern chests": {
            "locations": [
                "Fire chest 1",
                "Fire chest 2",
                "Fire chest behind rock"
            ]
        }
    }
}
```

## Item Tracker Format

### Manifest

```json
{
    "manifest": {
        "uuid": "00000000-0000-0000-0000-000000000000", // a unique id for your tracker
        "name": "A fitting name for an item tracker",
        "version": "0.0.0", // A version for your tracker
        "description": "An optional field, not currently used in the app",
        "type": "item_tracker",
        "formatVersion": 2, // Must be 2 for now
        "game": "Game name according to ap", // Must match exactly what you put in the game field for archipelago yaml files
        "itemTrackerType": "group" // The only supported type at this time
    },
    "groups": {} // see group format below
}
```

### Groups

These groups will collect items defined in them into their own collection on the inventory tracker.
These groups can be enabled/disabled by the user of the tracker.

```json
{
    "manifest": {}, // see manifest format above
    "groups": {
        // there are 2 main formats for a group
        "a name for a group (format 1)": {
            "name": "An optional display name, will use the group name if not given",
            "items": [
                "A list of item names (strings) or ids (numbers) of the items"
            ] // note that item id's are not well tested at this time
        },
        "A name for another group (format 2)": [
            "A list of item",
            "names (strings)",
            "or ids (numbers) of the items"
        ],
        // realistic examples using either format
        "fire weapons": {
            "name": "Fire Weapons",
            "items": ["Fire Axe", "Fire Sword", "Fire Bow"]
        },
        "Ice Weapons": ["Ice Axe", "Ice Sword", "Ice Bow"]
    }
}
```
