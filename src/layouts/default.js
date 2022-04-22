/**
 * Copyright 2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React from 'react';
import PropTypes from 'prop-types';

class DefaultLayout extends React.Component {
  getDescription() {
    return (
      <div>
        <div>
          This is a web app to demonstrates how to query your own Watson Discovery Collection and display it in a variety of ways.
        </div>
      </div>
    );
  }

  render() {

    

    return (
      <html lang="en">
        <head>
          <title>LEGAL CHATBOT</title>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          <meta name="og:title" content="Legal Chatboti UI" />
          <meta name="og:description" content={this.props.description || 'Cerca usando Legal Chatboti UIx'} />
          <link rel="stylesheet" type="text/css" href="/css/application.css" />
          <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css" />
          <link rel="icon" type="image/x-icon" href="/images/favicon.ico" />
          <link rel="icon" href="data:," />
          <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"></link>

        </head>
        <body>
          <div className="w3-top">
            <div className="w3-bar w3-white w3-wide w3-padding w3-card">
              <a href="http://localhost:3000/index" className="w3-bar-item w3-button"><b>LEGAL</b> Chatbot</a>
            </div>
          </div>

          <div className="w3-content w3-padding" style={{'max-width':'1564px', 'marginTop': '100px'}}>
            <main>{this.props.children}</main>
          </div>
          <script
            type="text/javascript"
            id="bootstrap-data"
            dangerouslySetInnerHTML={{ __html: `window.__INITIAL_STATE__ = ${this.props.initialData};` }}
          ></script>
          <script type="text/javascript" src="/js/bundle.js" />
        </body>
      </html>
    );
  }
}

DefaultLayout.propTypes = {
  hideHeader: PropTypes.bool,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  initialData: PropTypes.string.isRequired
};

module.exports = DefaultLayout;