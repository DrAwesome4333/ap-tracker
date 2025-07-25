# Custom Tracker Files

The tracker supports loading of external files to define how the checks are organized. There are a few ways to get some starting templates from the app, but any fine tuning will have to be done by editing `.json` files by hand (see Getting a template section). This document hopes to explain the expected format and will refer to this example [Ori_BF_custom_example.json](./examples/Ori_BF_custom_example-old.json).

> Note there is a [new custom tracker format](./customTrackers.md) that is recommended. If you need to update a tracker using this format, you can upload the tracker and then redownload it and it will be automatically updated for you. The formats are very similar in concept.

## Using a custom Tracker

To use a custom tracker you need to:

1. Open settings and scroll down to the `Custom Tracker Manager` section
2. Push the `+` button to open a window where you can upload your tracker file
3. After uploading the tracker file, a drop down for the associated game should pop up in the `Tracker Picker` section
4. Use that dropdown to select the tracker you want to use for that game
5. Now when you connect to a game, that tracker will be loaded

## Getting a template

After connecting to an Archipelago slot, the app will allow you to generate and export some templates you can use to customize your custom tracker.

To find this, go to the options screen and press the `+` button, on the pop up window on the right there will be the option to download the location group template (this is the same template used by the default tracker), or use the Name Analyzer to build one for you. The help button describes how this analysis is performed and what the options might do. This is a first implementation and there are plans to improve the process in the future. After you have gotten a template you think you can work with, it will allow you to save or download the template from that page.

You can also download any tracker you have saved previously from the options page directly.

## General structure

The json file must have the following structure:

```json
{
    "game": "<game title>",
    "customTrackerVersion": 1,
    "id": "<some unique string>(optional)",
    "name": "<some name to display when used>",
    "groupData": {},
    "sectionData": {}
}
```

minimal example with `groupData` and `sectionData` left out:

```json
{
    "game": "Ori and the Blind Forest",
    "customTrackerVersion": 1,
    "id": "example_oribf",
    "name": "Ori Example",
    "groupData": {},
    "sectionData": {}
}
```

### game

This value must match what Archipelago says the game name is, this is the same name that is used in the `game` field of an Archipelago yaml.

### customTrackerVersion

For now, keep this as 1, anything else and you will get an error

### id [optional]

This should be a unique string id that identifies the custom tracker. If you upload 2 trackers with the same id, 1 will overwrite the other.
If you do not add one, one will be automatically generated when uploading.

### name

This name will be used when it is displayed in the tracker manager and tracker selector dropdowns. Keep it short and to the point.

### groupData

This object contains entries about how checks are grouped together. A group is an unbreakable portion of checks. These groups will be referenced by the categories we will define later. Groups take the following structure:

```json
    "groupData":{
        "<group key>":{
            "checks":["<checkName1>", "<checkName2>"]
        }
    }
```

Example:

```json
    "groupData":{
        "Map": {
            "checks": [
                "BlackrootMap",
                "ForlornMap",
                "GladesMap",
                "GumoHideoutMap",
                "HollowGroveMap",
                "HoruMap",
                "SorrowMap",
                "SwampMap",
                "ValleyMap"
            ]
        }
    }
```

See [Ori_BF_custom_example.json](./examples/Ori_BF_custom_example-old.json) for how these are placed in the `groupData` object.

Each check name must match exactly the name that Archipelago assigns it or it will not show up.

### sectionData

This object defines the overall structure of the list. The general structure of this object is:

```json
"sectionData":{
    "categories":{},
    "options":{},
    "themes":{
        "default": {
            "color": "#000000"
        },
        "forest" : {
            "color": "#228B22"
        },
    }
}
```

Here is a better description of each of those properties

#### categories

This object contains an entry for every section/category in the list. There must be at least 1 category with a key of `root`. `root` is used as the top most category.

A category takes the following format:

```json
"categories"{
    "<category key>" : {
        "title": "<A fitting title>",
        "groupKey": "<see below for how this field works>",
        "theme": "<optional theme key>",
        "children" : ["<child category key>", "<child category key>"]
    }
}
```

Shortened examples:

```json
     "categories": {
            "root": {
                "title": "Total",
                "groupKey": null,
                "theme": "default",
                "children": [
                    "Blackroot",
                    "Forlorn",
                    "Ginso",
                    "Glades",
                    "Grotto",
                    "Grove",
                    "Horu",
                    "Misty",
                    "...",
                ]
            }
     }
```

```json
     "categories": {
            "Horu": {
                "title": "Horu",
                "theme": "fire",
                "children": [
                    "HoruLevels"
                ],
                "groupKey": "Horu"
            },
            "ProgressiveMap": {
                "title": "ProgressiveMap",
                "theme": "default",
                "children": [],
                "groupKey": "ProgressiveMap"
            }
     }
```

##### title

This is what is displayed in the tracker dropdown for that section

##### groupKey

This defines which group(s) this section contains directly. Anything listed here will be put directly into that section, regardless of if any child sections also have that group and will show up.
This can take 1 of 3 forms:

- `null`: this means there are no groups in this section
- `"<group key>"`: this will include all checks from the group with that key specified in `groupData`
- `["<group key1>", "<group key2>"]`: this will include all checks from all groups listed with the specified keys from `groupData`

##### theme [optional]

This defines which theme to use as defined in the `themes` portion of the `sectionData`. If left undefined, it will use the `default` theme

##### children

This defines a list of keys to other categories to have as children of this category.

#### options

Leave this as `{}` for now, it likely will be dropped at some future point in time.

#### themes

A theme helps give the tracker some more variance in the appearance of sections. At the moment, this only affects the color of of the dashed line displayed on the side of sections.

General structure:

```json
 "themes": {
            "<theme key>": {
                "color": "<a web color>"
            },
    }
```

example:

```json
 "themes": {
            "default": {
                "color": "#000000"
            },
            "forest" : {
                "color": "#228B22"
            },
            "water": {
                "color": "#8CFFDB"
            },
            "fire": {
                "color": "#E25822"
            },
            "rock": {
                "color": "#D2B48C"
            }
        }
```

note that a theme named `default` will always be defined even if you do not specify one.

## Debugging

There is not much verification in place yet (I plan to improve it in the future), so here are some possible issues you may encounter when uploading a custom tracker:

### Missing groups/category sections:

When you upload the tracker to the app, it will verify that all groups and sections are used and reachable. If it finds anything off, it will let you know with a validation warning.

### Missing checks

When you connect to an AP game with a custom tracker, the app will check if there are any checks on the server that are not listed in your tracker. If it finds any, they will show up in a warning notification (click to view the list of missing checks).

### There is no list rendered or there are missing sections

Sections are set up to automatically hide themselves if they find they have no checks for a given game. Double check that these sections have checks in the slot you are testing it on and you have set the correct game name for your tracker.

### App crashes when using a custom tracker

Use the developer tools to help you pin point the reason for the crash. If it mentions something about not being able to find `root`, double check you have defined a `root` category. Otherwise report the crash on GitHub or to me in Discord and I can take a look.

### Other common issues will get a write up here

I can't predict all the ways that you will find errors, report them as you come across them and I will build up some help documentation here.
