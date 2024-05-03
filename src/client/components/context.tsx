import React, { Component } from 'react';

const Context = React.createContext<client.Contacts | null>(null);

const reducer = (state, action) => {
  switch (action.type) {
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(
          contact => contact.id !== action.payload
        )
      }
    default:
      return state
  }
}


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
    ],
    dispatch: (action) => {
      this.setState(state => reducer(state, action))
    }
  }

  async componentDidMount() {
    let response;

    try {
      response = await fetch('https://jsonplaceholder.typicode.com/users');
    } catch (error) {
      console.log('There was an error', error);
    }

    // Uses the 'optional chaining' operator
    if (response?.ok) {
      console.log('Use the response here!');
      const fetchedContacts = await response.json();
      const newContacts = this.state.contacts.concat(fetchedContacts);

      this.setState({...this.state, contacts: newContacts})
      
    } else {
      console.log(`HTTP Response Code: ${response?.status}`)
    }

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