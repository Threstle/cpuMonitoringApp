import React, {useEffect, useRef, useState} from "react";
import {CpuLoadHelper, IAlert, IConfig, ISnapshot} from "../helpers/CpuLoadHelper";
import CpuLoadGraph from "../components/cpuLoadGraph/CpuLoadGraph";

interface IProps {}

const componentName = "AppSinglePage";

/**
 * @name HomePage
 */
function AppSinglePage (props: IProps) {

    // get root ref
    const rootRef = useRef<HTMLDivElement>(null);

    // DATAS STATES
    const [snapshots, setSnapshots] = useState<ISnapshot[]>([]);
    const [cpuAlerts, setCpuAlerts] = useState<IAlert[]>([]);
    const [timelineBounds, setTimelineBounds] = useState<number[]>([Date.now()-600000,Date.now()]);
    const [alertTrigger, setAlertTrigger] = useState<string>("");

    const [config,setConfig] = useState<IConfig>(null);
    // -------------------–-------------------–-------------------–--------------- REGISTER PAGE

    /**
     * Fetch config
     */
    useEffect(()=>{
        CpuLoadHelper.instance.fetchConfig((config:IConfig)=>{
            setConfig(config);
            refreshCpuHistory();
        },()=>{})
    },[]);

    /**
     * Fetch datas every 10 secondes
     */
    const refreshCpuHistory = ()=>{

        CpuLoadHelper.instance.fetchCpuData((snapshots:ISnapshot[],alerts:IAlert[],timelineBounds:number[],cpuAlertString)=>{
            setSnapshots(snapshots);
            setCpuAlerts(alerts);
            setTimelineBounds(timelineBounds);
            setAlertTrigger(cpuAlertString);
        },()=>{})

        setTimeout(refreshCpuHistory,10000);
    }


    // -------------------–-------------------–-------------------–--------------- RENDER

    return <div className={componentName} ref={rootRef}>
        {
            config &&
            <CpuLoadGraph
                snapshots={snapshots}
                cpuAlerts={cpuAlerts}
                timelineBounds={timelineBounds}
                alertTrigger={alertTrigger}
                size={{w:1000,h:500,margin:{left:75,bottom:75}}}
                config={config}/>
        }
    </div>;
};

export default AppSinglePage;
