import React, {Component, Fragment, useEffect, useRef, useState} from 'react';
import {CpuLoadHelper, IConfig, IIncident, IPeriod, ISnapshot} from "../../helpers/CpuLoadHelper";
import d3 from '../../d3importer';
import {gsap,Quad} from 'gsap';

import './SvgGraph.less';
import {TimeHelper} from "../../helpers/TimeHelper";
import SwitchButton from "../switchButton/SwitchButton";

interface IProps {
  modifiers?: string[];
  snapshots: ISnapshot[];
  size: any;
  config: IConfig;
  timelineBounds:number[];
  incidents: IIncident[];
  selectedSnapshot:ISnapshot
  selectedIncident: IIncident;
  onHoverGraph:(snapshot:ISnapshot)=>void;
}

const componentName = "SvgGraph";

/**
 * @name SvgGraph
 */

function SvgGraph (props: IProps) {

    const graphRef = useRef(null);
    const cpuLineRef = useRef<SVGPathElement>(null);
    const pointerRef = useRef(null);
    const tooltipRef = useRef(null);

    const [focusSnapshot, setFocusSnapshot] = useState<ISnapshot>(null);

    const [displayHeavyLoadPeriods, setDisplayHeavyLoadPeriods] = useState<boolean>(true);
    const [displayRecoveryPeriods, setDisplayRecoveryPeriods] = useState<boolean>(true);
    const [displaySnapshots, setDisplaySnapshots] = useState<boolean>(true);
    const [displayCpuLine, setDisplayCpuLine] = useState<boolean>(true);
    const [displayThreshold, setDisplayThreshold] = useState<boolean>(true);

    const [peaks, setPeaks] = useState<ISnapshot[]>([]);



  // --------------------------------------------------------------------------- PREPARE

    useEffect(()=>{
        const svg = d3.select(graphRef.current);
        if(!props.snapshots || props.snapshots.length == 0)return;

        d3.selectAll(`.${componentName}_axis`).remove();

        const y = d3.scaleLinear()
            .domain([0, 2])
            .range([ props.size.h, 0 ]);

        svg.append("g").attr('class',`${componentName}_axis ${componentName}_axis-y`)
            .call(d3.axisLeft(y));

        const x = d3.scaleTime()
            .domain([props.timelineBounds[0],props.timelineBounds[1]])
            .range([ 0, props.size.w ]);

        svg.append("g").attr('class',`${componentName}_axis ${componentName}_axis-x`)
            .attr("transform", "translate(0," + (props.size.h+15) + ")")
            .call(d3.axisBottom(x));

        setPeaks(props.snapshots.filter((snapshot,index)=>isPeak(props.snapshots,index,2,1)));

        props.snapshots.forEach((snapshot)=>{

        })


    },[props.snapshots])

    useEffect(()=>{
        setFocusSnapshot(props.selectedSnapshot)
    },[props.selectedSnapshot])

    useEffect(()=>{
        if(focusSnapshot)animateFocus();
    },[focusSnapshot])

    // --------------------------------------------------------------------------- ANIMATION

    const animateFocus = ()=>{

        let graphOffsets = graphRef.current.getBoundingClientRect();

        gsap.to(pointerRef.current,{
            x:getXFromTimestamp(props.snapshots,focusSnapshot.timestamp),
            ease:Quad.easeInOut,
            duration:0.3
        })

        gsap.to(tooltipRef.current,{
            x:getXFromTimestamp(props.snapshots,focusSnapshot.timestamp)-tooltipRef.current.getBoundingClientRect().width,
            y:getYFromLoad(props.snapshots,focusSnapshot.load)-tooltipRef.current.getBoundingClientRect().height,
            ease:Quad.easeInOut,
            duration:0.3
        })
    }

    // --------------------------------------------------------------------------- UTILS

    const getYFromLoad = (pData:ISnapshot[],pValue:number)=>{
        return d3.scaleLinear().domain([0, 2]).range([ props.size.h, 0 ])(pValue);
    }

    const getXFromTimestamp = (pData:ISnapshot[],pValue:number)=>{
        return d3.scaleTime().domain([props.timelineBounds[0],props.timelineBounds[1]]).range([ 0, props.size.w ])(pValue);
    }

    const isPeak = (pSnapshots:ISnapshot[],pIndex:number,pPrecision:number,pLimit:number)=>{

        pSnapshots = pSnapshots.slice();


        if(!pSnapshots[pIndex-pPrecision] || !pSnapshots[pIndex+pPrecision])return false;


        let peak = (pSnapshots[pIndex-1]?.load > pSnapshots[pIndex]?.load &&  pSnapshots[pIndex+1]?.load > pSnapshots[pIndex]?.load)
                    || ((pSnapshots[pIndex-1]?.load < pSnapshots[pIndex]?.load &&  pSnapshots[pIndex+1]?.load < pSnapshots[pIndex]?.load));

        if(peak)
        {

            let sample = pSnapshots.slice(pIndex-pPrecision,pIndex+pPrecision);

            let m = 0;
            sample.forEach((snapshot)=>{m+=snapshot.load});
            m/=sample.length;

            let vTemp=sample.map((snapshot)=>{return (snapshot.load-m)*(snapshot.load-m)});

            let v = vTemp.reduce((a,b)=>{return a+b})/sample.length;

            return pSnapshots[pIndex].load > m+(v*pLimit) || pSnapshots[pIndex].load > m-(v*pLimit);
        }
        else
        {
            return false;
        }

    }


    // --------------------------------------------------------------------------- HANDLERS

    const onMouseMove = (e:any)=>{

        let graphOffsets = graphRef.current.getBoundingClientRect();

        if(!props.snapshots)return;

        let x0:any = d3.scaleTime().domain([props.timelineBounds[0],props.timelineBounds[1]]).range([ 0, props.size.w ]).invert(e.clientX - graphOffsets.left);
        let i = d3.bisector(function(d:ISnapshot) {return d.timestamp; }).left(props.snapshots,x0,1);
        let d0 = props.snapshots[i - 1];
        let d1 = props.snapshots[i];

        if(d0 && d1)
        {
            let d = x0 - d0.timestamp > d1.timestamp - x0 ? d1 : d0;

            if(peaks.indexOf(d)!=-1)setFocusSnapshot(d);
        }


    }

    // --------------------------------------------------------------------------- RENDER

  return <div
      className={`SvgGraph ${props.modifiers.map(()=>{return `SvgGraph-${props.modifiers}`})}`}>
      <svg
          onMouseMove={onMouseMove}
      viewBox={`${-props.size.margin.left/2} ${-props.size.margin.bottom/2} ${props.size.w+props.size.margin.left} ${props.size.h+props.size.margin.bottom}`}
      ref={graphRef}>
          <defs>
              <rect id="rect" width="100%" height="100%" fill="none" stroke="blue" />
              <clipPath id="clip">
                  <use xlinkHref="#rect"/>
              </clipPath>
          </defs>
          <g
            clipPath={"url(#clip)"}
          >
      {
          props.snapshots &&
          <Fragment>
              {
                  displayThreshold &&
                  <line
                      stroke={"black"}
                      strokeDasharray={"5 5"}
                      opacity={0.3}
                      x1={0}
                      x2={props.size.w}
                      y1={getYFromLoad(props.snapshots,props.config.heavyload_threshold)}
                      y2={getYFromLoad(props.snapshots,props.config.heavyload_threshold)}
                  />
              }
              {
                  props.incidents &&
                  <g
                  >
                      {
                          props.incidents.map((incident)=>{

                              return <Fragment>
                                  {
                                      displayHeavyLoadPeriods &&
                                      <rect
                                          className={`${componentName}_heavyLoadPeriod`}
                                          x={getXFromTimestamp(props.snapshots,incident.heavyload.start)}
                                          y={0}
                                          opacity={(incident == props.selectedIncident)?0.5:0.2}
                                          width={getXFromTimestamp(props.snapshots,incident.heavyload.end) - getXFromTimestamp(props.snapshots,incident.heavyload.start)}
                                          height={props.size.h}
                                      />
                                  }

                                  {
                                      displayRecoveryPeriods && incident.recovery &&
                                      <rect
                                          className={`${componentName}_recoveryPeriod`}
                                          x={getXFromTimestamp(props.snapshots,incident.recovery.start)}
                                          y={0}
                                          opacity={(incident == props.selectedIncident)?0.5:0.2}
                                          width={getXFromTimestamp(props.snapshots,incident.recovery.end) - getXFromTimestamp(props.snapshots,incident.recovery.start)}
                                          height={props.size.h}
                                      />
                                  }

                              </Fragment>

                          })
                      }
                  </g>
              }
              {
                  displayCpuLine &&
                  <path

                      ref={cpuLineRef}
                      className={`${componentName}_cpuLine`}
                      strokeWidth={4}
                      d={
                          d3.line()(props.snapshots.map((snap)=>{
                              return [getXFromTimestamp(props.snapshots,snap.timestamp),getYFromLoad(props.snapshots,snap.load)];
                          }))
                      }
                  />
              }
              {
                  displaySnapshots &&
                  props.snapshots.map((snapshot,index)=>{
                      {
                          return (peaks.indexOf(snapshot)!=-1)? <circle
                              key={index}
                              className={`${componentName}_snapshot ${focusSnapshot == snapshot?componentName+'_snapshot-focus':""}`}
                              cx={getXFromTimestamp(props.snapshots,snapshot.timestamp)}
                              cy={getYFromLoad(props.snapshots,snapshot.load)}
                              r={4}
                              onClick={()=>{setFocusSnapshot(snapshot)}}

                          />:null;
                      }
                  })
              }
              {
                  focusSnapshot &&
                  <g
                      ref={pointerRef}
                  >
                      <line
                        x1={0}
                        x2={0}
                        y1={getYFromLoad(props.snapshots,focusSnapshot.load)}
                        y2={props.size.h}
                        strokeDasharray={"5 5"}
                        stroke={"#cccccc"}
                      />

                  </g>

              }
          </Fragment>
      }
          </g>
  </svg>
      {

      focusSnapshot &&
      <div
          ref={tooltipRef}
          className={`${componentName}_tooltip`}>
          <p
              className={`${componentName}_tooltipHour`}
          >{TimeHelper.instance.timestampToDate(focusSnapshot.timestamp)}</p>
          <p
              className={`${componentName}_tooltipLoad`}
          >{focusSnapshot.load}</p>
      </div>

      }
      <h3
          className={`${componentName}_axisName ${componentName}_axisName-cpu`}
      >CPU load</h3>
      <h3 className={`${componentName}_axisName ${componentName}_axisName-timeline`}>HH:MM</h3>
      {/*TODO:refacto*/}
      <h2 className={`${componentName}_displayButtonsTitle`}>Display / hide graph elements</h2>
      <div className={`${componentName}_displayButtons`}>
          <SwitchButton
            label={"Path CPU"}
            onChange={(pSwitchValue)=> setDisplayCpuLine(pSwitchValue)}
            startState={true}
          />
          <span className={`${componentName}_buttonSeparator`}/>
          <SwitchButton
              label={"Snapshots"}
              onChange={(pSwitchValue)=> setDisplaySnapshots(pSwitchValue)}
              startState={true}
          />
          <span className={`${componentName}_buttonSeparator`}/>
          <SwitchButton
              label={"Heavy load periods"}
              onChange={(pSwitchValue)=> setDisplayHeavyLoadPeriods(pSwitchValue)}
              startState={true}
          />
          <span className={`${componentName}_buttonSeparator`}/>
          <SwitchButton
              label={"Recovery periods"}
              onChange={(pSwitchValue)=> setDisplayRecoveryPeriods(pSwitchValue)}
              startState={true}
          />
          <span className={`${componentName}_buttonSeparator`}/>
          <SwitchButton
              label={"Heavy load threshold"}
              onChange={(pSwitchValue)=> setDisplayThreshold(pSwitchValue)}
              startState={true}
          />

      </div>

    </div>
}

export default SvgGraph
