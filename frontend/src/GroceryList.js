import React, {Component} from "react";
import  "regenerator-runtime";

import {Grid, Box, Typography} from '@material-ui/core';
import {TextField, Button, IconButton} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import {List, ListItem} from '@material-ui/core';
import {withStyles} from '@material-ui/core';

const GHGI_API_ADDRESS = 'https://api.ghgi.org';
const NATIVE_API_ADDRESS = 'http://127.0.0.1:8000';


const styles = {
    root: {
        alignItems: 'center'
    },
    box: {
        padding: '10px',
        margin: '50px auto',
        maxWidth: '70ch'
    },
    title: {
        marginBottom: '20px'
    },
    row: {
        // paddingTop: '2px',
        // paddingBottom: '2px'
        padding: '2px 0px'
    },
    inputGrid: {
        display: "flex"
    },
    textField: {
        width: '100%',
        borderRadius: '4px',
        backgroundColor: '#ffdbec',
        margin: '2px',
        '&:hover': {
            borderColor: '#fc0a7e',
        },
        '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
                borderColor: 'transparent',
            },
            '&.Mui-focused fieldset': {
                borderColor: 'transparent'
            },
        }
    },
    button: {
        border: '0',
        right: '0',
        margin: '5px',
        backgroundColor: '#ffdbec',
        color: '#fc0a7e',
        '&:hover': {
            backgroundColor: '#fc0a7e',
            color: '#ffdbec'
        },
    }
}

class GroceryList extends Component {
    constructor(props) {
        super(props);
        this.state = {groceryList: [], currentQuery: ""};
    }

    componentDidUpdate(prevProps) {
        if (this.props.requestForUpdate !== prevProps.requestForUpdate) {
            let request = this.props.requestForUpdate;
            let index = this.valueToIndex(request['field'], request['oldValue']);
            // TODO: error handling
            if (index === -1) return;
            this.updateFood(index, request['field'], request['newValue']);
            this.props.search(this.state.groceryList);
        }
    }

    valueToIndex = (field, value) => {
        let list = this.state.groceryList.map((item) => item[field]);
        return list.indexOf(value);
    }

    updateQuery = event => {
        /**
         * Update state of GroceryList to store current user input as foodQuery
         */
        this.setState({currentQuery: event.target.value});
    }

    handleKeyPress = event => {
        /**
         * React to key presses
         */
        if (event.key === 'Enter') {
            if (this.state.currentQuery === "") {
                this.props.search(this.state.groceryList);
            } else {
                this.addFood();
            }
        }
    }

    addFood = async () => {
        /**
         * Add user input to grocery list
         */
        if (this.state.currentQuery === "") {
            return
        }

        let parsed = await fetch(`${NATIVE_API_ADDRESS}/parse/?query=${this.state.currentQuery}`)
            .then(response => response.json());
        let default_grams = await fetch(`${GHGI_API_ADDRESS}/rateCarbon`,
            {method: 'POST',
                body: JSON.stringify({'recipe': [this.state.currentQuery]})})
            .then(response => response.json())
            .then(json => json['items'][0]['g']);

        // TODO: refine this logic to include super
        let default_qty;
        let default_unit;
        if (default_grams >= 400) {
            default_qty = Math.round(default_grams / 454);
            default_unit = "pound"
        }
        else if (default_grams >= 100) {
            default_qty = Math.round(default_grams / 28);
            default_unit = "ounce";
        }
        else {
            default_qty = default_grams;
            default_unit = "gram";
        }

        let groceryList = this.state.groceryList;
        let name = parsed['names'][0];
        let quantity = parsed['qtys'][0]['qty'][0] || default_qty;
        let unit = parsed['qtys'][0]['unit'][0] || default_unit;

        groceryList.push({"ingredient": name,
            "quantity": quantity,
            "unit": unit});

        this.setState({groceryList: groceryList, currentQuery: "",});
    }

    updateFood = (index, field, newValue) => {
        /**
         * Update an item in shopping list
         */
        let groceryList = this.state.groceryList;
        groceryList[index][field] = newValue;

        this.setState({groceryList: groceryList});
    }

    removeFood = (index) => {
        /**
         * Remove an item from shopping list
         */
        console.log(`Removing item #${index}`);
        let groceryList = this.state.groceryList;
        groceryList.splice(index, 1);
        console.log(`New list: ${groceryList[0]}`);

        this.setState({groceryList: groceryList});
    }

    render() {
        let list = this.state.groceryList.map((food, index) =>
            <GroceryListItem
                key={index}
                ingredient={food["ingredient"]}
                quantity={food["quantity"]}
                unit={food["unit"]}
                update={(field, newValue) => this.updateFood(index, field, newValue)}
                remove={() => this.removeFood(index)}
                search={() => this.props.search(this.state.groceryList)}
                classes={this.props.classes}
            />);

        let showBorder = null;
        if (this.props.hasSearched) showBorder = '1px solid #ffdbec';
        // TODO: Move in-line styling out
        return (
            <Box id="groceryList" border={showBorder} className={this.props.classes.box}>
                <Grid container className={this.props.classes.root}>
                    {this.props.hasSearched &&
                    <Grid item xs={12} className={this.props.classes.title}>
                        <h2>Your List</h2>
                    </Grid>}
                    <Grid item xs={12} sm={10} className={this.props.classes.inputGrid}>
                        <TextField
                            id="searchBox"
                            variant="outlined"
                            className={this.props.classes.textField}
                            onChange={this.updateQuery}
                            onKeyPress={this.handleKeyPress}
                            value={this.state.currentQuery}
                            size='small'
                            placeholder='Try "Tofu" or "2 lbs of chicken breast"'
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button className={this.props.classes.button}
                                variant="contained"
                                onClick={this.addFood}>Add</Button>
                    </Grid>
                {/*</div>*/}
                {/*<ColumnNames />*/}
                    <form style={{width: '100%'}}>
                        <List>
                            {list}
                        </List>
                    </form>
                </Grid>
                {this.state.groceryList.length > 0 &&
                <Button className={this.props.classes.button}
                        variant="contained"
                        onClick={() => this.props.search(this.state.groceryList)}>Search</Button>}
            </Box>
        );
    }
}

function ColumnNames() {
    return (<div id="columnNames">
        <span className="ingredientBox">Ingredient</span>
        <span className="quantityBox">Quantity</span>
        <span className="unitBox">Unit</span>
    </div>)
}

class GroceryListItem extends Component{
    handleChange = event => {
        if (event.target.id.includes("_ingredient")) {
            this.setState({ingredient: event.target.value});
            this.props.update("ingredient", event.target.value);
        }
        else if (event.target.id.includes("_quantity")) {
            this.setState({quantity: event.target.value});
            this.props.update("quantity", event.target.value);
        } else {
            this.setState({unit: event.target.value});
            this.props.update("unit", event.target.value);
        }
    }

    handleKeyPress = event => {
        /**
         * React to key presses
         */
        if (event.key === 'Enter') {
            this.props.search();
        }
    }

    render() {
        return (
            <ListItem className={this.props.classes.row}>
                <Grid item xs={12} sm={5} className={this.props.classes.inputGrid}>
                    <TextField
                        variant="outlined"
                        className={this.props.classes.textField}
                        id={`${this.props.ingredient}_ingredient`}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
                        value={this.props.ingredient}
                        size='small'
                        // style={{float: "left", clear: 'both'}}
                    />
                </Grid>
                <Grid item xs={4} sm={2} className={this.props.classes.inputGrid}>
                    <TextField
                        variant="outlined"
                        className={this.props.classes.textField}
                        id={`${this.props.name}_quantity`}
                        type={'number'}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
                        value={this.props.quantity}
                        size='small'
                        // style={{float: "left", clear: 'both'}}
                    />
                </Grid>
                <Grid item xs={6} sm={3} className={this.props.classes.inputGrid}>
                    <TextField
                        variant="outlined"
                        className={this.props.classes.textField}
                        id={`${this.props.name}_unit`}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
                        value={this.props.unit}
                        size='small'
                        // style={{float: "left", clear: 'both'}}
                    />
                </Grid>
                <Grid item xs={2} sm={2}>
                    <IconButton
                        style={{width: '100%'}}
                        aria-label="delete"
                        size="small"
                        onClick={this.props.remove}>
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </ListItem>
        );
    }
}

export default withStyles(styles)(GroceryList);