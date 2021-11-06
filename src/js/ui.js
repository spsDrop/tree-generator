var React = require('react');
var ReactSlider = require('react-slider');

var TreeUI = React.createClass({
    getInitialState: function(){
        return {
            trunkRotationX: 15,
            trunkRotationXSeedMultiplier: 0,
            trunkRotationY: 45,
            trunkRotationYSeedMultiplier: 1,
            trunkRotationZ: 25,
            trunkRotationZSeedMultiplier: 1,
            branchRotationX: 40,
            branchRotationXSeedMultiplier: 0,
            branchRotationY: 45,
            branchRotationYSeedMultiplier: -1,
            branchRotationZ: 60,
            branchRotationZSeedMultiplier: -1,

            trunkLengthDecay: 0.2,
            branchLengthDecay: 0.2,
            trunkRadiusDecay: 0.25,
            branchRadiusDecay: 0.05,

            branchDepth: 9,
            segmentsPerBranch: 5,
            segmentRadiusDecay: 0.05,
            segmentLength: 2,
            sectionsPerSegment: 12,
            initialRadius: 1
        }
    },
    updateProp: function(propName, value){
        var update = {};

        update[propName] = value;

        this.setState(update);
    },
    updateIntProp: function(propName, value){
        this.updateProp(propName, Math.round(value));
    },
    updateTree: function(){
        this.props.treeApp.generateTree(this.state);
    },
    ranges:{
        rotation:{ max: 180, min: 0 },
        multiplier:{ max: 1, min: -1 },
        length:{ max: 3, min: 1 },
        decay:{ max: 0.5, min: 0 },
        depth:{ max:12, min:3 },
        segments:{ max: 8, min: 2 },
        sections:{ max: 20, min: 4 }
    },
    componentDidMount:function(){
        this.updateTree();
    },
    renderSlider: function(prop, defaults){
        return <div>
            <label>{prop}</label>
            <ReactSlider onChange={this.updateIntProp.bind(this, prop)} value={this.state[prop]} {...defaults}/>
        </div>;
    },
    render: function(){
        return <div class="controls">
            {this.renderSlider("trunkRotationX", this.ranges.rotation)}
            {this.renderSlider("trunkRotationXSeedMultiplier", this.ranges.multiplier)}
            {this.renderSlider("trunkRotationY", this.ranges.rotation)}
            {this.renderSlider("trunkRotationYSeedMultiplier", this.ranges.multiplier)}
            {this.renderSlider("trunkRotationZ", this.ranges.rotation)}
            {this.renderSlider("trunkRotationZSeedMultiplier", this.ranges.multiplier)}
            {this.renderSlider("branchRotationX", this.ranges.rotation)}
            {this.renderSlider("branchRotationXSeedMultiplier", this.ranges.multiplier)}
            {this.renderSlider("branchRotationY", this.ranges.rotation)}
            {this.renderSlider("branchRotationYSeedMultiplier", this.ranges.multiplier)}
            {this.renderSlider("branchRotationZ", this.ranges.rotation)}
            {this.renderSlider("branchRotationZSeedMultiplier", this.ranges.multiplier)}
            <button onclick={this.updateTree}>Update Tree</button>
        </div>;
    }
});

module.exports = TreeUI;