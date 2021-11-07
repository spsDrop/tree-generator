/** @jsx jsx */
import { jsx } from '@emotion/react';
const { css } = require("@emotion/react");
const React = require('react');
const { default: ReactSlider } = require('react-slider');
import {throttle} from './utils'

const controlsStyle = css`
    position: absolute;
    right: 2rem;
    bottom: 1rem;
    padding: 1rem;
    background: rgba(140, 151, 136, 0.25);
    border-radius: 0.5rem;
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
            background: rgba(140, 151, 136, 0.45);
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
        color: rgba(140, 151, 136, 1);
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

function defaultSettings(){
    return  {
        seed: 0.013824013294652104,

        doLeaves: true,
        leafBranchDepth: 6,
        leafScaleFactor: 1,
        leafRelativeScaleFactor: 0.5,

        trunkRotationX: 15,
        trunkRotationY: 45,
        trunkRotationZ: 25,
        branchRotationX: 40,
        branchRotationY: 45,
        branchRotationZ: 60,

        trunkLengthDecay: 0.2,
        branchLengthDecay: 0.2,
        trunkRadiusDecay: 0.04,
        branchRadiusDecay: 0.06,
        branchRadiusDecayPerSegment: 0.08,

        branchDepth: 9,
        segmentsPerBranch: 5,
        segmentLength: 2,
        sectionsPerSegment: 12,
        initialRadius: 1,
        rotate: true,
        hidden: false
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
    }, 500);

    componentDidMount(){
        this.updateTree();
        this.props.treeScene.render();
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
    }

    render(){
        return (<div css={controlsStyle}>
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
        </div>);
    }
}