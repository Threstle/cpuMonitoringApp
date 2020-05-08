import React from 'react';
import './IncidentBox.less';
import {IIncident} from "../../helpers/CpuLoadHelper";
import {TimeHelper} from "../../helpers/TimeHelper";
interface IProps {
  modifiers?: string[]
  onClick?: ()=>void;
  isSelected?: boolean;
  incident:IIncident;
}

const componentName = "IncidentBox";

/**
 * @name IncidentBox
 */
function IncidentBox (props: IProps) {
  // --------------------------------------------------------------------------- PREPARE

  // --------------------------------------------------------------------------- RENDER

  return <div
      className={
          `${componentName} 
          ${(props.onClick)?componentName+"-clickable":""} 
          ${(props.isSelected)?componentName+"-selected":""} 
          ${props.modifiers.map(()=>{return `${componentName}${props.modifiers}`})}
          `}
      onClick={props.onClick}
  >
      <p className={`${componentName}_heavyload`}>
          {`Went into heavy load at ${TimeHelper.instance.timestampToDate(props.incident.heavyload.start)}`}
          <span className={`${componentName}_background ${componentName}_background-heavyload`}/>
      </p>
      {
          props.incident.recovery &&
          <p
            className={`${componentName}_recovery`}
          >
              {`Recovered from ${TimeHelper.instance.timestampToDate(props.incident.recovery.start)} to ${TimeHelper.instance.timestampToDate(props.incident.recovery.end)}`}
              <span className={`${componentName}_background ${componentName}_background-recovery`}/>
          </p>
      }
  </div>
}

export default IncidentBox
