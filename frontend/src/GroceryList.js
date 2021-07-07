import React, {Component} from "react";
import  "regenerator-runtime";

import { Collapse } from '@material-ui/core';
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
    },
    errorPopup: {
        border: '0',
        right: '0',
        margin: '5px',
        backgroundColor: '#ef0000',
        color: '#ffdbec',
        '&:hover': {
            backgroundColor: '#b00035',
            color: '#ffbdd9'
        },
    }
}

class GroceryList extends Component {
    /**
     * React class component for the form that users interact with to input their grocery lists
     *
     * @param   {Object}    props.classes           Style of the component
     * @param   {function}  props.search            Callback function for making API calls to get results for the grocery list, of signature (array<Object>) => ()
     * @param   {boolean}   props.hasSearched       Flag indicating whether a search has happened
     * @param   {Object}    props.requestForUpdate  Request from the Recommendation component to update the grocery list,
     *                                              of signature {"food": String, "field": String, "newValue": T}
     */
    constructor(props) {
        super(props);
        this.state = {groceryList: [], currentQuery: "", hasSearchError:false, searchErrorMessage : "defaultErrorMessage"};
    }

    componentDidUpdate(prevProps) {
        /**
         * React lifecycle method.
         * Updates grocery list when a recommendation is applied by user.
         *
         * @param   {Object}  prevProps  Props from last time componentDidMount or componentDidUpdate was called
         */
        if (this.props.requestForUpdate !== prevProps.requestForUpdate) {
            let request = this.props.requestForUpdate;

            // Identify the index of the food to be updated
            let index = this.foodToIndex(request['food']);

            // If the requested food is not found, stop
            // TODO: error handling
            if (index === -1) return;

            // Otherwise, update the grocery list and re-search to refresh the results
            this.updateFood(index, request['field'], request['newValue']);
            this.props.search(this.state.groceryList);
        }
    }

    foodToIndex = (food) => {
        /**
         * Look up the index of a food item
         *
         * @param    {String}  food  Name of the food
         *
         * @return   {int}     Index of the food in this.state.groceryList
         */
        let list = this.state.groceryList.map((item) => item['ingredient']);
        return list.indexOf(food);
    }

    updateQuery = event => {
        /**
         * Update state of GroceryList to store current user input as foodQuery
         *
         * @param   {KeyboardEvent}  event  User keyboard entry
         */
        this.setState({currentQuery: event.target.value});
    }

    handleKeyPress = event => {
        /**
         * Add a food to the Submit the search when an item is highlighted and user hits "enter"
         *
         * @param   {KeyboardEvent}  event  User key press
         */
        if (this.state.hasSearchError) {
            this.setState({hasSearchError : false})
        }   
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
         * Parse user input, find default quantity and unit if needed, and add to grocery list
         */
        // Stop here if there's no query
        if (this.state.currentQuery === "") {
            return
        }

        // Default error message to show if something in search goes wrong.
        let errorMessage = "Something went wrong. Adding food was unsuccessful."

        // Parse user query
        let parsed = await fetch(`${NATIVE_API_ADDRESS}/parse/?query=${this.state.currentQuery}`)
            .then(response => response.json());

        // Find default quantity of food item in gram
        let default_grams = await fetch(`${GHGI_API_ADDRESS}/rateCarbon`,
            {method: 'POST',
                // headers: {'Content-Type': 'test/plain', 'Origin':'localhost'},
                body: JSON.stringify({'recipe': [this.state.currentQuery]})})
            .then(response => {
                return response.json();
            })
            .then(json => {
                if (!('items' in json)) {
                    // Either POST: 404 (ie. status not ok) or GHGI returned a json in unreadable format.
                    errorMessage = json.ok ? "Wasn't able to find " + parsed['names'][0] + " in GHGI database. Please check your spelling." : 
                    "Wasn't able to connect to the GHGI database. Please try again later.";
                } else {
                    return json['items'][0]['g'];
                }
            });

        if (!default_grams) {
            // Set food search error message for user and stop here if couldn't find food in GHGI database.
            // TODO: use better condition than !default_grams to detect if something in search went wrong?
            console.log("Something went wrong, default grams wasn't retrievable from GHGI.")
            this.showSearchError(errorMessage)
            return;
        }

        // Map default grams to different units and quantities based on pre-defined rules
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

        // Add food name, quantity, and unit to the grocery list
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
         *
         * @param   {int}     index  Index of the food item to be updated
         * @param   {String}  field  Field to be updated for the food item
         * @param   {T}       newValue  New value of the field
         */
        let groceryList = this.state.groceryList;
        groceryList[index][field] = newValue;

        this.setState({groceryList: groceryList});
    }

    removeFood = (index) => {
        /**
         * Remove an item from shopping list
         *
         * @param   {int}  index  Index of the food item to be removed from GroceryList
         */
        console.log(`Removing item #${index}`);
        let groceryList = this.state.groceryList;
        groceryList.splice(index, 1);
        console.log(`New list: ${groceryList[0]}`);

        this.setState({groceryList: groceryList});
    }

    showSearchError = (message) => {
        this.setState({searchErrorMessage : message})
        this.setState({hasSearchError : true})
    }

    render() {
        /**
         * React lifecycle method
         *
         * @return   {Box}  HTML element for the GroceryList component
         */
        // Create a list of grocery items
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

        // Determine look of the list (before search vs after search)
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
                                onClick={() => {this.setState({hasSearchError : false}); this.addFood()}}>Add</Button>
                    </Grid>
                {/*An error message if search for food fails.*/}
                <SearchError 
                    shown={this.state.hasSearchError}
                    message={this.state.searchErrorMessage}
                    classes={this.props.classes}
                    onClick = { () => {
                        this.setState({hasSearchError : false})
                    }}
                />
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

class SearchError extends Component {
    /**
    A dismissable error message that pops up if a search for particular food fails.
    *
    * @param   {Object}    props.classes     Style of the component
    * @param   {bool}  props.hidden      Whether message should be hidden or not.
    */
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Grid item xs={12} sm={12} >
                <Collapse in={this.props.shown}>
                    <Button className={this.props.classes.errorPopup}
                        variant="contained"
                        onClick={this.props.onClick} > 
                        {this.props.message}
                    </Button>
                </Collapse>
            </Grid>
        )
    }

}


class GroceryListItem extends Component{
    /**
     * Individual row in the GroceryList, containing the ingredient, quantity, and unit
     *
     * @param   {Object}    props.classes     Style of the component
     * @param   {String}    props.ingredient  Name of the food item
     * @param   {float}     props.quantity    Quantity of the food item
     * @param   {String}    props.unit        Unit of the food item
     * @param   {function}  props.update      Callback function to update the food item, of signature (String, T) => ()
     * @param   {function}  props.remove      Callback function to remove the food item from the grocery list, of signature () => ()
     * @param   {function}  props.search      Callback function to make API calls for getting climate impact of the grocery list, of signature () => ()
     */
    handleChange = event => {
        /**
         * Update state as the user edits grocery list item
         *
         * @param   {ChangeEvent<TextField>}  event  User's keyboard entry
         */
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
         * Submit the search when an item is highlighted and user hits "enter"
         *
         * @param   {KeyboardEvent}  event  User's key press
         */
        if (event.key === 'Enter') {
            this.props.search();
        }
    }

    render() {
        /**
         * React lifecycle method
         *
         * @return   {ListItem}  HTML element for the GroceryListItem component
         */
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
                        id={`${this.props.ingredient}_quantity`}
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
                        id={`${this.props.ingredient}_unit`}
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