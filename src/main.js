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

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import Messages from './Messages';
import { Grid, Card, Input, Button, Segment, Message, Header, Icon } from 'semantic-ui-react';

const util = require('util');

var messageCounter = 1;

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as posting messages to the Watson Assistant service.
 */
class Main extends React.Component {



  constructor(...props) {
    super(...props);
    const {
      error,
    } = this.props;

    // change in state fires re-render of components

    let text = '';
    // eslint-disable-next-line react/prop-types
    if (this.props.ctx) {
      // eslint-disable-next-line react/prop-types
      if (this.props.ctx == 'res_amm') {
        text = 'Benvenuto in Responsabilità Amministrativa!';
      }
      // eslint-disable-next-line react/prop-types
      if (this.props.ctx == 'fon_eur') {
        text = 'Benvenuto in Fondi Europei!';
      }
    } else {
      text = 'Benvenuto in Legal chatbot!';
    }



    this.state = {
      error: error,
      // assistant datas
      context: {},
      userInput: '',
      conversation: [
        {
          id: 1,
          text: text,
          owner: 'legal'
        }]
    };
  }

  /**
   * sendMessage - build the message that will be passed to the 
   * Assistant service.
   */
  sendMessage(text) {
    var { context, conversation } = this.state;
    console.log('context: ' + JSON.stringify(context, null, 2));

    this.setState({
      context: context
    });

    // send request
    fetch('/api/message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: context,
        message: text
      })
    }).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    }).then(json => {
      console.log('+++ ASSISTANT RESULTS +++' + JSON.stringify(json, null, 2));
      const result = json.result.output.generic[0];
      const ent = json.result.output.entities[0];
      const int = json.result.output.intents[0];

      let text = null;//JSON.parse(result.text).results[0].text;
      //console.log(pippo.results[0].text);

      // returned text from assistant will either be a pre-canned 
      // dialog response, or Discovery Search result
      if (result && result.response_type === 'text') {

        if (IsJsonString(result.text)) {
          let json = JSON.parse(result.text);
          if (json.results.length > 0) {
            text = json.results[0].text;
          } else {
            text = 'Non ho trovato risultati. Prova a riformulare la tua domanda!';
          }

        } else {
          text = result.text;
        }

        console.log(text);
        // normal dialog response from Assistant
        // add to message list
        messageCounter += 1;
        conversation.push({
          id: messageCounter,
          text: text,
          owner: 'watson'
        });
      } else if (result && result.response_type === 'search') {
        console.log('GOT DISCO OUTPUT!');
        // got response from Assistant search skill
        // add a header to our message
        messageCounter += 1;
        conversation.push({
          id: messageCounter,
          text: result.header,
          owner: 'watson'
        });

        // find the result with the highest confidence
        let message;
        let score = 0;
        for (var i = 0; i < result.results.length; i++) {
          if (result.results[i].result_metadata.confidence > score) {
            score = result.results[i].result_metadata.confidence;
            message = result.results[i].body;
          }
        }
        if (result && result.results.length > 0) {
          messageCounter += 1;
          conversation.push({
            id: messageCounter,
            text: message,
            owner: 'watson'
          });
        }
      } else if (result && result.response_type === 'option') {
        //console.log(result.options)
        //text = result.title
        messageCounter += 1;
        conversation.push({
          id: messageCounter,
          text: result.title,
          owner: 'watson'
        });

      }
      else {

        if(ent && ent.entity === 'ambito' && int && int.intent === 'redirect'){
          if(ent.value === 'responsabilità amministrativa'){
            text = 'Reindirizzamento all\'ambito responsabilità amministrativa';
          } else if (ent.value === 'fondi europei'){
            text = 'Reindirizzamento all\'ambito fondi europei';
          }
          
          messageCounter += 1;
          conversation.push({
            id: messageCounter,
            text,
            owner: 'watson'
          });

        } else {
          messageCounter += 1;
          conversation.push({
            id: messageCounter,
            text: 'Non ho capito. Ripeti la domanda! Puoi scegliere tra i seguenti ambiti legali: Responsabilità Ammnistrativa o Fondi Europei',
            owner: 'watson'
          });
        }
      }
      
      

      switch (text) {
      case 'Reindirizzamento all\'ambito responsabilità amministrativa':
        sleep(2000).then(() => {
          window.location.replace('../respamm'); 
        });
        break;
      case 'Ok! Ti reindirizzo alla schermata principale': 
        sleep(2000).then(() => {
          window.location.replace('../index');
        });
        break;
      case 'Reindirizzamento all\'ambito fondi europei':
        sleep(2000).then(() => {
          window.location.replace('../fondeur');
        });
        break;
      default:
        break;
      }

      /*if (text == 'Reindirizzamento all\'ambito responsabilità amministrativa') {
        // redirect fondi europei
        //const a = 1;
        sleep(2000).then(() => {
          window.location.replace('http://localhost:3000/respamm');
        });
      } else if (text == 'Ok! Ti reindirizzo alla schermata principale') {
        sleep(2000).then(() => {
          window.location.replace('http://localhost:3000/index');
        });
      }*/

      this.setState({
        conversation: conversation,
        context: json.context,
        error: null,
        userInput: ''
      });

      scrollToMain();

    }).catch(response => {
      console.log('ERROR in fetch: ' + JSON.stringify(response, null, 2));
      this.setState({
        error: 'Error in assistant'
      });
      // eslint-disable-next-line no-console
      console.error(response);
    });
  }

  /**
   * Log Watson Assistant context values, so we can follow along with its logic. 
   */
  printContext(context) {
    if (context.system) {
      if (context.system.dialog_stack) {
        console.log('Dialog Stack:');
        console.log(util.inspect(context, false, null));
      }
    }
  }

  /**
   * Display each key stroke in the UI. 
   */
  handleOnChange(event) {
    this.setState({ userInput: event.target.value });
  }

  /**
   * Send user message to Assistant. 
   */
  handleKeyPress(event) {
    const { userInput, conversation } = this.state;

    if (event.key === 'Enter') {
      messageCounter += 1;
      conversation.push(
        {
          id: messageCounter,
          text: userInput,
          owner: 'user'
        }
      );

      console.log('handleKeyPress1');
      this.sendMessage(userInput);
      console.log('handleKeyPress2');
      this.setState({
        conversation: conversation,
        // clear out input field
        userInput: ''
      });

    }
  }

  /**
   * Get list of conversation message to display. 
   */
  getListItems() {
    const { conversation } = this.state;

    return (
      <Messages
        messages={conversation}
      />
    );
  }

  /**
   * render - return all the home page objects to be rendered.
   */
  render() {
    const { userInput } = this.state;

    const items = [
      'Di cosa tratta la responsabilità amministrativa',
      'Portami su responsabilità amministrativa',
      'Mostrami l\'elenco degli ambiti',
    ];

    const itemsRa = [
      'Qual è il termine entro cui devono concludersi i procedimenti amministrativi di competenza delle amministrazioni statali e degli enti pubblici nazionali?',
    ];

    const itemsFE = [
      'Quali sono i compiti del FESR',
      'Qual è l\'abito di applicazione del sostegno a titolo del FEST?'
    ];

    // eslint-disable-next-line react/prop-types
    if (this.props.ctx != undefined && this.props.ctx == 'res_amm') {
      return (
        <Grid divided='vertically' className='search-grid'>
          <Grid.Row columns={1}>
            <Grid.Column>
              <div>
                <Header as='h2' icon textAlign='center'>
                  <Icon name='chat' circular />
                  <Header.Content>Benvenuto nella sezione Responsabilità Amministrativa</Header.Content>
                </Header>
                <Message>
                  <Message.Header as='h3'>Utilizza la chat in basso per interagire con l&apos;assistente. Puoi chiedergli per esempio: </Message.Header>
                  <Message.List items={itemsRa} />
                </Message>
              </div>

            </Grid.Column>
            <Grid.Column >
              <Message>
                <Message.Header as='h3'>Reindirizzamento Rapido</Message.Header>
                <p>Puoi usare i pulsanti per effettuare un reindirizzamento rapido agli altri ambiti legali o al Legal Chatbot!</p>
                <Button basic color='blue' onClick={() => (window.location.href = '/index')} >
                  Legal Chatbot
                </Button>
                <Button basic color='green' onClick={() => (window.location.href = '/fondeur')}>
                  Fondi Europei
                </Button>
              </Message>

            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column width={16}>

              <Card className='chatbot-container'>
                <Card.Content className='dialog-header'>

                  <Card.Header>Responsabilità Amministrativa Chatbot</Card.Header>

                </Card.Content>
                <Card.Content>
                  {this.getListItems()}
                </Card.Content>
                <Input
                  icon='compose'
                  iconPosition='left'
                  value={userInput}
                  placeholder='Scrivi qui......'
                  onKeyPress={this.handleKeyPress.bind(this)}
                  onChange={this.handleOnChange.bind(this)}
                />
              </Card>

            </Grid.Column>
          </Grid.Row>

        </Grid>
      );
    // eslint-disable-next-line react/prop-types
    } else if (this.props.ctx != undefined && this.props.ctx == 'fon_eur') {
      return (
        <Grid divided='vertically' className='search-grid'>
          <Grid.Row columns={1}>
            <Grid.Column>
              <div>
                <Header as='h2' icon textAlign='center'>
                  <Icon name='chat' circular />
                  <Header.Content>Benvenuto nella sezione Fondi Europei</Header.Content>
                </Header>
                <Message>
                  <Message.Header as='h3'>Utilizza la chat in basso per interagire con l&apos;assistente. Puoi chiedergli per esempio: </Message.Header>
                  <Message.List items={itemsFE} />
                </Message>
              </div>

            </Grid.Column>
            <Grid.Column >
              <Message>
                <Message.Header as='h3'>Reindirizzamento Rapido</Message.Header>
                <p>Puoi usare i pulsanti per effettuare un reindirizzamento rapido agli altri ambiti legali o al Legal Chatbot!</p>
                <Button basic color='blue' onClick={() => (window.location.href = '/index')} >
                  Legal Chatbot
                </Button>
                <Button basic color='green' onClick={() => (window.location.href = '/respamm')}>
                  Responsabilità Amministrativa
                </Button>
              </Message>

            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column width={16}>

              <Card className='chatbot-container'>
                <Card.Content className='dialog-header'>

                  <Card.Header>Fondi Europei Chatbot</Card.Header>

                </Card.Content>
                <Card.Content>
                  {this.getListItems()}
                </Card.Content>
                <Input
                  icon='compose'
                  iconPosition='left'
                  value={userInput}
                  placeholder='Scrivi qui......'
                  onKeyPress={this.handleKeyPress.bind(this)}
                  onChange={this.handleOnChange.bind(this)}
                />
              </Card>

            </Grid.Column>
          </Grid.Row>

        </Grid>
      );
    } 
    else {
      return (
        <Grid divided='vertically' className='search-grid'>
          <Grid.Row columns={1}>
            <Grid.Column>
              <div>
                <Header as='h2' icon textAlign='center'>
                  <Icon name='chat' circular />
                  <Header.Content>Benvenuto in Legal Chatbot</Header.Content>
                </Header>
                <Message>
                  <Message.Header as='h3'>Utilizza la chat in basso per interagire con l&apos;assistente legale. Puoi chiedergli ad esempio: </Message.Header>
                  <Message.List items={items} />
                </Message>
              </div>

            </Grid.Column>
            <Grid.Column >
              <Message>
                <Message.Header as='h3'>Reindirizzamento Rapido</Message.Header>
                <p>Puoi usare i pulsanti per effettuare un reindirizzamento rapido agli ambiti legali a disposizione!</p>
                <Button basic color='blue' onClick={() => (window.location.href = '/respamm')} >
                  Responsabilità Amministrativa
                </Button>
                <Button basic color='green'onClick={() => (window.location.href = '/fondeur')}  >
                  Fondi Europei
                </Button>
              </Message>

            </Grid.Column>
          </Grid.Row>
          <Grid.Row columns={1} width={16} centered className='matches-grid-row'>
            <Grid.Column>
              <Segment>

                <Card className='chatbot-container' centered>
                  <Card.Content className='dialog-header'>

                    <Card.Header>Legal Chatbot</Card.Header>

                  </Card.Content>
                  <Card.Content>
                    {this.getListItems()}
                  </Card.Content>
                  <Input
                    icon='compose'
                    iconPosition='left'
                    value={userInput}
                    placeholder='Scrivi qui......'
                    onKeyPress={this.handleKeyPress.bind(this)}
                    onChange={this.handleOnChange.bind(this)}
                  />
                </Card>
              </Segment>
            </Grid.Column>
          </Grid.Row>

        </Grid>
      );
    }


  }
}

/**
 * scrollToMain - scroll window to show 'main' rendered object.
 */
function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

// type check to ensure we are called correctly
Main.propTypes = {
  context: PropTypes.object,
  userInput: PropTypes.string,
  conversation: PropTypes.array,
  error: PropTypes.object
};

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}


function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


module.exports = Main;