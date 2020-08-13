import * as React from "react";
import {RcsbFvTrack} from "../RcsbFvTrack/RcsbFvTrack";
import {RcsbFvDefaultConfigValues, RcsbFvDisplayTypes} from "../RcsbFvConfig/RcsbFvDefaultConfigValues";
import * as classes from "../RcsbFvStyles/RcsbFvRow.module.scss";
import {RcsbFvRowConfigInterface} from "../RcsbFvConfig/RcsbFvConfigInterface";
import {RcsbFvContextManager} from "../RcsbFvContextManager/RcsbFvContextManager";
import {ScaleLinear} from "d3-scale";
import {RcsbSelection} from "../../RcsbBoard/RcsbSelection";
import {RcsbFvRowUI} from "./RcsbFvRowUI";

/**Board track  annotations cell React component interface*/
interface RcsbFvRowTrackInterface {
    id: string;
    rowTrackConfigData: RcsbFvRowConfigInterface;
    readonly contextManager: RcsbFvContextManager;
    readonly xScale: ScaleLinear<number,number>;
    readonly selection: RcsbSelection;
    callbackRcsbFvRow(height: number): void;
}

/**Board track  annotations cell React component style*/
interface RcsbFvRowTrackStyleInterface {
    width: number;
    height: number;
}

/**Board track  annotations cell React component state*/
interface RcsbFvRowTrackState {
    rowTrackConfigData: RcsbFvRowConfigInterface;
    rowTrackHeight: number;
    mounted: boolean;
}

export class RcsbFvRowTrack extends React.Component <RcsbFvRowTrackInterface, RcsbFvRowTrackState> {

    /**Board track configuration object*/
    private readonly configData : RcsbFvRowConfigInterface;

    /**Track Protein Feature Viewer object*/
    private rcsbFvTrack : RcsbFvTrack;
    readonly state : RcsbFvRowTrackState = {
        rowTrackHeight:RcsbFvDefaultConfigValues.trackHeight,
        rowTrackConfigData: this.props.rowTrackConfigData,
        mounted: false
    };

    constructor(props: RcsbFvRowTrackInterface) {
        super(props);
        this.configData = this.props.rowTrackConfigData;
    }

    render(){
        if(this.configData.displayType === RcsbFvDisplayTypes.UI) {
            return (
                <div className={classes.rcsbFvRowTrack} style={this.configStyle()}>
                    <RcsbFvRowUI xScale={this.props.xScale} contextManager={this.props.contextManager} length={this.props.rowTrackConfigData.length}/>
                </div>
            )
        } else {
            return (
                <div className={classes.rcsbFvRowTrack} style={this.configStyle()}>
                    <div id={this.props.id}/>
                </div>
            );
        }
    }

    componentDidMount(): void{
        if(this.configData.displayType !== RcsbFvDisplayTypes.UI) {
            this.rcsbFvTrack = new RcsbFvTrack(this.configData, this.props.xScale, this.props.selection, this.props.contextManager, this.updateHeight.bind(this));
            this.updateHeight();
        }
    }

    componentWillUnmount(): void {
        if(this.rcsbFvTrack != null) {
            this.rcsbFvTrack.unsubscribe();
        }
    }

    /**This method is called when the final track height is known, it updates React Component height State*/
    private updateHeight(): void{
        const height: number | null = this.rcsbFvTrack.getTrackHeight();
        if(height != null) {
            this.setState({rowTrackHeight: height, mounted: true} as RcsbFvRowTrackState);
            this.props.callbackRcsbFvRow(height);
        }
    }

    /**
     * @return CSS style width and height for the cell
     * */
    private configStyle() : RcsbFvRowTrackStyleInterface {
        let width : number = RcsbFvDefaultConfigValues.trackWidth;
        if(typeof this.configData.trackWidth === "number"){
            width = this.configData.trackWidth;
        }
        return {
            width: width,
            height: this.state.rowTrackHeight
        };
    }

}
