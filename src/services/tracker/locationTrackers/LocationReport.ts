import { CounterMode } from "../../tags/tagManager";
import { LocationManager } from "../../locations/locationManager";

class LocationReport {
    existing: Set<string> = new Set();
    checked: Set<string> = new Set();
    ignored: Set<string> = new Set();
    tagCounts: Map<string, Set<string>> = new Map();
    tagTotals: Map<string, Set<string>> = new Map();

    /**
     * Adds report values from the provided report to this report;
     * @param report The report to read from
     */
    addReport = (report: LocationReport) => {
        this.existing = this.existing.union(report.existing);
        this.checked = this.checked.union(report.checked);
        this.ignored = this.ignored.union(report.ignored);
        report.tagCounts.forEach((counter, counterName) => {
            const updatedCounter: Set<string> = counter.union(
                this.tagCounts.get(counterName) ?? new Set()
            );
            this.tagCounts.set(counterName, updatedCounter);
        });
        report.tagTotals.forEach((counter, counterName) => {
            const updatedCounter: Set<string> = counter.union(
                this.tagTotals.get(counterName) ?? new Set()
            );
            this.tagTotals.set(counterName, updatedCounter);
        });
        return this;
    };

    /**
     * Adds the status of a check to the report
     * @param locationManager
     * @param locationName
     * @returns
     */
    addLocation = (locationManager: LocationManager, locationName: string) => {
        const status = locationManager.getLocationStatus(locationName);
        if (!status.exists) {
            return status;
        }
        // add to correct lists
        this.existing.add(locationName);
        if (status.checked) {
            this.checked.add(locationName);
        } else if (status.ignored) {
            this.ignored.add(locationName);
        }

        // add to tag counters
        status.tags.forEach((tag) => {
            const counter = tag.counter;
            if (!counter) {
                return;
            }
            const counterTotal = this.tagTotals.get(counter.id) ?? new Set();
            const counterCount = this.tagCounts.get(counter.id) ?? new Set();
            counterTotal.add(locationName);

            switch (counter.countMode) {
                case CounterMode.countChecked: {
                    if (status.checked || status.ignored) {
                        counterCount.add(locationName);
                    }
                    break;
                }

                case CounterMode.countUnchecked: {
                    if (!status.checked && !status.ignored) {
                        counterCount.add(locationName);
                    }
                    break;
                }
                default: {
                    counterCount.add(locationName);
                    break;
                }
            }
            this.tagTotals.set(counter.id, counterTotal);
            this.tagCounts.set(counter.id, counterCount);
        });
        return status;
    };
}

export default LocationReport;
