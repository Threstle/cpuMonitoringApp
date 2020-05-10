import React, {ChangeEvent, Fragment, useEffect, useRef, useState} from 'react';
import {IAlert, IConfig,ISnapshot} from "../../helpers/CpuLoadHelper";
import SvgGraph from "../svgGraph/SvgGraph";
import './CpuLoadGraph.less';
import SwitchButton from "../switchButton/SwitchButton";
import TimeHelper from "../../helpers/TimeHelper";
import AlertBox from "../alertBox/AlertBox";

interface IProps {
  classNames?: string[];
  // snapshot history over a period of 10mn
  snapshots:ISnapshot[];
  // alert history over a period of 10mn
  cpuAlerts:IAlert[];
  // size of the graph
  size:any;
  // timestamps of the first and last snapshot [first,last]
  timelineBounds:number[];
  // string containing either heavyload/recovery or nothing. Used to trigger an alert (by changing document.title and playing a sound (if authorized).
  alertTrigger:string;
  config:IConfig;
}

const componentName = "CpuLoadGraph";

/**
 * @name CpuLoadGraph
 */
function CpuLoadGraph (props: IProps) {

  const rootRef = useRef(null);
  const recoveryAudioRef = useRef<HTMLAudioElement>(null);
  const heavyloadAudioRef = useRef<HTMLAudioElement>(null);

  const [selectedAlert, setSelectedAlert] = useState<IAlert>();
  const [maxLoad, setMaxLoad] = useState<number>(2);
  const [minLoad, setMinLoad] = useState<number>(0);
  const [highestLoad, setHighestLoad] = useState<ISnapshot>();
  const [lowestLoad, setLowestLoad] = useState<ISnapshot>();

  const [colorBlindMode, setColorBlindMode] = useState<boolean>(false);
  const [soundAlertOn, setSoundAlertOn] = useState<boolean>(false);



  // --------------------------------------------------------------------------- PREPARE

    useEffect(()=>{

        setHighestLoad(Math.max.apply(Math, props.snapshots.map(function(snapshot) { return snapshot.load; })));
        setLowestLoad(Math.min.apply(Math, props.snapshots.map(function(snapshot) { return snapshot.load; })));

    },[props.snapshots])

    /**
     * If alertTrigger is updated, read it and trigger the appropriated alert
     */
    useEffect(()=>{

        if(props.alertTrigger == "heavyload")
        {
            beginAlert("(!) Heavy load");
            if(soundAlertOn)heavyloadAudioRef.current.play();

        }
        if(props.alertTrigger == "recovery"){
            beginAlert("(!) Recovered");
            if(soundAlertOn)recoveryAudioRef.current.play();
        }

    },[props.alertTrigger]);

  // --------------------------------------------------------------------------- UTILS

    /**
     * Launch alert
     * @param text to update document.title with
     */
    const beginAlert = (pTitle:string,pCounter=5)=>{
        let oldTitle = document.title;
        updateAlert(pCounter,oldTitle,pTitle);

    }

    /**
     * Update alert
     * @param text to update document.title with
     */
    const updateAlert = (pCounter:number,pOriginalTitle:string,pTitle:string)=>{
        document.title = pOriginalTitle

        if(pCounter>0)
        {
            setTimeout(()=>{
                document.title = pTitle
                setTimeout(() =>updateAlert(pCounter-1,pOriginalTitle,pTitle),500);
            },500)
        }
        else
        {
            document.title = pOriginalTitle;
        }
    }

    // --------------------------------------------------------------------------- HANDLERS

    const onMinLoadChange = (e:any)=>{
        let newMin = parseFloat(e.target.value);
        if(newMin<=maxLoad) setMinLoad( parseFloat(e.target.value));
    }

    const onMaxLoadChange = (e:any)=>{
        let newMax = parseFloat(e.target.value);
        if(newMax>=minLoad) setMaxLoad( parseFloat(e.target.value));
    }


    // --------------------------------------------------------------------------- RENDER
    return <div className={componentName} ref={rootRef}>

        <SvgGraph
            modifiers={[colorBlindMode?"colorblind":""]}
            snapshots={props.snapshots}
            cpuAlerts={props.cpuAlerts}
            maxLoad={maxLoad}
            minLoad={minLoad}
            size={props.size}
            config={props.config}
            timelineBounds={props.timelineBounds}
            selectedAlert={selectedAlert}

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
            <div className={`${componentName}_cpuLoadSetting`}>
                <input
                    className={`${componentName}_cpuLoadSettingInput`}
                    type="number"
                    id="maxCpuLoadRange"
                    name="maxCpuLoadRange"
                    min={0}
                    step={0.5}
                    value={maxLoad}
                    onChange={onMaxLoadChange}
                />
                <label
                    htmlFor={"cpuLoadRange"}
                    className={`${componentName}_cpuLoadSettingLabel`}
                >
                    Max CPU Load
                </label>
            </div>
            <div className={`${componentName}_cpuLoadSetting`}>
                <input
                    className={`${componentName}_cpuLoadSettingInput`}
                    type="number"
                    id="minCpuLoadRange"
                    name="minCpuLoadRange"
                    min={0}
                    step={0.5}
                    value={minLoad}
                    onChange={onMinLoadChange}
                />
                <label
                    htmlFor={"cpuLoadRange"}
                    className={`${componentName}_cpuLoadSettingLabel`}
                >
                    Min CPU Load
                </label>
            </div>
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
                        props.cpuAlerts &&
                        <Fragment>
                            <p>{`Number of alerts from ${TimeHelper.instance.timestampToDate(props.timelineBounds[0])} to ${TimeHelper.instance.timestampToDate(props.timelineBounds[1])} : ${props.cpuAlerts.length}`}</p>
                            <div className={`${componentName}_alertList`}>
                            {
                                props.cpuAlerts.map((alertElement,index)=>{
                                    return <AlertBox
                                        key={index}
                                        modifiers={[colorBlindMode?"-colorblind":""]}
                                        onClick={()=>setSelectedAlert(alertElement)}
                                        isSelected={selectedAlert == alertElement}
                                        cpuAlert={alertElement}
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
