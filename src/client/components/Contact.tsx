import React, { Component } from 'react';
import * as classes from "./css/contact.module.css";

export default class Contact extends Component<client.contact> {
  static defaultProps = {
    name: "no name",
    email: "no email",
    hobby: "no hobby"
  }
  render() {
    const {name, email, phone, hobby} = this.props;
    
    return (
      <div className={classes.contact}>
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

Contact