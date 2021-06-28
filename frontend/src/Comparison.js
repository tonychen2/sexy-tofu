import React, {useState, Component} from "react";
import  "regenerator-runtime";

import { makeStyles } from '@material-ui/core/styles';
import {Accordion, AccordionSummary, AccordionDetails} from "@material-ui/core";
import {Typography} from "@material-ui/core";
import {Select, MenuItem} from "@material-ui/core";
import {Slider} from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';

import {pluralize} from "./utils.js"

import meatLoverIcon from "./assets/summary_graphics/Tofu_meatlover.png";
import avgAmericanIcon from "./assets/summary_graphics/Tofu_avgamerican.png";
import globalAvgIcon from "./assets/summary_graphics/Tofu_globalavg.png";
import sexyTofuIcon from "./assets/summary_graphics/Tofu_sexytofu.png";

const boxStyles = {
    root: {
        backgroundColor: '#ffdbec',
        margin: '50px 0px 10px'
    },
    summary: {
        color: '#fc0a7e',
        margin: 'auto',
        paddingTop: '20px'
    },
    details: {
        padding: "0px 60px",
        color: 'grey',
        flexWrap: 'wrap'
    },
    dropDown: {
        color: 'grey',
    },
    config: {
        width: '100%',
        textAlign: 'center'
    }
};

const scaleStyles = makeStyles((theme) => ({
    root: {
        margin: '50px auto 180px',
        maxWidth: '1000px'
    },
    thumb: {
        color: '#fc0a7e'
    },
    valueLabel: {
        left: 'auto'
    },
    mark: {
        width: '5px',
        height: '5px',
        borderRadius: '2.5px',
        top: '12px',
    },
    markLabel: {
        color: 'grey'
    },
    markLabelActive: {
        color: 'grey'
    }
}));

const DEFAULT_NUM_PEOPLE = 1;
const DEFAULT_NUM_DAYS = 7;


class Comparison extends Component {
    state = {numPeople: DEFAULT_NUM_PEOPLE, numDays: DEFAULT_NUM_DAYS};

    handleNumPeopleChange = event => {
        this.setState({numPeople: event.target.value});
    }

    handleNumDaysChange = event => {
        this.setState({numDays: event.target.value});
    }

    render() {
        const classes = this.props.classes;

        const selectNumPeople =
            <Select value={this.state.numPeople}
                    onChange={this.handleNumPeopleChange}
                    className={classes.dropDown}>
                {[...Array(10).keys()].map((x) => <MenuItem value={x} key={`numPeople-${x}`}>{x}</MenuItem>)}
            </Select>;
        const selectNumDays =
            <Select value={this.state.numDays}
                    onChange={this.handleNumDaysChange}
                    className={classes.dropDown}>
                {[...Array(14).keys()].map((x) => <MenuItem value={x} key={`numDays-${x}`}>{x}</MenuItem>)}
            </Select>;

        return (
            <div id="comparison" className={classes.root}>
                <Accordion className={classes.root} square defaultExpanded elevation={0}>
                    <AccordionSummary>
                        <h2 className={classes.summary}>How do I compare to others? </h2>
                    </AccordionSummary>
                    <AccordionDetails className={classes.details}>
                        <div id="config" className={classes.config}>
                            This list is for&nbsp;
                            {selectNumPeople} {pluralize('person', 'people', this.state.numPeople)}&nbsp;
                            to consume over&nbsp;
                            {selectNumDays} {pluralize('day', 'days', this.state.numDays)}.
                        </div>
                        <ComparisonScale totalImpact={this.props.totalImpact}
                                         numPeople={this.state.numPeople}
                                         numDays={this.state.numDays}
                        />

                    </AccordionDetails>
                </Accordion>
            </div>
        )
    }
}

function ComparisonScale(props) {
    const classes = scaleStyles();

    const normalizedImpact = props.totalImpact /
        (props.numPeople / DEFAULT_NUM_PEOPLE) /
        (props.numDays / DEFAULT_NUM_DAYS);

    return (
        <Slider
            classes={classes}
            component='div'
            disabled
            value={normalizedImpact}
            marks={[
                {value: 17, label: <PersonaLabel name="Sexy Tofu" weeklyImpact='<17' icon={sexyTofuIcon} classes={classes} />},
                {value: 76, label: <PersonaLabel name="Global Average" weeklyImpact='76' icon={globalAvgIcon} classes={classes} />},
                {value: 189, label: <PersonaLabel name="Average American" weeklyImpact='189' icon={avgAmericanIcon} classes={classes} />},
                {value: 224, label: <PersonaLabel name="Meat Lover" weeklyImpact='>224' icon={meatLoverIcon} classes={classes} />}]}
            step={1}
            min={17}
            max={224}
            valueLabelFormat={(value) => 'You'}
            valueLabelDisplay='on'
            track={false} />
    )
}

function PersonaLabel(props) {
    return (
        <span>
            <span style={{display: 'block'}}>{props.name}</span>
            <span style={{display: 'block'}}>{props.weeklyImpact} lbs/week</span>
            <img src={props.icon} alt={props.name} style={{width: '7vw', minWidth: '8ch'}} />
        </span>)
}

// function MyValueLabel(props) {
//     return withStyles(scaleStyles.valueLabel)(<span />)
// }

export default withStyles(boxStyles)(Comparison);