import React, {useEffect, useRef, useState} from "react";
import {CpuLoadHelper, IConfig, IIncident, ISnapshot} from "../helpers/CpuLoadHelper";
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
    const [cpuLoadHistory, setCpuLoadHistory] = useState<ISnapshot[]>([]);
    const [cpuIncidentHistory, setCpuIncidentHistory] = useState<IIncident[]>([]);
    const [timelineBounds, setTimelineBounds] = useState<number[]>([Date.now()-600000,Date.now()]);
    const [cpuAlert, setCpuAlert] = useState<string>("");

    const [config,setConfig] = useState<IConfig>(null);
    // -------------------–-------------------–-------------------–--------------- REGISTER PAGE

    //FIXME: refacto

    useEffect(()=>{
        CpuLoadHelper.instance.fetchConfig((config:IConfig)=>{
            setConfig(config);
            refreshCpuHistory();
        },()=>{})
    },[]);

    const refreshCpuHistory = ()=>{

        CpuLoadHelper.instance.fetchCpuData((snapshots:ISnapshot[],incidents:IIncident[],timelineBounds:number[],cpuAlertString)=>{
            setCpuLoadHistory(snapshots);
            setCpuIncidentHistory(incidents);
            setTimelineBounds(timelineBounds);
            setCpuAlert(cpuAlertString);
        },()=>{})

        setTimeout(refreshCpuHistory,10000);
    }


    // -------------------–-------------------–-------------------–--------------- RENDER

    return <div className={componentName} ref={rootRef}>
        {
            config &&
            <CpuLoadGraph
                snapshots={cpuLoadHistory}
                incidents={cpuIncidentHistory}
                timelineBounds={timelineBounds}
                cpuAlert={cpuAlert}
                size={{w:1000,h:500,margin:{left:75,bottom:75}}}
                config={config}/>
        }
    </div>;
};

export default AppSinglePage;
