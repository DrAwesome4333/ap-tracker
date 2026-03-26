import { createContext } from "react";
import { OptionManager } from "../services/options/optionManager";
import TextClientManager from "../services/textClientManager";
import { TrackerManager } from "../services/tracker/TrackerManager";
import { CustomTrackerRepository } from "../services/tracker/customTrackerRepository";
import APConnector from "../services/connector/APConnector";

const ServiceContext: React.Context<{
    connector?: APConnector;
    optionManager?: OptionManager;
    trackerManager?: TrackerManager;
    textClientManager?: TextClientManager;
    customTrackerRepository?: CustomTrackerRepository;
}> = createContext({});

export default ServiceContext;
