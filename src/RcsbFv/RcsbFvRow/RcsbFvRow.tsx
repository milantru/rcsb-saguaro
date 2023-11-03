import React from "react";
import {RcsbFvDefaultConfigValues, RcsbFvDisplayTypes} from "../RcsbFvConfig/RcsbFvDefaultConfigValues";
import {RcsbFvRowTitle} from "./RcsbFvRowTitle";
import {RcsbFvRowTrack} from "./RcsbFvRowTrack";
import {RcsbFvRowExtendedConfigInterface} from "../RcsbFvConfig/RcsbFvConfigInterface";
import classes from "../../scss/RcsbFvRow.module.scss";
import {
    EventType,
    RcsbFvContextManager,
    RcsbFvContextManagerType,
    TrackVisibilityInterface
} from "../RcsbFvContextManager/RcsbFvContextManager";
import {RcsbSelection} from "../../RcsbBoard/RcsbSelection";
import {Subscription} from "rxjs";
import {CSSTransition} from 'react-transition-group';
import {RcsbScaleInterface} from "../../RcsbBoard/RcsbD3/RcsbD3ScaleFactory";

/**Board track React component interface*/
interface RcsbFvRowInterface {
    readonly id: string;
    readonly boardId: string;
    readonly rowNumber: number;
    readonly rowConfigData: RcsbFvRowExtendedConfigInterface;
    readonly contextManager: RcsbFvContextManager;
    readonly xScale: RcsbScaleInterface;
    readonly selection: RcsbSelection;
    readonly renderSchedule: "async"|"sync"|"fixed";
}

/**Board track React state interface*/
interface RcsbFvRowState {
    readonly rowHeight: number;
    readonly mounted: boolean;
    readonly rowConfigData: RcsbFvRowExtendedConfigInterface;
    readonly display: boolean;
    readonly titleGlow: boolean;
}


/**Board track React Component className*/
export class RcsbFvRow extends React.Component <RcsbFvRowInterface, RcsbFvRowState> {

    readonly state : RcsbFvRowState = {
        rowHeight:RcsbFvDefaultConfigValues.trackHeight,
        display: true,
        mounted: false,
        rowConfigData: this.props.rowConfigData,
        titleGlow:false
    };

    /**Subscription to events*/
    private subscription: Subscription;

    constructor(props: RcsbFvRowInterface) {
        super(props);
    }

    render(){
        const classNames:string = this.props.rowConfigData.displayType === RcsbFvDisplayTypes.AXIS ? classes.rcsbFvRow+" "+classes.rcsbFvRowAxis : classes.rcsbFvRow;
        return (
            <CSSTransition
                in={this.state.display}
                timeout={RcsbFvDefaultConfigValues.rowHideTransitionTimeout}
                classNames={classes.rcsbFvRow}
                onEntering={()=>{
                    this.props.contextManager.next({eventType: EventType.BOARD_HOVER, eventData:true});
                }}
                onExited={()=>{
                    this.props.contextManager.next({eventType: EventType.BOARD_HOVER, eventData:true});
                }}>
                <div onMouseEnter={()=>{this.hoverRow(true)}} onMouseLeave={()=>{this.hoverRow(false)}}
                     className={classNames+((this.state.titleGlow && this.state.display)? " "+classes.rcsbFvGlowTitle : "")}
                     style={this.configStyle()}>
                    <RcsbFvRowTitle data={this.props.rowConfigData} rowTitleHeight={this.state.rowHeight} isGlowing={this.state.titleGlow} {...this.props.rowConfigData.externalRowTitle?.rowTitleAdditionalProps} />
                    <RcsbFvRowTrack
                        id={this.props.id}
                        rowNumber={this.props.rowNumber}
                        rowTrackConfigData={this.props.rowConfigData}
                        xScale={this.props.xScale}
                        selection={this.props.selection}
                        contextManager={this.props.contextManager}
                        callbackRcsbFvRow={this.callbackRcsbFvRowTrack.bind(this)}
                        renderSchedule={this.props.renderSchedule}
                    />
                </div>
            </CSSTransition>
        );
    }

    componentDidMount(): void{
        this.subscription = this.subscribe();
    }

    componentWillUnmount(): void {
        if(this.subscription != null) {
            this.subscription.unsubscribe();
        }
    }

    /**Subscribe className to rxjs events (adding tracks, change scale, update board config)
     * @return rxjs Subscription object
     * */
    private subscribe(): Subscription{
        return this.props.contextManager.subscribe((obj:RcsbFvContextManagerType)=>{
            if(obj.eventType===EventType.TRACK_HIDE){
                const vis: TrackVisibilityInterface = obj.eventData;
                if(vis.trackId === this.props.rowConfigData.trackId){
                    this.changeClass(vis.visibility);
                }
            }else if(obj.eventType === EventType.ROW_HOVER){
                const trackId: string = obj.eventData;
                this.checkHoveredRow(trackId);
            }
        });
    }

    private hoverRow(flag: boolean): void {
        if(!this.props.rowConfigData.hideRowGlow){
            this.setState(()=>({titleGlow:flag}));
            this.props.contextManager.next({
                eventType: EventType.ROW_HOVER,
                eventData: (this.props.rowConfigData.displayType != RcsbFvDisplayTypes.AXIS && flag) ? this.props.id : null
            } as RcsbFvContextManagerType);
        }
    }

    private checkHoveredRow(trackId: string){
        if(trackId != this.props.id && this.state.titleGlow){
            this.setState(()=>({titleGlow:false}));
        }
    }

    private changeClass(display: boolean): void{
        this.setState({display:display});
    }

    /**This function will be called once the final height of the track is known*/
    private callbackRcsbFvRowTrack(rcsbRowTrackHeight: number): void {
        this.setState({rowHeight: rcsbRowTrackHeight, mounted:true} as RcsbFvRowState);
    }

    /**Returns the full track width (title+annotations) and height
     * @return Board track full width
     * */
    configStyle(): React.CSSProperties {
        let titleWidth : number = RcsbFvDefaultConfigValues.rowTitleWidth;
        if(typeof this.props.rowConfigData.rowTitleWidth === "number"){
            titleWidth = this.props.rowConfigData.rowTitleWidth;
        }
        let trackWidth : number = RcsbFvDefaultConfigValues.trackWidth;
        if(typeof this.props.rowConfigData.trackWidth === "number"){
            trackWidth = this.props.rowConfigData.trackWidth + 2 * RcsbFvDefaultConfigValues.borderWidth;
        }
        return {
            width: (titleWidth + trackWidth + RcsbFvDefaultConfigValues.titleAndTrackSpace),
            height: this.state.rowHeight,
        };
    }

}
