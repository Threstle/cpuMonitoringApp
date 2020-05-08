import { line, curveCatmullRom,curveBasis} from "d3-shape";
import { scaleTime, scaleLinear } from "d3-scale";
import { axisBottom, axisLeft, axisTop } from 'd3-axis';
import { select, selectAll } from "d3-selection";
import { extent, max, min, bisector } from "d3-array";

const d3 = {
    line: line,
    curveCatmullRom: curveCatmullRom,
    curveBasis: curveBasis,
    scaleTime: scaleTime,
    scaleLinear: scaleLinear,
    axisTop: axisTop,
    axisBottom: axisBottom,
    axisLeft: axisLeft,
    select: select,
    selectAll: selectAll,
    extent: extent,
    bisector: bisector,
    min: min,
    max: max,

}

export default d3;