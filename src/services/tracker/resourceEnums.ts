enum LocationTrackerType {
    dropdown = "dropdown",
}

enum ItemTrackerType {
    group = "group",
}

enum ResourceType {
    locationTracker = "location_tracker",
    itemTracker = "item_tracker",
}

enum ResourceLocationType {
    local = 1,
    remote = 2,
    builtIn = 3,
}

export {LocationTrackerType, ItemTrackerType, ResourceType, ResourceLocationType}