import React, { Component } from 'react';


const Context = React.createContext<client.Contacts | null>(null);

class Provider extends Component<client.ProviderProps, client.Contacts> {
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
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

export const Consumer = Context.Consumer;
export default Provider;