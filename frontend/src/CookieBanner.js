import React, {Component} from "react";
import CookieConsent, {getCookieConsentValue, Cookies} from "react-cookie-consent";  
import TagManager from 'react-gtm-module';

import {withStyles} from "@material-ui/core";

const styles = {
    root: {
    },
}

class CookieBanner extends Component {
    /**
     * React class component to get user consent via cookie banner.
     * @param   {Object}    props.classes           Style of the component
     */
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // Enable cookies if the user accepted on a previous visit.
        const isConsent = getCookieConsentValue();
        if (isConsent === "true") {
            this.handleAcceptCookie();
        }
    }

    handleAcceptCookie = () => {
        const tagManagerArgs = {
            gtmId: 'GTM-K6GPKTV',
            auth: process.env.GTM_AUTH,
            preview: process.env.GTM_PREVIEW
        };
        TagManager.initialize(tagManagerArgs);
    }

    handleDeclineCookie = () => {
        // Remove google analytics cookies if decline. TODO: check if this works, as GTM may work different.
        Cookies.remove("_ga");
        Cookies.remove("_gat");
        Cookies.remove("_gid");
        // TODO: better way of stopping GTM tracking than current setup (checking cookie consent before dataLayer push), 
        // which works across pages eg. can also set from privacy policy page? 
    }

    render() {
        // TODO: Advanced region-based consent, eg. automatically disable for residents in CA and EU until consent, but enable for rest of USA
        // https://developers.google.com/gtagjs/devguide/consent https://support.google.com/tagmanager/answer/10718549?hl=en 
        return (
            <CookieConsent
                // debug={true} 
                enableDeclineButton onAccept={this.handleAcceptCookie} 
                onDecline={this.handleDeclineCookie}
                buttonText="Accept"
                declineButtonText="Decline"
                declineButtonStyle={{backgroundColor: 'transparent', color: '#F2F2F2', borderRadius: '3px', border: '2px solid #F2F2F2'}}
                buttonStyle={{backgroundColor: '#F2F2F2', color: '#353535', borderRadius: '3px'}}
                >
                This website uses cookies to enhance the user experience.&nbsp;
                <a href="/policy/privacyPolicy.html" target="_blank" rel="noopener noreferrer">Learn more</a>.
            </CookieConsent>
        )
    }
}

export default withStyles(styles)(CookieBanner);
