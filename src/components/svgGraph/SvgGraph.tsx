import React, {Fragment, useEffect, useRef, useState} from 'react';
import {IAlert, IConfig, ISnapshot} from "../../helpers/CpuLoadHelper";
import d3 from '../../d3importer';
import {gsap,Quad} from 'gsap';

import './SvgGraph.less';
import TimeHelper from "../../helpers/TimeHelper";
import SwitchButton from "../switchButton/SwitchButton";

interface IProps {
  modifiers?: string[];
  // snapshot history over a period of 10mn
  snapshots: ISnapshot[];
  // size of the graph
  size: any;
  maxLoad:number;
  minLoad:number;
  config: IConfig;
  timelineBounds:number[];
  // alert history over a period of 10mn
  cpuAlerts: IAlert[];
  selectedAlert: IAlert;
}

const componentName = "SvgGraph";

/**
 * @name SvgGraph
 */

function SvgGraph (props: IProps) {

    // ------- REFS
    const graphRef = useRef(null);
    const cpuLineRef = useRef<SVGPathElement>(null);
    const pointerRef = useRef(null);
    const tooltipRef = useRef(null);

    // ------- STATES
    const [focusSnapshot, setFocusSnapshot] = useState<ISnapshot>(null);

    const [displayHeavyLoadPeriods, setDisplayHeavyLoadPeriods] = useState<boolean>(true);
    const [displayRecoveryPeriods, setDisplayRecoveryPeriods] = useState<boolean>(true);
    const [displaySnapshots, setDisplaySnapshots] = useState<boolean>(true);
    const [displayCpuLine, setDisplayCpuLine] = useState<boolean>(true);
    const [displayThreshold, setDisplayThreshold] = useState<boolean>(true);

    // Selected snapshots to display on graph
    const [peaks, setPeaks] = useState<ISnapshot[]>([]);



  // --------------------------------------------------------------------------- PREPARE

    useEffect(()=>{

        if(!props.snapshots || props.snapshots.length == 0)return;


        // Get a list of key snapshots to display on graph
        setPeaks(props.snapshots.filter((snapshot,index)=>isPeak(props.snapshots,index,)));


    },[props.snapshots]);

    useEffect(()=>{

        const svg = d3.select(graphRef.current);

        // Add axises on component mount
        d3.selectAll(`.${componentName}_axis`).remove();

        svg.append("g").attr('class',`${componentName}_axis ${componentName}_axis-y`)
            .call(d3.axisLeft(getYFromLoad));

        svg.append("g").attr('class',`${componentName}_axis ${componentName}_axis-x`)
            .attr("transform", "translate(0," + (props.size.h+15) + ")")
            .call(d3.axisBottom(getXFromTimestamp));
    },[props.maxLoad,props.minLoad])

    useEffect(()=>{
        if(focusSnapshot)animateFocus();
    },[focusSnapshot]);

    // --------------------------------------------------------------------------- ANIMATION

    /**
     * Animate tooltip when selected snapshot is chosen
     **/
    const animateFocus = ()=>{

        gsap.to(pointerRef.current,{
            x:getXFromTimestamp(focusSnapshot.timestamp),
            ease:Quad.easeInOut,
            duration:0.3
        })

        gsap.to(tooltipRef.current,{
            x:getXFromTimestamp(focusSnapshot.timestamp)-tooltipRef.current.getBoundingClientRect().width,
            y:getYFromLoad(focusSnapshot.load)-tooltipRef.current.getBoundingClientRect().height,
            ease:Quad.easeInOut,
            duration:0.3
        })
    }

    // --------------------------------------------------------------------------- UTILS

    const getYFromLoad = d3.scaleLinear().domain([props.minLoad, props.maxLoad]).range([ props.size.h, 0 ])

    const getXFromTimestamp = d3.scaleTime().domain([props.timelineBounds[0],props.timelineBounds[1]]).range([ 0, props.size.w ]);

    /**
     * Detect when cpuload changes direction
     * pSnapshots : snapshot array
     * pIndex : index in pSnapshots of the snapshot analyzed
     * */
    const isPeak = (pSnapshots:ISnapshot[],pIndex:number)=>{

        pSnapshots = pSnapshots.slice();

        if(!pSnapshots[pIndex-1] || !pSnapshots[pIndex+1])return false;

        // Detect if the snapshot is a peak
        let peak = (pSnapshots[pIndex-1]?.load > pSnapshots[pIndex]?.load &&  pSnapshots[pIndex+1]?.load > pSnapshots[pIndex]?.load)
                    || ((pSnapshots[pIndex-1]?.load < pSnapshots[pIndex]?.load &&  pSnapshots[pIndex+1]?.load < pSnapshots[pIndex]?.load));

        return peak;

    }


    // --------------------------------------------------------------------------- HANDLERS

    /**
     * Set selectedSnapshot to one of the peaks when user hovers over the graph
     **/
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
                      y1={getYFromLoad(props.config.heavyload_threshold)}
                      y2={getYFromLoad(props.config.heavyload_threshold)}
                  />
              }
              {
                  props.cpuAlerts &&
                  <g
                  >
                      {
                          props.cpuAlerts.map((cpuAlert,index)=>{

                              return <Fragment
                                  key={index}
                              >
                                  {
                                      displayHeavyLoadPeriods &&
                                      <rect

                                          className={`${componentName}_heavyLoadPeriod`}
                                          x={getXFromTimestamp(cpuAlert.heavyload.start)}
                                          y={0}
                                          opacity={(cpuAlert == props.selectedAlert)?0.5:0.2}
                                          width={getXFromTimestamp(cpuAlert.heavyload.end) - getXFromTimestamp(cpuAlert.heavyload.start)}
                                          height={props.size.h}
                                      />
                                  }

                                  {
                                      displayRecoveryPeriods && cpuAlert.recovery &&
                                      <rect
                                          className={`${componentName}_recoveryPeriod`}
                                          x={getXFromTimestamp(cpuAlert.recovery.start)}
                                          y={0}
                                          opacity={(cpuAlert == props.selectedAlert)?0.5:0.2}
                                          width={getXFromTimestamp(cpuAlert.recovery.end) - getXFromTimestamp(cpuAlert.recovery.start)}
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
                              return [getXFromTimestamp(snap.timestamp),getYFromLoad(snap.load)];
                          }))
                      }
                  />
              }
              {
                  displaySnapshots &&
                  props.snapshots.map((snapshot,index)=>{
                      {
                          return (1)? <circle
                              key={index}
                              className={`${componentName}_snapshot ${peaks.indexOf(snapshot)!=-1?`${componentName}_snapshot-peak`:""} ${focusSnapshot == snapshot?componentName+'_snapshot-focus':""}`}
                              cx={getXFromTimestamp(snapshot.timestamp)}
                              cy={getYFromLoad(snapshot.load)}
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
                        y1={getYFromLoad(focusSnapshot.load)}
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
