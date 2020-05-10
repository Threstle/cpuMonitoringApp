
export default class TimeHelper {

    protected static __instance: TimeHelper;

    /**
     * Singleton instance
     */
    static get instance(): TimeHelper {
        if (this.__instance == null)
            TimeHelper.__instance = new TimeHelper();

        return TimeHelper.__instance;
    }

    public timestampToDate = (pTimestamp:number)=>
    {
        const date = new Date(pTimestamp)
        return `${date.getHours()}:${date.getMinutes()}`;
    };
}
