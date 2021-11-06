let React = require('react');
let ReactSlider = require('react-slider');

let TreeUI = React.createClass({

    getInitialState: function(){
        var savedSettings,
            match = location.hash.match(/#settings=(.+)/);

        try{
            savedSettings = JSON.parse(localStorage.treeGeneratorSettings);
        }catch(e){
            console.log("Error retrieving settings");
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

        return savedSettings || this.defaultSettings;
    },

    get defaultSettings(){
        return  {
            seed: 0.013824013294652104,

            doLeaves: true,
            leafBranchDepth: 6,
            leafScaleFactor: 1,
            leafRelativeScaleFactor: 0.5,

            trunkRotationX: 15,
            trunkRotationXSeedMultiplier: 0,
            trunkRotationY: 45,
            trunkRotationYSeedMultiplier: 1,
            trunkRotationZ: 25,
            trunkRotationZSeedMultiplier: 1,
            branchRotationX: -40,
            branchRotationXSeedMultiplier: 0,
            branchRotationY: 45,
            branchRotationYSeedMultiplier: -1,
            branchRotationZ: 60,
            branchRotationZSeedMultiplier: -1,

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
            hidden: false
        };
    },

    ranges:{
        rotation:{ max: 90, min: -90 },
        multiplier:{ max: 1, min: -1 },
        length:{ max: 3, min: 1 },
        decay:{ max: 0.4, min: 0 },
        depth:{ max:12, min:3 },
        segments:{ max: 8, min: 2 },
        sections:{ max: 20, min: 4 }
    },

    saveSettings: function(){
        var json = JSON.stringify(this.state);
        localStorage.treeGeneratorSettings = json;
        location.hash = "settings="+btoa(json);
    },

    reset: function(){
        if(confirm("This will completely reset your settings")){
            this.setState(this.defaultSettings, ()=>{
                this.saveSettings();
                this.updateTree();
            })
        }
    },

    updateProp: function(propName, value, cb){
        var update = {};

        update[propName] = value;

        this.setState(update, ()=>{
            this.saveSettings();
            cb && cb();
        });
    },

    updateIntProp: function(propName, value, cb){
        this.updateProp(propName, Math.round(value), cb);
    },

    updateTree: function(){
        this.props.treeScene.generateTree(this.state);
    },

    componentDidMount:function(){
        this.updateTree();
    },

    renderSlider: function(prop, defaults, float){
        var update = float ? this.updateProp : this.updateIntProp;
        return <div className="property">
            <label>{prop}: <b>{this.state[prop]}</b></label>
            <ReactSlider step={float ? 0.01 : 1} onAfterChange={this.updateTree} onChange={update.bind(this, prop)} value={this.state[prop]} {...defaults}/>
        </div>;
    },

    toggle: function(){
        this.setState({
            hidden: !this.state.hidden
        })
    },

    render: function(){
        return <div>
            <div className={"toggle" + (this.state.hidden ? " hidden" : "")} onClick={this.toggle}>
                {this.state.hidden ? 'Show Settings' : 'Hide Settings' }
            </div>
            <div className={"controls" + (this.state.hidden ? " hidden" : "")}>
                <div className="section">
                    <button onClick={this.reset}>Reset to default settings</button>
                </div>
                <div className="section">
                    <label>Seed: <b>{this.state.seed}</b></label>
                    <button onClick={()=>this.updateProp("seed", Math.random(), this.updateTree)}>
                        Generate New Seed
                    </button>
                </div>
                <div className="section">
                    <h3>Geometry</h3>
                    {this.renderSlider("branchDepth", this.ranges.depth)}
                    {this.renderSlider("segmentsPerBranch", this.ranges.segments)}
                    {this.renderSlider("segmentLength", this.ranges.length, true)}
                    {this.renderSlider("sectionsPerSegment", this.ranges.sections)}
                    {this.renderSlider("initialRadius", this.ranges.length, true)}
                </div>
                <div className="section">
                    <h3>Decays</h3>
                    {this.renderSlider("trunkLengthDecay", this.ranges.decay, true)}
                    {this.renderSlider("branchLengthDecay", this.ranges.decay, true)}
                    {this.renderSlider("trunkRadiusDecay", this.ranges.decay, true)}
                    {this.renderSlider("branchRadiusDecay", this.ranges.decay, true)}
                    {this.renderSlider("branchRadiusDecayPerSegment", this.ranges.decay, true)}
                </div>
                <div className="section">
                    <h3>Leaves</h3>
                    <div className="property">
                        <label>Do Leaves <input type="checkbox" checked={this.state.doLeaves} onChange={()=>{
                            this.setState({doLeaves:!this.state.doLeaves}, ()=>{
                                this.saveSettings();
                                this.updateTree();
                            });
                        }}/></label>
                    </div>
                    {this.renderSlider("leafBranchDepth", this.ranges.depth)}
                    {this.renderSlider("leafScaleFactor", {max: 3, min: 0}, true)}
                    {this.renderSlider("leafRelativeScaleFactor", {max: 1, min: 0}, true)}
                </div>
                <div className="section">
                    <h3>Rotations</h3>
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
                </div>
            </div>
        </div>;
    }
});

module.exports = TreeUI;