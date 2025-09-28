import { LocationManager } from "../../locations/locationManager";

class LocationReport {
    existing: Set<string> = new Set();
    checked: Set<string> = new Set();
    ignored: Set<string> = new Set();

    /**
     * Adds report values from the provided report to this report;
     * @param report The report to read from
     */
    addReport = (report: LocationReport) => {
        this.existing = this.existing.union(report.existing);
        this.checked = this.checked.union(report.checked);
        this.ignored = this.ignored.union(report.ignored);
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

        return status;
    };
}

export default LocationReport;
