import React, {Fragment, useEffect, useRef, useState} from 'react';
import {IConfig, IIncident, IPeriod, ISnapshot} from "../../helpers/CpuLoadHelper";
import SvgGraph from "../svgGraph/SvgGraph";
import './CpuLoadGraph.less';
import SwitchButton from "../switchButton/SwitchButton";
import {usePrevious} from "../../hooks/usePrevious";
import {TimeHelper} from "../../helpers/TimeHelper";
import IncidentBox from "../incidentBox/IncidentBox";
interface IProps {
  classNames?: string[]
  snapshots:ISnapshot[];
  incidents:IIncident[];
  size:any;
  timelineBounds:number[]
  cpuAlert:string;
  config:IConfig;
}

interface IEvent
{
    type:EEventType,
    timestamp:number
}

enum EEventType
{
    HEAVYLOAD_START,
    RECOVERY_START,
        RECOVERY_END
}

enum EPeriodType
{
    HEAVYLOAD,
    RECOVERY
}

enum ELogsDisplayType
{
    EVENTS,
    PERIODS
}

//FIXME
const text = {
    events:[
        "CPU is now on heavy load",
        "CPU is starting recovery",
        "CPU has recovered from heavy load",
    ],
    logsDisplayType:[
        "See event logs",
        "See incidents logs"
    ],
    period:[
        "Heavy load",
        "Recovery"
    ]

}

const componentName = "CpuLoadGraph";

/**
 * @name CpuLoadGraph
 */
function CpuLoadGraph (props: IProps) {

  const rootRef = useRef(null);
  const recoveryAudioRef = useRef<HTMLAudioElement>(null);
  const heavyloadAudioRef = useRef<HTMLAudioElement>(null);

  const [selectedIncident, setSelectedIncident] = useState<IIncident>();
  const [selectedLogsDisplayType, setSelectedLogsDisplayType] = useState<ELogsDisplayType>(ELogsDisplayType.EVENTS);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ISnapshot>();
  const [highestLoad, setHighestLoad] = useState<ISnapshot>();
  const [lowestLoad, setLowestLoad] = useState<ISnapshot>();

  const [colorBlindMode, setColorBlindMode] = useState<boolean>(false);
  const [soundAlertOn, setSoundAlertOn] = useState<boolean>(false);

  const prevCount:IIncident[] = usePrevious(props.incidents);



  // --------------------------------------------------------------------------- PREPARE

    useEffect(()=>{

        setHighestLoad(Math.max.apply(Math, props.snapshots.map(function(snapshot) { ;return snapshot.load; })));
        setLowestLoad(Math.min.apply(Math, props.snapshots.map(function(snapshot) { ;return snapshot.load; })));

    },[props.snapshots])

    useEffect(()=>{

        console.log(heavyloadAudioRef.current);
        if(props.cpuAlert == "heavyload")
        {
            beginAlert("(!) Heavy load");
            if(soundAlertOn)heavyloadAudioRef.current.play();

        }
        if(props.cpuAlert == "recovery"){
            beginAlert("(!) Recovered");
            if(soundAlertOn)recoveryAudioRef.current.play();
        }

    },[props.cpuAlert])

    useEffect(()=>{
    },[colorBlindMode])

  // --------------------------------------------------------------------------- UTILS

    const beginAlert = (pTitle:string)=>{
        let oldTitle = document.title;
        proceedAlert(5,oldTitle,pTitle);

    }

    const proceedAlert = (pCounter:number,pOriginalTitle:string,pTitle:string)=>{
        document.title = pOriginalTitle

        if(pCounter>0)
        {
            setTimeout(()=>{
                document.title = pTitle
                setTimeout(() =>proceedAlert(pCounter-1,pOriginalTitle,pTitle),500);
            },500)
        }
        else
        {
            document.title = pOriginalTitle;
        }
    }

    const getEventsFromIncidents = (pIncidents:IIncident[])=>{
        let events:IEvent[]= [];

        pIncidents.forEach((incident)=>{
            events.push({type:EEventType.HEAVYLOAD_START,timestamp:incident.heavyload.start});
            if(incident.recovery)
            {
                events.push({type:EEventType.RECOVERY_START,timestamp:incident.recovery.start});
                events.push({type:EEventType.RECOVERY_END,timestamp:incident.recovery.end});
            }
        });

        return events;
    }

    const getSnapshotFromTimestamp = (pTimestamp:number)=>{
        return props.snapshots.filter((snapshot)=>{
            return snapshot.timestamp == pTimestamp
        })[0]
    }

    const getPeriodsFromIncidents = (pIncidents:IIncident[])=>{
        let periods:any = [];

        pIncidents.forEach((incident)=>{
            periods.push({type:EPeriodType.HEAVYLOAD,period:incident.heavyload});
            if(incident.recovery)
            {
                periods.push({type:EPeriodType.RECOVERY,period:incident.recovery});
            }
        });

        return periods;
    }



    // --------------------------------------------------------------------------- RENDER
    return <div className={componentName} ref={rootRef}>

        <SvgGraph
            modifiers={[colorBlindMode?"colorblind":""]}
            snapshots={props.snapshots}
            incidents={props.incidents}
            size={props.size}
            config={props.config}
            timelineBounds={props.timelineBounds}
            selectedIncident={selectedIncident}
            selectedSnapshot={selectedSnapshot}
            onHoverGraph={(snapshot:ISnapshot)=>{
                setSelectedSnapshot(snapshot)
            }}
        />
        <h2 className={`${componentName}_settingsTitle`}>Settings</h2>
        <div className={`${componentName}_settings`}>
            <SwitchButton
                label={"Color blind mode"}
                onChange={(state)=>{
                    setColorBlindMode(state)
                }}
            />
            <SwitchButton
                label={"Sound alerts"}
                onChange={(state)=>{
                    setSoundAlertOn(state);
                }}
            />
        </div>
        {
            props.snapshots && props.snapshots.length > 0 &&

                <div className={`${componentName}_mainBoard`}>
                    <h1
                        className={`${componentName}_currentAverage`}
                    >{`Current average CPU load :`} <span className={`${componentName}_currentAverageValue`}>{props.snapshots[props.snapshots.length-1].load}</span></h1>

                    {
                        highestLoad &&
                        <p>{`Highest load was ${highestLoad}`}</p>
                    }
                    {
                        lowestLoad &&
                        <p>{`Lowest load was ${lowestLoad}`}</p>
                    }
                    {
                        props.incidents &&
                        <Fragment>
                            <p>{`Number of incident from ${TimeHelper.instance.timestampToDate(props.timelineBounds[0])} to ${TimeHelper.instance.timestampToDate(props.timelineBounds[1])} : ${props.incidents.length}`}</p>
                            <div className={`${componentName}_incidentList`}>
                            {
                                props.incidents.map((incident,index)=>{
                                    return <IncidentBox
                                        key={index}
                                        modifiers={[colorBlindMode?"-colorblind":""]}
                                        onClick={()=>setSelectedIncident(incident)}
                                        isSelected={selectedIncident == incident}
                                        incident={incident}
                                    />
                                })
                            }
                            </div>
                        </Fragment>

                    }

                </div>
        }

        <audio ref={heavyloadAudioRef} src={"dist/heavyload.mp3"}/>
        <audio ref={recoveryAudioRef} src={"dist/recovery.mp3"}/>



    </div>
}

export default CpuLoadGraph
