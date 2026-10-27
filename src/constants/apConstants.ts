export enum HintStatus {
    unspecified = 0,
    noPriority = 10,
    avoid = 20,
    priority = 30,
    found = 40,
}

export enum ItemClassification {
    progression = 0b1,
    useful = 0b10,
    trap = 0b100,
    none = 0,
}

export enum ClientStatus {
    unknown = 0,
    connected = 5,
    ready = 10,
    playing = 20,
    goal = 30,
}

export enum PermissionMode {
    disabled = 0b000,
    enabled = 0b001,
    goal = 0b010,
    auto = 0b110,
    autoEnabled = 0b111,
}

export type RemainingMode = Exclude<
    PermissionMode,
    PermissionMode.auto | PermissionMode.autoEnabled
>;
export type CollectMode = PermissionMode;
export type ReleaseMode = PermissionMode;

export const PermissionDescription: Record<PermissionMode, string> = {
    [PermissionMode.disabled]: "Disabled",
    [PermissionMode.enabled]: "Allowed",
    [PermissionMode.goal]: "Allowed after goal",
    [PermissionMode.auto]: "Automatic after goal",
    [PermissionMode.autoEnabled]: "Allowed, Automatic after goal",
};
