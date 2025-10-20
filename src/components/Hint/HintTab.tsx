import React, { useContext, useId, useState } from "react";
import PanelHeader from "../shared/PanelHeader";
import HintTable from "./HintTable";
import ServiceContext from "../../contexts/serviceContext";
import useOption from "../../hooks/optionHook";
import HintFilterModal from "./HintFilterModal";
import { PrimaryButton } from "../buttons";
import Icon from "../icons/icons";
import { HintFilter, optionScope } from "./HintOptionDef";
import { Input } from "../inputs";

const HintTab = () => {
    const services = useContext(ServiceContext);
    const filters: HintFilter = useOption(
        services.optionManager,
        "HintTabFilters",
        optionScope
    ) as HintFilter;
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchKey, setSearchKey] = useState("");
    const [searchFilterMode, setSearchFilterMode] = useState("location");
    const dropdownId = useId();

    return (
        <div
            style={{
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                display: "grid",
                gap: "0.25em",
                gridTemplateRows: "3em 1fr",
                overflow: "hidden",
                padding: "0.25em",
            }}
        >
            <PanelHeader title="Hints">
                <Input
                    type="search"
                    label="Search"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                />
                <label htmlFor={dropdownId}>Filter on:</label>
                <select
                    id={dropdownId}
                    value={searchFilterMode}
                    onChange={(e) => {
                        setSearchFilterMode(e.target.value);
                    }}
                >
                    <option value="location">Locations</option>
                    <option value="item">Items</option>
                </select>
                <PrimaryButton
                    $tiny
                    style={{ height: "20px" }}
                    onClick={() => setShowFilterModal(true)}
                >
                    <Icon fontSize="12pt" type="filter_alt" />
                </PrimaryButton>
            </PanelHeader>
            <HintTable
                filters={filters}
                searchKey={searchKey}
                searchFilterMode={searchFilterMode}
            />
            <HintFilterModal
                open={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />
        </div>
    );
};

export default HintTab;
