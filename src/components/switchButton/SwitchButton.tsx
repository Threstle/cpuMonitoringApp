import React, {useEffect, useState} from 'react';
import './SwitchButton.less';
interface IProps {
  modifiers?: string[]
  onClick?: ()=>void;
  label?:string;
  onChange?:(change:boolean)=>void;
  startState?:boolean;
}

const componentName = "SwitchButton";

/**
 * @name SwitchButton
 */
function SwitchButton (props: IProps) {
  // --------------------------------------------------------------------------- PREPARE

    const [isOn,setIsOn] = useState(props.startState || false);

    useEffect(()=>{
        props.onChange(isOn);
    },[isOn]);

  // --------------------------------------------------------------------------- RENDER

  return <div
      className={`${componentName} ${(isOn)?componentName+"-on":""}`}
      onClick={()=>setIsOn(!isOn)}
  >
      <div className={`${componentName}_container`}>
        <span className={`${componentName}_handle`}/>
      </div>
        <label>{props.label}</label>
  </div>
}

export default SwitchButton
