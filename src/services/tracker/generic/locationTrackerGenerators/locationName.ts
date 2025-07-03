import { naturalSort } from "../../../../utility/comparisons";
import { randomUUID } from "../../../../utility/uuid";
import {
    ResourceType,
    ResourceLocationType,
    LocationTrackerType,
} from "../../resourceEnums";
class TrieNode {
    children: Map<string, TrieNode>;
    count: number;
    constructor() {
        this.children = new Map();
        this.count = 0;
    }
}

class TrieTree {
    #root: TrieNode;
    #nameOptions: NameTokenizationOptions;
    constructor(nameDecomposeOptions: NameTokenizationOptions) {
        this.#nameOptions = nameDecomposeOptions;
        this.#root = new TrieNode();
    }
    #remove_r = (node: TrieNode, tokens: string[]): number => {
        if (tokens.length === 0) {
            return node.count;
        }
        if (node.children.has(tokens[0])) {
            const removalCount = this.#remove_r(
                node.children.get(tokens[0]),
                tokens.slice(1)
            );
            node.count -= removalCount;
            if (
                tokens.length === 1 ||
                node.children.get(tokens[0]).count === 0
            ) {
                node.children.delete(tokens[0]);
            }
            return removalCount;
        }
        return 0;
    };
    remove = (prefix: string): boolean => {
        const removedCount = this.#remove_r(
            this.#root,
            tokenizeName(prefix, this.#nameOptions)
        );
        return removedCount > 0;
    };
    insert = (word: string) => {
        let currentNode = this.#root;
        const wordSegments = tokenizeName(word, this.#nameOptions);
        for (let i = 0; i < wordSegments.length; i++) {
            const segment = wordSegments[i];
            if (!currentNode.children.has(segment)) {
                currentNode.children.set(segment, new TrieNode());
            }
            currentNode = currentNode.children.get(segment);
            currentNode.count += 1;
        }
    };

    mostFrequentPrefix = (minTokenCount: number = 1) => {
        const result: { prefix: string; count: number }[] = [];
        const depthFirstSearch = (node: TrieNode, tokens: string[]) => {
            if (node.count > 1 && tokens.length >= minTokenCount) {
                result.push({
                    prefix: tokens.join(""),
                    count: node.count,
                });
            }
            for (const [token, child] of node.children.entries()) {
                const newPrefix = tokens.slice(0);
                newPrefix.push(token);
                depthFirstSearch(child, newPrefix);
            }
        };

        depthFirstSearch(this.#root, []);
        result.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return b.prefix.length - a.prefix.length;
        });
        return result[0];
    };
}

class GroupNode {
    ownChecks: Set<string>;
    children: Set<GroupNode> = new Set();
    name: string;
    constructor(name: string, checks: Iterable<string>) {
        this.ownChecks = new Set(checks);
        this.name = name;
    }

    addChild = (child: GroupNode) => {
        this.children.add(child);
        this.ownChecks = this.ownChecks.difference(child.getChecks());
    };

    getChecks = (): Set<string> => {
        let childrenChecks: Set<string> = new Set();
        this.children.forEach((child) => {
            childrenChecks = childrenChecks.union(child.getChecks());
        });
        return this.ownChecks.union(childrenChecks);
    };
}

const isUpperCase = (char: string) => {
    if (char.toLowerCase() === char.toUpperCase()) {
        return false;
    }
    return char.toUpperCase() === char;
};

const isLowerToUpper = (a: string, b: string) => {
    return (
        !isUpperCase(a) &&
        isUpperCase(b) &&
        /^[a-zA-Z]$/.test(a) &&
        /^[a-zA-Z]$/.test(b)
    );
};

type NameTokenizationOptions = {
    /** List of characters to segment/split on */
    splitCharacters?: string[];
    /** If true, names will be split on changes from lower to upper case */
    splitOnCase?: boolean;
    /** If true, names will be split into individual character tokens, ignoring other options */
    characterSplit?: boolean;
};

const tokenizeName = (
    name: string,
    tokenizationOptions: NameTokenizationOptions
): string[] => {
    const result: string[] = [];
    let currentToken = "";
    if (tokenizationOptions.characterSplit) {
        return name.split("");
    }
    for (let i = 0; i < name.length; i++) {
        if (
            tokenizationOptions.splitCharacters &&
            tokenizationOptions.splitCharacters.includes(name[i])
        ) {
            result.push(currentToken);
            result.push(name[i]);
            currentToken = "";
            continue;
        }
        if (
            tokenizationOptions.splitOnCase &&
            i - 1 >= 0 &&
            !tokenizationOptions.splitCharacters.includes(name[i - 1]) &&
            isLowerToUpper(name[i - 1], name[i])
        ) {
            result.push(currentToken);
            currentToken = "";
        }
        currentToken += name[i];
    }
    if (currentToken) {
        result.push(currentToken);
    }
    return result;
};

const generateGroups = (
    checks: Set<string>,
    nameTokenizationOptions: NameTokenizationOptions,
    minGroupSize: number,
    minTokenCount: number
): Map<string, Set<string>> => {
    const tree = new TrieTree(nameTokenizationOptions);
    checks = new Set(checks.values());
    checks.forEach((check) => tree.insert(check));
    const groups: Map<string, Set<string>> = new Map();
    let commonPrefix = tree.mostFrequentPrefix(minTokenCount);
    // console.log(commonPrefix);
    while (commonPrefix && commonPrefix.count >= minGroupSize) {
        const prefix = commonPrefix.prefix;
        groups.set(
            prefix,
            new Set(
                [...checks.values()].filter(
                    (checkName) => checkName.indexOf(prefix) === 0
                )
            )
        );
        checks = checks.difference(groups.get(prefix));
        tree.remove(prefix);
        commonPrefix = tree.mostFrequentPrefix(minTokenCount);
    }
    if (checks.size > 0) {
        groups.set("Unorganized", checks);
    }

    return groups;
};

const sectionName = (name: string) => {
    if (name === "root") {
        return name;
    }
    return `section_${name}`;
};

const generateSectionDef = (
    checks: Set<string>,
    nameTokenizationOptions: NameTokenizationOptions,
    requirementParams: {
        minGroupSize: number;
        maxDepth: number;
        minTokenCount: number;
    }
) => {
    const groupTreeRoot = new GroupNode("root", checks.values());
    const currentLevelGroups: Set<GroupNode> = new Set([groupTreeRoot]);
    const nextLevelGroups: Set<GroupNode> = new Set();
    for (let level = 0; level < requirementParams.maxDepth; level++) {
        nextLevelGroups.clear();
        currentLevelGroups.forEach((groupNode) => {
            let levelTokenCount = requirementParams.minTokenCount;
            if (groupNode.name !== "root") {
                levelTokenCount =
                    tokenizeName(groupNode.name, nameTokenizationOptions)
                        .length + 1;
            }
            const generatedGroups = generateGroups(
                groupNode.ownChecks,
                nameTokenizationOptions,
                requirementParams.minGroupSize,
                levelTokenCount
            );
            generatedGroups.forEach((checks, name) => {
                const child = new GroupNode(name, checks);
                if (name === "Unorganized" && groupNode.name === "root") {
                    groupNode.addChild(child);
                } else if (name !== "Unorganized") {
                    groupNode.addChild(child);
                    nextLevelGroups.add(child);
                }
            });
        });
        currentLevelGroups.clear();
        nextLevelGroups.forEach((group) => currentLevelGroups.add(group));
    }

    const trackerGroups: { [groupKey: string]: GroupData_V2 } = {};
    const sectionDef: CustomLocationTrackerDef_V2 = {
        manifest: {
            name: "Place holder name",
            uuid: randomUUID(),
            version: "0.0.0",
            description: "Auto generated tracker based on location names",
            resourceLocationType: ResourceLocationType.builtIn,
            type: ResourceType.locationTracker,
            locationTrackerType: LocationTrackerType.dropdown,
            game: null,
            compatibleDataPackages: [],
            formatVersion: 2,
        },
        sections: {},
        themes: {
            default: {
                color: "#888888",
            },
        },
    };
    // console.log(groups);
    const traverseTreeNode = (node: GroupNode) => {
        // create group entry
        let groupKey: string = null;
        if (node.ownChecks.size > 0) {
            groupKey = `group_${node.name}`;
            if (trackerGroups[groupKey]) {
                console.warn(`Duplicate name ${groupKey} detected`);
            }
            trackerGroups[groupKey] = {
                locations: [...node.ownChecks.values()],
            };
        }
        if (node.name === "root") {
            sectionDef.sections[`${node.name}`] = {
                theme: "default",
                title: "Total",
                groups: groupKey,
                children: [],
            };
        } else {
            sectionDef.sections[sectionName(node.name)] = {
                theme: "default",
                title: node.name.trim(),
                groups: groupKey,
                children: [],
            };
        }

        node.children.forEach((child) => {
            traverseTreeNode(child);
            (<string[]>(
                sectionDef.sections[sectionName(node.name)].children
            )).push(sectionName(child.name));
        });
        (<string[]>sectionDef.sections[sectionName(node.name)].children).sort(
            naturalSort
        );
    };
    traverseTreeNode(groupTreeRoot);
    sectionDef.sections["root"].title = "Total";
    return sectionDef;
};

const LocationNameCategoryGenerator = {
    generateSectionDef,
};

export default LocationNameCategoryGenerator;
export type { NameTokenizationOptions };
