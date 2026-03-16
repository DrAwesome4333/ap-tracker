import { createContext } from "react";
import { TagManager } from "../services/tags/tagManager";
import { OptionManager } from "../services/options/optionManager";
import TextClientManager from "../services/textClientManager";
import { TrackerManager } from "../services/tracker/TrackerManager";
import { CustomTrackerRepository } from "../services/tracker/customTrackerRepository";
import GenericTrackerRepository from "../services/tracker/generic/genericTrackerRepository";
import { LocationTagger } from "../services/tags/LocationTagger";
import HintTagger from "../services/tags/HintTagger";
import HintManager from "../services/HintManager";
import APConnector from "../services/connector/APConnector";

const ServiceContext: React.Context<{
    connector?: APConnector;
    tagManager?: TagManager;
    optionManager?: OptionManager;
    trackerManager?: TrackerManager;
    textClientManager?: TextClientManager;
    customTrackerRepository?: CustomTrackerRepository;
    genericTrackerRepository?: GenericTrackerRepository;
    locationTagger?: LocationTagger;
    hintTagger?: HintTagger;
    hintManager?: HintManager;
}> = createContext({});

export default ServiceContext;
