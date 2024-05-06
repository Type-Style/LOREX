/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "*.module.css";
declare namespace client {
  interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    hobby?: string;
  }

  interface ContactProps {
    contact: Contact;
  }

  interface Contacts {
    contacts: Contact[];
    dispatch?: (state: Contacts, action: string) => void;
  }

  interface ProviderProps {
    children?: React.ReactNode;
  }
}


