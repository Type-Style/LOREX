import React, { Component } from 'react';
import * as css from "./css/contact.module.css";

export default class Contact extends Component<client.ContactProps> {
  static defaultProps = {
    contact: {
      name: "no name",
      email: "no email",
      hobby: "no hobby"      
    }
  }

  render() {
    let { name, email, phone, hobby } = this.props.contact;
    hobby = hobby || "no hobby";


    return (
      <div className={css.contact}>
        <h4>{name}</h4>
        <dl>
          <dt>Email:</dt><dd>{email}</dd>
          <dt>Phone:</dt><dd>{phone}</dd>
          <dt>Hobby:</dt><dd>{hobby}</dd>
        </dl>
      </div>
    )
  }
}
