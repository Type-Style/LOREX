import React, { Component } from 'react';
import * as css from "./css/contacts.module.css";
import { Consumer } from './context';
import Contact from './Contact';

export default class Contacts extends Component {


  render() {

    return (
      <Consumer>
        {value => {
          const { contacts } = value;
          return (
            <>
              <div className={css.contacts}>
                {contacts.map(contact => (<Contact key={contact.id} contact={contact} />))}
              </div>
            </>
          )
        }}
      </Consumer>
    )
  }
}
