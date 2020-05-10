import React from 'react';
import './AlertBox.less';
import {IAlert} from "../../helpers/CpuLoadHelper";
import TimeHelper from "../../helpers/TimeHelper";
interface IProps {
  modifiers?: string[]
  onClick?: ()=>void;
  isSelected?: boolean;
  cpuAlert:IAlert;
}

const componentName = "AlertBox";

/**
 * @name AlertBox
 */
function AlertBox (props: IProps) {

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
          {`Went into heavy load at ${TimeHelper.instance.timestampToDate(props.cpuAlert.heavyload.start)}`}
          <span className={`${componentName}_background ${componentName}_background-heavyload`}/>
      </p>
      {
          props.cpuAlert.recovery &&
          <p
            className={`${componentName}_recovery`}
          >
              {`Recovered from ${TimeHelper.instance.timestampToDate(props.cpuAlert.recovery.start)} to ${TimeHelper.instance.timestampToDate(props.cpuAlert.recovery.end)}`}
              <span className={`${componentName}_background ${componentName}_background-recovery`}/>
          </p>
      }
  </div>
}

export default AlertBox
