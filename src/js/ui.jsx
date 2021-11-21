/** @jsx jsx */
import { jsx } from '@emotion/react';
import { css } from '@emotion/react';
import React from 'react';
import { Gestures } from 'react-gesture-handler';
import ReactSlider from 'react-slider';
import { FpsCounter } from './fps-counter';
import {throttle} from './utils';

const boxStyles = css`
    padding: 1rem;
    background: rgba(72, 88, 66, 0.774);
    border-radius: 0.5rem;
    color: #b9ccb9;
`

const controlsStyle = css`
    position: absolute;
    right: 2rem;
    bottom: 1rem;
`;

const sectionStyle = css`
    margin-bottom: 0.5rem;
`;

const sliderStyle = css`
    margin-bottom: 0.3rem;
    .slider {
        height: 1rem;
        .track {
            height: 0.5rem;
            background: rgba(151, 173, 143, 0.45);
            top: 0.25rem;
        }
        .thumb {
            top: 0.1275rem;
            height: 0.75rem;
            width: 0.75rem;
            background: #2d302c;
            cursor: pointer;
        }
    }

    b {
        color: #758d6c;
    }
`;

const toggleStyles = css`
    font-weight: bold;
    padding: 0.2rem 0.3rem;
    cursor: pointer;
`;

const scrollArea = css`
    overflow-y: auto;
    max-height: 90vh;
`;

const bugStyles = css`
    position: absolute;
    left: 2rem;
    bottom: 1rem;
    padding
`;

const eventArea = css`
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
`

function defaultSettings(){
    return  {
        seed: 0.5608898704217697,

        doLeaves: true,
        leafBranchDepth: 6,
        leafScaleFactor: 1,
        leafRelativeScaleFactor: 0.5,


        trunkLengthDecay: 0.16,
        trunkRadiusDecay: 0.07,
        trunkRotationX: 5,
        trunkRotationY: 10,
        trunkRotationZ: 25,

        
        branchDepth: 10,
        branchLengthDecay: 0.2,
        branchRadiusDecay: 0.09,
        branchRadiusDecayPerSegment: 0.09,
        branchRotationX: 20,
        branchRotationY: 24,
        branchRotationZ: 35,


        branchDepth: 10,
        segmentsPerBranch: 5,
        segmentLength: 2,
        sectionsPerSegment: 15,
        initialRadius: 1.19,
        rotate: true,
        hidden: false,
        noise: true,
        noiseScale: 1/60,
        noiseFactor: 0.5
    };
};

export default class TreeUI extends React.Component{

    constructor(props){
        super(props);
        let savedSettings,
            match = location.hash.match(/#settings=(.+)/);

        try{
            savedSettings = JSON.parse(localStorage.treeGeneratorSettings);
        }catch(e){
            console.log("Error retrieving settings");
            savedSettings = defaultSettings();
        }

        if(match && match[0]){
            try{
                savedSettings = JSON.parse(atob(match[1]));
            }catch(e){
                console.log("Error retrieving settings");
            }
        }

        if(savedSettings){
            savedSettings.leafBranchDepth = savedSettings.leafBranchDepth || 6;
            savedSettings.leafScaleFactor = savedSettings.leafScaleFactor || 1;
            savedSettings.leafRelativeScaleFactor = savedSettings.leafRelativeScaleFactor || 0.5;
        }

        this.eventRef = React.createRef();

        this.state = savedSettings;
    }

    

    ranges = {
        rotation:{ max: 90, min: 0 },
        multiplier:{ max: 1, min: -1 },
        length:{ max: 3, min: 1 },
        decay:{ max: 0.4, min: 0 },
        depth:{ max:12, min:3 },
        segments:{ max: 8, min: 2 },
        sections:{ max: 20, min: 4 }
    }

    saveSettings(){
        const json = JSON.stringify(this.state);
        localStorage.treeGeneratorSettings = json;
        location.hash = "settings="+btoa(json);
    }

    reset(){
        if(confirm("This will completely reset your settings")){
            this.setState(defaultSettings(), ()=>{
                this.saveSettings();
                this.updateTree();
            })
        }
    }

    updateProp(propName, value, cb){
        const update = {};

        update[propName] = value;

        this.setState(update, ()=>{
            this.saveSettings();
            cb && cb();
        });
    }

    updateIntProp(propName, value, cb){
        this.updateProp(propName, Math.round(value), cb);
    }

    updateTree = throttle(() => {
        this.props.treeScene.generateTree(this.state);
        this.setState({
            faceCount: this.props.treeScene.getFaceCount()
        })
    }, 500);

    componentDidMount(){
        this.updateTree();
        this.props.treeScene.toggleRotation(this.state.rotate);
        this.props.treeScene.render();
        this.setState({
            faceCount: this.props.treeScene.getFaceCount()
        })
    }

    renderSlider(prop, defaults, float){
        const update = (value) => {
            if (float) {
                this.updateProp(prop, value, () => this.updateTree())
            } else {
                this.updateIntProp(prop, value, () => this.updateTree())
            }
        }; 
        return (
            <div className="property" css={sliderStyle}>
                <label>{prop} <b>{this.state[prop]}</b></label>
                <ReactSlider step={float ? 0.01 : 1} onAfterChange={this.handleUpdateTree} onChange={update} value={this.state[prop]} {...defaults}/>
            </div>
        );
    }

    toggle = () => {
        this.setState({
            hidden: !this.state.hidden
        })
    }

    handleUpdateTree = () => {
        this.updateTree();
    }

    handleNewSeed = () => {
        this.updateProp("seed", Math.random(), () => this.updateTree())
    }

    handleReset = () => {
        this.reset()
    }

    handleToggleRotate = () => {
        this.props.treeScene.toggleRotation(this.state.rotate);
        this.saveSettings();
    }

    spinHome = null;
    rotation = 0;

    onSpinStart = (e) => {
        this.spinHome = { x: e.clientX };
        this.props.treeScene.manualRotation = true;
        this.rotation = this.props.treeScene.getRotation();
    }

    onSpinMove = (e) => {
        if (this.spinHome) {
            const offsetPercent = (e.clientX - this.spinHome.x) / window.innerWidth;
            this.props.treeScene.setRotation(this.rotation + offsetPercent * 2 * Math.PI);
        }
    }

    onSpinEnd = () => {
        this.spinHome = null;
        this.props.treeScene.manualRotation = false;
    }

    onScaleStart = (e) => {
        console.log(e);
    }

    onScaleMove = (e) => {
        console.log(e);
    }

    onScaleEnd = (e) => {
        console.log(e)
    }

    render(){
        return (
        <>
            <Gestures
                recognizers={{
                    Pinch: {
                        events: {
                            pinchstart: this.onScaleStart,
                            pinchmove: this.onScaleMove,
                            pinchend: this.onScaleEnd,
                        }
                    }
                }}
            >
                <div css={eventArea} 
                    onTouchStart={this.onSpinStart}
                    onTouchMove={this.onSpinMove}
                    onTouchEnd={this.onSpinEnd}
                    onTouchCancel={this.onSpinEnd}
                    onMouseDown={this.onSpinStart}
                    onMouseMove={this.onSpinMove}
                    onMouseUp={this.onSpinEnd}
                    onMouseLeave={this.onSpinEnd}
                />
            </Gestures>
            <div css={[bugStyles, boxStyles]}>
                <p><FpsCounter treeScene={this.props.treeScene} /></p>
                <p>Face count {this.state.faceCount}</p>
            </div>
            <div css={[controlsStyle, boxStyles]}>
                <div css={scrollArea} style={{display: this.state.hidden ? 'none' : 'block'}}>
                    <div css={sectionStyle}>
                        <h3>Geometry</h3>
                        {this.renderSlider("branchDepth", this.ranges.depth)}
                        {this.renderSlider("segmentsPerBranch", this.ranges.segments)}
                        {this.renderSlider("segmentLength", this.ranges.length, true)}
                        {this.renderSlider("sectionsPerSegment", this.ranges.sections)}
                        {this.renderSlider("initialRadius", this.ranges.length, true)}
                    </div>
                    <div css={sectionStyle}>
                        <h3>Decays</h3>
                        {this.renderSlider("trunkLengthDecay", this.ranges.decay, true)}
                        {this.renderSlider("branchLengthDecay", this.ranges.decay, true)}
                        {this.renderSlider("trunkRadiusDecay", this.ranges.decay, true)}
                        {this.renderSlider("branchRadiusDecay", this.ranges.decay, true)}
                        {this.renderSlider("branchRadiusDecayPerSegment", this.ranges.decay, true)}
                    </div>
                    <div css={sectionStyle}>
                        <h3>Leaves</h3>
                        <div css={sectionStyle}>
                            <label>Do Leaves <input type="checkbox" checked={this.state.doLeaves} onChange={()=>{
                                this.setState({doLeaves:!this.state.doLeaves}, ()=>{
                                    this.saveSettings();
                                    this.updateTree();
                                });
                            }}/></label>
                        </div>
                        {this.renderSlider("leafBranchDepth", {min: 1, max: this.state.branchDepth-1})}
                        {this.renderSlider("leafScaleFactor", {max: 3, min: 0}, true)}
                        {this.renderSlider("leafRelativeScaleFactor", {max: 1, min: 0}, true)}
                    </div>
                    <div css={sectionStyle}>
                        <h3>Noise</h3>
                        <div css={sectionStyle}>
                            <label>Do Noise <input type="checkbox" checked={this.state.noise} onChange={()=>{
                                this.setState({noise:!this.state.noise}, ()=>{
                                    this.saveSettings();
                                    this.updateTree();
                                });
                            }}/></label>
                        </div>
                        {this.renderSlider("noiseScale", {max: 1, min: 1/200}, true)}
                        {this.renderSlider("noiseFactor", {max: 1, min: 0}, true)}
                    </div>
                    <div css={sectionStyle}>
                        <h3>Rotations</h3>
                        {this.renderSlider("trunkRotationX", this.ranges.rotation)}
                        {this.renderSlider("trunkRotationY", this.ranges.rotation)}
                        {this.renderSlider("trunkRotationZ", this.ranges.rotation)}
                        {this.renderSlider("branchRotationX", this.ranges.rotation)}
                        {this.renderSlider("branchRotationY", this.ranges.rotation)}
                        {this.renderSlider("branchRotationZ", this.ranges.rotation)}
                    </div>
                    <div css={sectionStyle}>
                        <button onClick={this.handleReset}>Reset to default settings</button>
                    </div>
                    <div css={sectionStyle}>
                        <label>Seed <b>{this.state.seed}</b></label><br/>
                        <button onClick={this.handleNewSeed}>
                            Generate New Seed
                        </button>
                    </div>
                    <div css={sectionStyle}>
                        <label>Rotate <input type="checkbox" checked={this.state.rotate} onChange={()=>{
                            this.setState({rotate:!this.state.rotate}, this.handleToggleRotate);
                        }}/></label>
                    </div>
                </div>
                <div css={toggleStyles} onClick={this.toggle}>
                    {this.state.hidden ? 'Show Settings' : 'Hide Settings' }
                </div>
            </div>
        </>
        );
    }
}