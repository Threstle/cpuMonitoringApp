export interface ISnapshot
{
    timestamp:number;
    load:number;
}

export interface IPeriod
{
    start:number;
    end:number;
}

export interface IIncident {
    heavyload:IPeriod,
    recovery?:IPeriod;
}

export interface IConfig {
    bufferTime:number,
    heavyload_threshold:number,
    heavyload_duration:number,
    recovery_duration:number,
    timeline_length:number
}


export class CpuLoadHelper {

    protected _config:IConfig = null;

    protected static __instance: CpuLoadHelper;

    /**
     * Singleton instance
     */
    static get instance(): CpuLoadHelper {
        if (this.__instance == null)
            CpuLoadHelper.__instance = new CpuLoadHelper();

        return CpuLoadHelper.__instance;
    }

    // --------------------------------------------------------------------------- SET MODEL

    // --------------------------------------------------------------------------- COMMUNICATION API


    public getConfig()
    {
        return this._config;
    }

    //FIXME: add error handling
    public fetchCpuData (pCallback:(Snapshots:ISnapshot[],
                                    Incidents:IIncident[],
                                    timelineBounds:number[],
                                    cpuAlert:string)=>void,pErrorCallback:()=>void){
        fetch(
            `http://localhost:8080/load.json`
        )
            .then(response => {
                return response.json();
            })
            .then(response => {
                console.log(response);
                pCallback(response.snapshots,response.incidents,response.timelineBounds,response.cpuAlert);
            })
            .catch(() => {
                pErrorCallback();
            });
    }

    public fetchConfig(pCallback:(pData:any)=>void,pErrorCallback:()=>void){
        fetch(
            `http://localhost:8080/config.json`
        )
            .then(response => {
                return response.json();
            })
            .then(response => {

                pCallback(response);
            })
            .catch(() => {
                pErrorCallback();

            });
    }


    // --------------------------------------------------------------------------- UTILS

    //FIXME
    public isSamePeriod(pPeriodA:IPeriod,pPeriodB:IPeriod)
    {
        return pPeriodA.start <= pPeriodB?.start && pPeriodA.end >= pPeriodB?.end
    }


}
