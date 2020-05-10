const os = require('os');
// This module is required in order for ose.loadavg to work on windows
require('loadavg-windows');

const config = require('./config');

// The four state the server can be in
const EServerState = {
    // cpu load is under the threshold, no alert is ongoing
    IDLE: "IDLE",
    // cpu load is above the threshold, no alert is ongoing
    ABOVETHRESHOLD: "ABOVETHRESHOLD",
    // an alert is ongoing
    ONHEAVYLOAD: "ONHEAVYLOAD",
    // an alert is in the process of recovering
    RECOVERING: "RECOVERING"
}

const CpuWatcher = {

    // cpuLoad for the last 10mn
    snapshotHistory: [],
    // alerts for the last 10mn
    alertHistory: [],
    // ongoing alert
    currentAlert: null,

    serverState: EServerState.IDLE,

    cpuAlert: "",

    // timestamp values for an ongoing incident
    heavyloadStart: 0,
    recoveryStart: 0,

    // value of the last cpu load fetched.
    lastLoad: 0,

    /**
     * Update cpu infos
     */
    watch() {

        const timestamp = Date.now();

        // Get rid of data older than timeline_length
        this.cleanOldData(timestamp);

        let snapshot = {
            load: this.getCurrentAverageCpuLoad(),
            timestamp: timestamp
        };

        if (snapshot.load != this.lastLoad) {

            // Look for alerts
            let updateRes = this.updateAlerts(snapshot, this.alertHistory, this.serverState, this.heavyloadStart, this.recoveryStart, this.currentAlert);

            this.serverState = updateRes.serverState;
            this.alertHistory = updateRes.alertList;
            this.currentAlert = updateRes.currentAlert;
            this.heavyloadStart = updateRes.heavyloadStart;
            this.recoveryStart = updateRes.recoveryStart;
            this.cpuAlert = updateRes.cpuAlert;


            this.snapshotHistory.push(snapshot);
            this.lastLoad = snapshot.load
        }

        setTimeout(() => {
            this.watch();
        }, 100);
    },

    /**
     * determine if pTimestamp is older than timeline_length
     * @param pCurrentTimestamp : current time
     * @param pTimestamp : timestamp to test
     * @returns {boolean}
     */
    isOverTime(pCurrentTimestamp, pTimestamp) {
        return (pCurrentTimestamp - pTimestamp) >= config.cpuWatch.timeline_length;
    },

    /**
     * get current cpu load average, divided by the number of CPUs
     * @returns {number}
     */
    getCurrentAverageCpuLoad() {
        const cpus = os.cpus().length;
        return Number((os.loadavg()[0] / cpus).toPrecision(2));
    },

    /**
     * determine the state of the server, and the presence of an ongoing incident or not by using a finite-state machine.
     * @param pSnapshot : snapshot to process
     * @param pAlertList : List of past alerts
     * @param pState : state of the server
     * @param pHeavyloadStart : start timestamp of the heavyload period of an ongoing alert
     * @param pRecoveryStart : start timestamp of the recovery period of an ongoing alert
     * @param pCurrentAlert : ongoing alert
     * @returns {{currentAlert: *, serverState: *, heavyloadStart: *, alertList: *, recoveryStart: *, cpuAlert: *}}
     */
    updateAlerts(pSnapshot, pAlerts, pState, pHeavyloadStart, pRecoveryStart, pCurrentAlert) {

        const snapshotIsAboveThreshold = pSnapshot.load >= config.cpuWatch.heavyload_threshold;

        let serverState = pState;
        let alertList = pAlerts;
        let currentAlert = pCurrentAlert;
        let heavyloadStart = pHeavyloadStart;
        let recoveryStart = pRecoveryStart;
        let cpuAlert = "";

        if (snapshotIsAboveThreshold) {

            // If serverState is IDLE and load is above threshold serverState becomes ABOVETHRESHOLD
            if (pState === EServerState.IDLE) {
                serverState = EServerState.ABOVETHRESHOLD
                heavyloadStart = pSnapshot.timestamp;
            }

            // If serverState is ABOVETHRESHOLD and load has been above threshold for heavyload_duration or more serverState becomes ONHEAVYLOAD and an ongoing alert is created
            if (pState === EServerState.ABOVETHRESHOLD && pSnapshot.timestamp - pHeavyloadStart >= config.cpuWatch.heavyload_duration) {

                serverState = EServerState.ONHEAVYLOAD

                cpuAlert = "heavyload";

                currentAlert = {
                    heavyload: {
                        start: pHeavyloadStart,
                        end: pSnapshot.timestamp
                    }
                };
            }

            // If serverState is ONHEAVYLOAD and load is still above threshold the end of the current incident is updated.
            if (pState === EServerState.ONHEAVYLOAD) {
                pCurrentAlert.heavyload.end = pSnapshot.timestamp;
            }

            // If serverState is RECOVERING and load is above threshold serverState becomes ONHEAVYLOAD.
            if (pState === EServerState.RECOVERING) {
                serverState = EServerState.ONHEAVYLOAD;
            }

        } else {

            // If serverState is ABOVETHRESHOLD and load is below threshold serverState becomes IDLE.
            if (pState === EServerState.ABOVETHRESHOLD) {
                serverState = EServerState.IDLE
            }

            // If serverState is ONHEAVYLOAD and load is below threshold serverState becomes RECOVERING.
            if (pState === EServerState.ONHEAVYLOAD) {
                serverState = EServerState.RECOVERING;
                recoveryStart = pSnapshot.timestamp;
            }

            // If serverState is RECOVERING and load is still below threshold the end of the current alrty recovery is updated.
            if (pState === EServerState.RECOVERING) {
                pCurrentAlert.heavyload.end = pSnapshot.timestamp;
            }

            // If serverState is RECOVERING and load has been below threshold for recovery_duration or more serverState becomes IDLE, the current alert is over and pushed in alertHistory.
            if (pState === EServerState.RECOVERING && pSnapshot.timestamp - pRecoveryStart >= config.cpuWatch.recovery_duration) {
                serverState = EServerState.IDLE;
                pCurrentAlert.heavyload.end = pRecoveryStart;
                pCurrentAlert.recovery = {
                    start: pRecoveryStart,
                    end: pSnapshot.timestamp
                };

                cpuAlert = "recovery";

                alertList.push({
                    heavyload: pCurrentAlert.heavyload,
                    recovery: pCurrentAlert.recovery
                });

                currentAlert = null;
            }
        }

        return {
            serverState: serverState,
            alertList: alertList,
            currentAlert: currentAlert,
            heavyloadStart: heavyloadStart,
            recoveryStart: recoveryStart,
            cpuAlert: cpuAlert
        }
    },


    /**
     * Clean alerts and snapshots older than heavyload_duration
     * @param pTimestamp
     */
    cleanOldData(pTimestamp) {

        this.alertHistory = this.alertHistory.filter((incident) => {
            return !this.isOverTime(pTimestamp, incident.recovery.end)
        })

        if (this.snapshotHistory.length > 0) {
            if (this.isOverTime(pTimestamp, this.snapshotHistory[0].timestamp)) {
                this.snapshotHistory.shift()
            }
        }

    }

}

module.exports = CpuWatcher;