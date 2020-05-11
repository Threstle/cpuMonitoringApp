const CpuWatcher = require('../CpuWatcher.js');
const config = require('../config.js');
var expect = require('chai').expect;

describe('#updateIncidents()', function() {

    context('if state is IDLE and snapshot load is >= heavyload_threshold', function() {
        it('state should now be ABOVETHRESHOLD', function() {
            expect(CpuWatcher.updateAlerts(
                {
                    timestamp:Date.now(),
                    load:config.cpuWatch.heavyload_threshold
                },
                [],
                "IDLE",
                0,
                0
                ).serverState).to.equal("ABOVETHRESHOLD")
        })

    })

    context('if state is ABOVETHRESHOLD, snapshot load is >= heavyload_threshold and heavyloadStart is older than heavyload_duration', function() {

        let snapshotTimestamp = Date.now();
        let heavyloadStart = snapshotTimestamp-config.cpuWatch.heavyload_duration;
        it('state should now be ONHEAVYLOAD', function() {
            expect(CpuWatcher.updateAlerts(
                {
                    timestamp:snapshotTimestamp,
                    load:config.cpuWatch.heavyload_threshold
                },
                [],
                "ABOVETHRESHOLD",
                heavyloadStart,
                0
            ).serverState).to.equal("ONHEAVYLOAD")
        })

    })

    context('if state is ONHEAVYLOAD and snapshot load is < heavyload_threshold', function() {

        it('state should now be RECOVERING', function() {
            expect(CpuWatcher.updateAlerts(
                {
                    timestamp:Date.now(),
                    load:config.cpuWatch.heavyload_threshold-0.1
                },
                [],
                "ONHEAVYLOAD",
                0,
                0
            ).serverState).to.equal("RECOVERING")
        })
    });


    context('if state is ONHEAVYLOAD, snapshot load is <= heavyload_threshold and heavyloadStart is older than heavyload_duration', function() {

        it('state should now be RECOVERED', function() {
            expect(CpuWatcher.updateAlerts(
                {
                    timestamp:Date.now(),
                    load:config.cpuWatch.heavyload_threshold-0.1
                },
                [],
                "ONHEAVYLOAD",
                0,
                0
            ).serverState).to.equal("RECOVERING")
        })
    });

    context('if state is RECOVERING, snapshot load is <= heavyload_threshold and recoveryStart is older than recovery_duration', function() {

        let res = CpuWatcher.updateAlerts(
            {
                timestamp:Date.now(),
                load:config.cpuWatch.heavyload_threshold-0.1
            },
            [],
            "RECOVERING",
            0,
            0,
            {
                heavyload:{start:0,end:0}
            },
        )

        it('state should now be IDLE, alertList.length should be 1 ans currentAlert should be null', function() {
            expect(res.serverState).to.equal("IDLE")
            expect(res.alertList.length).to.equal(1)
            expect(res.currentAlert).to.equal(null);
        })
    });
});