import * as React from "react";
import {RcsbFvTrack} from "../RcsbFvTrack/RcsbFvTrack";
import {RcsbFvDefaultConfigValues, RcsbFvDisplayTypes} from "../RcsbFvConfig/RcsbFvDefaultConfigValues";
import classes from "../RcsbFvStyles/RcsbFvRow.module.scss";
import {RcsbFvRowConfigInterface} from "../RcsbFvConfig/RcsbFvConfigInterface";
import {EventType, RcsbFvContextManager, RowReadyInterface} from "../RcsbFvContextManager/RcsbFvContextManager";
import {RcsbSelection} from "../../RcsbBoard/RcsbSelection";

import {asyncScheduler, Subscription} from 'rxjs';
import {RcsbScaleInterface} from "../../RcsbBoard/RcsbD3/RcsbD3ScaleFactory";

/**Board track  annotations cell React component interface*/
interface RcsbFvRowTrackInterface {
    readonly id: string;
    readonly rowTrackConfigData: RcsbFvRowConfigInterface;
    readonly contextManager: RcsbFvContextManager;
    readonly xScale: RcsbScaleInterface;
    readonly selection: RcsbSelection;
    readonly callbackRcsbFvRow: (height: number)=>void;
    readonly rowNumber: number;
    readonly firstRow: boolean;
    readonly lastRow: boolean;
    readonly addBorderBottom: boolean;
    readonly renderSchedule: "async"|"sync";
}

/**Board track  annotations cell React component style*/
interface RcsbFvRowTrackStyleInterface {
    width: number;
    height: number;
}

/**Board track  annotations cell React component state*/
interface RcsbFvRowTrackState {
    readonly rowTrackConfigData: RcsbFvRowConfigInterface;
    readonly rowTrackHeight: number;
    readonly mounted: boolean;
}

export class RcsbFvRowTrack extends React.Component <RcsbFvRowTrackInterface, RcsbFvRowTrackState> {

    /**Board track configuration object*/
    private readonly configData : RcsbFvRowConfigInterface;
    /**Track Protein Feature Viewer object*/
    private rcsbFvTrack : RcsbFvTrack;
    /**Feature Viewer builder Async task*/
    private asyncTask: Subscription | null = null;
    /**Subscription to events*/
    private subscription: Subscription;

    readonly state : RcsbFvRowTrackState = {
        rowTrackHeight:RcsbFvDefaultConfigValues.trackHeight + this.rowBorderHeight(),
        rowTrackConfigData: this.props.rowTrackConfigData,
        mounted: false
    };

    constructor(props: RcsbFvRowTrackInterface) {
        super(props);
        this.configData = this.props.rowTrackConfigData;
    }

    render(){
        return (
            <div className={classes.rcsbFvRowTrack} style={this.configStyle()}>
                <div id={this.props.id} style={this.borderStyle()}/>
            </div>
        );
    }

    componentDidMount(): void{
        this.subscription = this.subscribe();
        if(this.props.renderSchedule == "sync"){
            this.queueTask();
        }
    }

    componentWillUnmount(): void {
        this.subscription.unsubscribe();
        if(this.asyncTask)
            this.asyncTask.unsubscribe();
        if(this.rcsbFvTrack != null) {
            this.rcsbFvTrack.unsubscribe();
        }
    }

    private subscribe(): Subscription{
        return this.props.contextManager.subscribe((o)=>{
            switch (o.eventType){
                case EventType.ROW_READY:
                    this.renderTrack(o.eventData as RowReadyInterface);
                    break;
            }
        });
    }

    private renderTrack(rowData:RowReadyInterface): void{
        if(this.props.rowNumber-rowData.rowNumber == 1){
            this.queueTask();
        }
    }

    private queueTask(): void {
        this.asyncTask = asyncScheduler.schedule(()=>{
            this.rcsbFvTrack = new RcsbFvTrack(this.configData, this.props.xScale, this.props.selection, this.props.contextManager);
            this.updateHeight();
            if(this.props.selection.getSelected("select") && this.props.selection.getSelected("select").length>0)
                this.props.contextManager.next({
                    eventType:EventType.SET_SELECTION,
                    eventData: {
                        mode:"select",
                        elements:this.props.selection.getSelected("select").map(s=>({begin:s.rcsbFvTrackDataElement.begin,end:s.rcsbFvTrackDataElement.end,isEmpty:s.rcsbFvTrackDataElement.isEmpty}))
                    }
                });
            this.props.contextManager.next({eventType:EventType.ROW_READY, eventData:{rowId:this.props.id,rowNumber:this.props.rowNumber}});
        });
    }

    /**This method is called when the final track height is known, it updates React Component height State*/
    private updateHeight(): void{
        const height: number | null = this.rcsbFvTrack.getTrackHeight();
        if(height != null) {
            this.setState({
                    rowTrackHeight: height + this.rowBorderHeight(),
                    mounted: true
                } as RcsbFvRowTrackState,
                ()=>{
                    this.props.callbackRcsbFvRow(this.state.rowTrackHeight);
                });
        }
    }

    /**
     * @return CSS style width and height for the cell
     * */
    private configStyle() : React.CSSProperties{
        let width : number = RcsbFvDefaultConfigValues.trackWidth;
        if(typeof this.configData.trackWidth === "number"){
            width = this.configData.trackWidth + 2*RcsbFvDefaultConfigValues.borderWidth;
        }
        return {
            width: width,
            height: this.state.rowTrackHeight
        };
    }

    private borderStyle(): React.CSSProperties{
        const style: React.CSSProperties =  {};
        style.borderColor = this.props.rowTrackConfigData.borderColor ?? RcsbFvDefaultConfigValues.borderColor;
        if(this.props.rowTrackConfigData.displayType != RcsbFvDisplayTypes.AXIS) {
            style.borderLeft = this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth + "px solid #DDD";
            style.borderRight = this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth + "px solid #DDD";
        }
        if(this.props.addBorderBottom || this.props.lastRow)
            style.borderBottom = this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth + "px solid #DDD";
        if(this.props.firstRow)
            style.borderTop = this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth + "px solid #DDD";
        return style;
    }

    private rowBorderHeight(): number {
        return (this.props.firstRow  ? this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth : 0) +
            ((this.props.addBorderBottom || this.props.lastRow) ? this.props.rowTrackConfigData.borderWidth ?? RcsbFvDefaultConfigValues.borderWidth : 0);
    }

}
