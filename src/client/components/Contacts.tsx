import React, { Component } from 'react';
import * as css from "./css/contacts.module.css";
import Contact from './Contact';

export default class Contacts extends Component<{}, client.Contacts> {
  state: client.Contacts = {
    contacts: [
      {
        id: "0",
        name: "John Doe",
        email: "jd@example.com",
        phone: "0123456789",
      },
      {
        id: "1",
        name: "Joe Todd",
        email: "jt@example.com",
        phone: "0123456789",
        hobby: "Swimming",
      },
      {
        id: "2",
        name: "Julia Benner",
        email: "jb@example.com",
        phone: "0123456789",
        hobby: "Running",
      }
    ]
  }

  render() {
    const { contacts } = this.state;

    return (
      <div className={css.contacts}>
        {contacts.map(contact => (<Contact key={contact.id} contact={contact} />))}
      </div>
    )
  }
}
