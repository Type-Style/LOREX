import React, { Component } from 'react';
import * as css from "./css/contact.module.css";
import { Consumer } from './context';

export default class Contact extends Component<client.ContactProps> {
  state = {
    expanded: false
  }

  toggleDetails = () => {
    this.setState({
      expanded: !this.state.expanded
    });
  }

  deleteContact = (id, dispatch) => {
    dispatch({type: "DELETE_CONTACT", payload: id})
  }

  static defaultProps = {
    contact: {
      name: "no name",
      email: "no email",
      hobby: "no hobby"
    }
  }

  render() {
    let { id, name, email, phone, hobby } = this.props.contact;
    hobby = hobby || "no hobby";
    const { expanded } = this.state;


    return (
      <Consumer>
        {value => {
          const { dispatch } = value;
          return (
            <div className={css.contact}>
              <h4 onClick={this.toggleDetails}>{name}</h4>
              {expanded ? (<><dl>
                <dt>Email:</dt><dd>{email}</dd>
                <dt>Phone:</dt><dd>{phone}</dd>
                <dt>Hobby:</dt><dd>{hobby}</dd>
              </dl><button onClick={this.deleteContact.bind(this, id, dispatch)}>Delete</button></>

              ) : null}
            </div>
          )
        }}

      </Consumer>

    )
  }
}
