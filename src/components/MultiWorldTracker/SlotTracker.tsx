import {
    useCallback,
    useContext,
    useEffect,
    useEffectEvent,
    useMemo,
    useRef,
    useState,
} from "react";
import SlotContext, { SlotContextData } from "../../contexts/slotContext";
import { useCurrentGameTracker } from "../../hooks/trackerHooks";
import { GamePackageWrapper } from "../../services/gamepackage/GamePackageWrapper";
import HintManager from "../../services/HintManager";
import ItemRepository from "../../services/items/itemRepository";
import LocationRepository from "../../services/locations/locationRepository";
import { SavedSlotDetails } from "../../services/MultiInfo/MultiWorldService";
import HintTagger from "../../services/tags/HintTagger";
import { LocationTagger } from "../../services/tags/LocationTagger";
import { TagManager } from "../../services/tags/tagManager";
import { ResourceType } from "../../services/tracker/resourceEnums";
import WebHostSlotSource from "../../services/WebHostConnector/WebHostSlotSource";
import { LocationTracker } from "../../services/tracker/locationTrackers/locationTrackers";
import { ItemTracker } from "../../services/tracker/itemTrackers/itemTrackers";
import ServiceContext from "../../contexts/serviceContext";
import InventoryView from "../inventoryComponents/InventoryView";

const useSlotContext = (
    slot: SavedSlotDetails,
    webHostSource: WebHostSlotSource,
    gamePackages: Record<string, GamePackageWrapper>
) => {
    const serviceContext = useContext(ServiceContext);
    const optionManger = serviceContext.optionManager;
    const trackerManager = serviceContext.trackerManager;
    const game = slot.game;
    const initialized = useRef(false);
    const locationTrackerId = useCurrentGameTracker(
        game,
        trackerManager,
        ResourceType.locationTracker
    );
    const itemTrackerId = useCurrentGameTracker(
        game,
        trackerManager,
        ResourceType.itemTracker
    );

    const gamePackage = gamePackages[game];
    const [locationRepository] = useState(() => new LocationRepository());
    const [itemRepository] = useState(() => new ItemRepository());
    const [tagManager] = useState(() => new TagManager());
    const [hintTagger] = useState(() => new HintTagger(optionManger));
    const slotName = slot.slot_name;
    const slotNumber = slot.slot_number;
    const slotAlias = slot.slot_alias ?? "";
    const multiWorldId = slot.multi_save_id;
    // should be reset by key if needed
    const [locationTagger] = useState(
        () => new LocationTagger(slot.multi_save_id, slot.slot_number)
    );
    const [hintManager, setHintManger] = useState<HintManager>(null);

    if (!initialized.current) {
        initialized.current = true;
        setHintManger(new HintManager(hintTagger));
        tagManager.addSource(locationTagger);
        tagManager.addSource(hintTagger);
        tagManager.enableLocationEffects(locationRepository);

        itemRepository.addSource(webHostSource);
        locationRepository.addSource(webHostSource);
    }

    const [locationTracker, setLocationTracker] =
        useState<LocationTracker>(null);
    const [itemTracker, setItemTracker] = useState<ItemTracker>(null);

    const loadLocationTracker = useEffectEvent(() => {
        if (locationTrackerId && gamePackage) {
            trackerManager
                ?.loadTracker(locationTrackerId, gamePackage)
                .then((tracker: LocationTracker) => {
                    setLocationTracker(tracker);
                });
        } else {
            setLocationTracker(null);
        }
    });

    const loadItemTracker = useEffectEvent(() => {
        if (itemTrackerId && gamePackage) {
            trackerManager
                ?.loadTracker(itemTrackerId, gamePackage)
                .then((tracker: ItemTracker) => {
                    setItemTracker(tracker);
                });
        } else {
            setItemTracker(null);
        }
    });

    useEffect(() => {
        loadLocationTracker();
    }, [locationTrackerId, gamePackage]);

    useEffect(() => {
        loadItemTracker();
    }, [itemTrackerId, gamePackage]);

    const results = useMemo<SlotContextData>(
        () => ({
            game,
            slotName,
            slotAlias,
            slotNumber,
            multiWorldId,
            locationRepository,
            itemRepository,
            hintManager,
            tagManager,
            locationTagger,
            locationTracker,
            itemTracker,
            liveSlot: false,
        }),
        [
            game,
            slotName,
            slotAlias,
            slotNumber,
            multiWorldId,
            locationRepository,
            itemRepository,
            hintManager,
            tagManager,
            locationTagger,
            locationTracker,
            itemTracker,
        ]
    );

    return results;
};

type SlotTrackerParams = {
    slot: SavedSlotDetails;
    webHostSource: WebHostSlotSource;
    gamePackages: Record<string, GamePackageWrapper>;
};

const SlotTracker = ({
    slot,
    webHostSource,
    gamePackages,
}: SlotTrackerParams) => {
    const context = useSlotContext(slot, webHostSource, gamePackages);
    return (
        <SlotContext.Provider value={context}>
            <InventoryView title={`${slot.slot_alias ?? slot.slot_name}`} />
        </SlotContext.Provider>
    );
};

export default SlotTracker;
