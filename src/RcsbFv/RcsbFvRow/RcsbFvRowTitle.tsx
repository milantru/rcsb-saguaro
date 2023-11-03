import React from "react";
import {RcsbFvDefaultConfigValues} from "../RcsbFvConfig/RcsbFvDefaultConfigValues";
import classes from "../../scss/RcsbFvRow.module.scss";
import {RcsbFvRowExtendedConfigInterface} from "../RcsbFvConfig/RcsbFvConfigInterface";
import {MouseEvent, ReactNode} from "react";
import {RcsbFvRowMark} from "./RcsbFvRowMark";

/**Board track title cell React component interface*/
export interface RcsbFvRowTitleInterface {
    readonly data: RcsbFvRowExtendedConfigInterface;
    readonly rowTitleHeight: number;
    readonly isGlowing: boolean;
}

interface RcsbFvRowTitleInterState {
    readonly expandTitle: boolean;
}

export type RowTitleComponentType<P={},S={}> = typeof React.Component<RcsbFvRowTitleInterface & P,S>;

export class RcsbFvRowTitle extends  React.Component<RcsbFvRowTitleInterface,RcsbFvRowTitleInterState> {

    private readonly configData : RcsbFvRowExtendedConfigInterface;
    readonly state = {
        expandTitle: false
    };
    private readonly PADDING_RIGHT: number = 5;

    constructor(props: RcsbFvRowTitleInterface) {
        super(props);
        this.configData = this.props.data;
    }

    public render(): ReactNode {
        const height: number = (this.configStyle().height as number);
        const trackTitle: string = typeof this.configData?.rowTitle === "string" ? this.configData.rowTitle : (typeof this.configData?.rowTitle === "object" ? this.configData.rowTitle.visibleTex : "");

        let titleElement: ReactNode;
        if(this.props.data.externalRowTitle?.rowTitleComponent){
            const rowTitleProps = this.props.data.externalRowTitle.rowTitleAdditionalProps;
            const RowTitleComponent: RowTitleComponentType<typeof rowTitleProps,any> = this.props.data.externalRowTitle?.rowTitleComponent;
            titleElement =(<>
                <div className={classes.rcsbFvRowTitleText+(this.state.expandTitle ? " "+classes.rcsbFvRowTitleTextExpand : "")}
                     style={{lineHeight:height+"px", paddingRight:this.PADDING_RIGHT}}
                     onMouseEnter={(evt)=>{this.expandTitle(evt, true)}}
                     onMouseLeave={(evt)=>{this.expandTitle(evt, false)}}
                >
                    <RcsbFvRowMark {...this.props.data.rowMark} isGlowing={this.props.isGlowing}/>
                    <div style={{display:"inline-block"}}>
                        <RowTitleComponent {...this.props} {...rowTitleProps}/>
                    </div>
                </div>
            </>);
        }else if(typeof this.configData.rowPrefix === "string" && this.configData.rowPrefix.length > 0 && this.configData.fitTitleWidth){
            const prefixLength: number = Math.max(this.configData.rowPrefix.length, 16);
            const prefixWidth: number = Math.round((prefixLength/(prefixLength+trackTitle.length)*(this.configStyle().width as number)));
            const titleWidth: number = (this.configStyle().width as number)-prefixWidth;
            const style: React.CSSProperties = {width:titleWidth,height:height,paddingRight:this.PADDING_RIGHT};
            titleElement = (<>
                    <div style={{...style, float:"right", display:"inline-block"}}>
                        <div className={classes.rcsbFvRowTitleText} style={{lineHeight:height+"px"}}>{this.setTitle()}</div>
                    </div>
                    <div style={{height:height, float:"right", display:"inline-block"}}>
                        <div className={classes.rcsbFvRowTitleText}  style={{lineHeight:height+"px", display:"inline-block"}}>
                            <RcsbFvRowMark {...this.props.data.rowMark} isGlowing={this.props.isGlowing}/>
                            {this.configData.rowPrefix}
                        </div>
                    </div>
                </>);
        }else if(typeof this.configData.rowPrefix === "string" && this.configData.rowPrefix.length > 0){
            titleElement = (<>
                    <div className={classes.rcsbFvRowTitleText+(this.state.expandTitle ? " "+classes.rcsbFvRowTitleTextExpand : "")}
                         style={{lineHeight:height+"px", paddingRight:this.PADDING_RIGHT}}
                         onMouseEnter={(evt)=>{this.expandTitle(evt, true)}}
                         onMouseLeave={(evt)=>{this.expandTitle(evt, false)}}
                    >
                        <RcsbFvRowMark {...this.props.data.rowMark} isGlowing={this.props.isGlowing}/>
                        {this.configData.rowPrefix+" "}{this.setTitle()}
                    </div>
                </>);
        }else{
            titleElement = (
               <>
                    <div className={classes.rcsbFvRowTitleText+(this.state.expandTitle ? " "+classes.rcsbFvRowTitleTextExpand : "")}
                         style={{lineHeight:height+"px", paddingRight:this.PADDING_RIGHT}}
                         onMouseEnter={(evt)=>{this.expandTitle(evt, true)}}
                         onMouseLeave={(evt)=>{this.expandTitle(evt, false)}}
                    >
                        <RcsbFvRowMark {...this.props.data.rowMark} isGlowing={this.props.isGlowing}/>
                        {this.setTitle()}
                    </div>
               </>
            );
        }
        return ( <div className={classes.rcsbFvRowTitle} style={this.configStyle()}>
            {
                this.setTitle() != null ? <div style={this.configTitleFlagColorStyle()}
                                               className={classes.rcsbFvRowTitleProvenanceFlag}/> : null
            }
            {
                titleElement
            }
        </div>);

    }

    /**
     * @return Title string defined in the track configuration object
     * */
    private setTitle(): string | null | ReactNode {
        if(typeof this.configData.rowTitle === "string"){
            return this.configData.rowTitle;
        }else if(typeof this.configData.rowTitle === "object"){
            const target: string = this.configData.rowTitle.isThirdParty ? "_blank" : "_self";
            if(typeof this.configData.rowTitle.url === "string")
                return (<a href={this.configData.rowTitle.url} target={target} style={this.configData.rowTitle.style}>{this.configData.rowTitle.visibleTex}</a>);
            else
                return (<span style={this.configData.rowTitle.style}>{this.configData.rowTitle.visibleTex}</span>);
        }
        return null
    }

    /**
     * @return CSS style width and height for the cell
     * */
    private configStyle() : React.CSSProperties {
        let width : number = RcsbFvDefaultConfigValues.rowTitleWidth;
        if(typeof this.configData.rowTitleWidth === "number"){
            width = this.configData.rowTitleWidth;
        }
        return {
            width: width,
            height: this.props.rowTitleHeight
        };
    }

    /**
     * @return Title flag color css style properties
     * */
    private configTitleFlagColorStyle():React.CSSProperties {
        let color: string = "#FFFFFF";
        if(typeof this.props.data.titleFlagColor === "string"){
            color = this.props.data.titleFlagColor;
        }
        return {
            backgroundColor: color,
            height: this.props.rowTitleHeight,
            width: this.PADDING_RIGHT,
            float:"right"
        };
    }

    private expandTitle(evt: MouseEvent<HTMLDivElement>, flag: boolean): void{
        const div: HTMLDivElement = evt.currentTarget;
        if ( (0 > div.clientWidth - div.scrollWidth) && flag) {
            if(flag)
                this.setState({expandTitle: true});
        }else{
            this.setState({expandTitle: false});
        }

    }
}

