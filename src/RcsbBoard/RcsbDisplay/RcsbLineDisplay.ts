import {RcsbAbstractDisplay} from "./RcsbAbstractDisplay";
import {pointer, ContainerElement} from "d3-selection";
import {
    MoveLineInterface,
    PlotLineInterface,
    RcsbD3LineManager
} from "../RcsbD3/RcsbD3DisplayManager/RcsbD3LineManager";
import {line, Line, curveStep, curveCardinal, curveBasis, curveLinear} from "d3-shape";
import {largestTriangleOneBucket} from "@d3fc/d3fc-sample";
import {InterpolationTypes} from "../../RcsbFv/RcsbFvConfig/RcsbFvDefaultConfigValues";
import {RcsbFvTrackData, RcsbFvTrackDataElementInterface} from "../../RcsbDataManager/RcsbDataManager";
import {RcsbD3ScaleFactory, RcsbScaleInterface} from "../RcsbD3/RcsbD3ScaleFactory";
import {LocationViewInterface} from "../RcsbBoard";

export class RcsbLineDisplay extends RcsbAbstractDisplay {

    private _yDomain: [number, number];
    protected yScale: RcsbScaleInterface = RcsbD3ScaleFactory.getLinearScale();
    protected maxPoints: number = 1000;
    protected innerData: Array<RcsbFvTrackDataElementInterface|null> = new Array<RcsbFvTrackDataElementInterface|null>();
    protected readonly SUFFIX_ID: string = "line_";

    protected definedScale: boolean = false;
    protected line:Line<RcsbFvTrackDataElementInterface> = line<RcsbFvTrackDataElementInterface>().curve(curveStep);
    private linePoints: RcsbFvTrackDataElementInterface[];

    protected hoverCallback: (event:MouseEvent)=>void = (event:MouseEvent)=>{
        const svgNode:ContainerElement | null  = this.g.node();
        if(svgNode != null) {
            const x = pointer(event, svgNode)[0];
            const index = Math.round(this.xScale.invert(x));
            if (this.innerData[index] != null) {
                this.elementEnterSubject.next({
                    element: this.innerData[index] as RcsbFvTrackDataElementInterface,
                    event: event
                });
            } else {
                this.elementLeaveSubject.next({
                    element: {begin: 0},
                    event: event
                });
            }
        }
    };

    protected clickCallback = (event: MouseEvent)=>{
        const svgNode:ContainerElement | null  = this.g.node();
        if(svgNode != null) {
            const x = pointer(event, svgNode)[0];
            const position = Math.round(this.xScale.invert(x));
            const region: RcsbFvTrackDataElementInterface = {begin: position, end: position};
            this.getBoardHighlight()(region, event.shiftKey ? 'add' : 'set', 'select', false);
            this.elementClickSubject.next({element:region, event});
        }
    };

    setInterpolationType(type: string): void{
        if(type === InterpolationTypes.CARDINAL)
            this.line = line<RcsbFvTrackDataElementInterface>().curve(curveCardinal);
        else if(type === InterpolationTypes.STEP)
            this.line = line<RcsbFvTrackDataElementInterface>().curve(curveStep);
        else if(type === InterpolationTypes.BASIS)
            this.line = line<RcsbFvTrackDataElementInterface>().curve(curveBasis);
        else if(type === InterpolationTypes.LINEAR)
            this.line = line<RcsbFvTrackDataElementInterface>().curve(curveLinear);
    }

    yDomain(domain: [number,number]):void {
        this._yDomain = domain;
    }

    setScale(): void{
        if(typeof this.height() === "number" && this._yDomain.length == 2 && typeof this._yDomain[0] === "number" && typeof this._yDomain[1] === "number") {
            this.yScale
                .domain(this._yDomain)
                .range([this.height()-3,3]);
            this.definedScale = true;
        }else{
            throw "FATAL ERROR: d3 scale unknown format";
        }
    }

    protected setLine(): void{
        this.line
            .x((d:RcsbFvTrackDataElementInterface) => {
                return this.xScale(d.begin) ?? 0;
            })
            .y((d:RcsbFvTrackDataElementInterface) => {
                return this.yScale(d.value as number) ?? 0;
            });
    }

    protected updateLine(): void{
        this.line.x((d: RcsbFvTrackDataElementInterface) => {
            return this.xScale(d.begin) ?? 0;
        });
    }

    _update(where: LocationViewInterface, compKey?: string):void {
        this.geoPlot(this.data().filter((s: RcsbFvTrackDataElementInterface, i: number) => {
            if (s.end == null) {
                return (s.begin >= where.from && s.begin <= where.to);
            } else {
                return !(s.begin > where.to || s.end < where.from);
            }
        }));
    }

    protected geoPlot(data:RcsbFvTrackData): void {
        if(!this.definedScale) {
            this.setScale();
            this.setLine();
        }
        this.linePoints = this.downSampling(data);
        const config: PlotLineInterface = {
            points: this.linePoints,
            line: this.line,
            color: this._displayColor as string,
            trackG: this.g,
            id:this.SUFFIX_ID+"0"
        };
        RcsbD3LineManager.plot(config);
    }

    move(): void{
        this.updateLine();
        const config: MoveLineInterface = {
            points: this.linePoints,
            line: this.line,
            trackG: this.g,
            id: this.SUFFIX_ID+"0"
        };
        RcsbD3LineManager.move(config);
        this.setDataUpdated(false);
    }

    protected downSampling(points: RcsbFvTrackDataElementInterface[]):RcsbFvTrackDataElementInterface[] {
        let out:RcsbFvTrackDataElementInterface[] = [];
        const tmp:RcsbFvTrackDataElementInterface[] = [];
        const domain: {min:number;max:number;} = {min:Number.MAX_SAFE_INTEGER,max:Number.MIN_SAFE_INTEGER};
        points.forEach(p=>{
            if(p.begin<domain.min)domain.min = p.begin-0.5;
            if(p.begin>domain.max)domain.max = p.begin+0.5;
        });
        domain.min = Math.max(domain.min,this.xScale.domain()[0]);
        domain.max = Math.min(domain.max,this.xScale.domain()[1]);
        const thr = this.maxPoints;
        for(let n = Math.ceil(domain.min);n<domain.max; n++){
            tmp[n] = {begin:n,value:0};
        }
        points.forEach((p) => {
            if(p.begin>domain.min && p.begin<domain.max) {
                tmp[p.begin] = p;
            }
        });
        const filterPoints = tmp.filter(p=>(p.begin>domain.min && p.begin<domain.max));
        filterPoints.forEach((p,n)=>{
            if(!(out[out.length-1]?.value == p.value && p.value == filterPoints[n+1]?.value))
                out.push(p);
            this.innerData[p.begin]=p;
        });
        out.unshift({begin:domain.min,value:0});
        out.unshift({begin:this.xScale.domain()[0],value:0});
        out.push({begin:domain.max,value:0});
        out.push({begin:this.xScale.domain()[1],value:0});
        if(out.length>thr){
            const bucketSize = out.length/thr ;
            const sampler = largestTriangleOneBucket();
            sampler.bucketSize(bucketSize);
            sampler.x((d:RcsbFvTrackDataElementInterface)=>{return d.begin});
            sampler.y((d:RcsbFvTrackDataElementInterface)=>{return d.value});
            out = sampler(out);
        }
        return out;
    }
}