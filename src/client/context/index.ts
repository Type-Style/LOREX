import { createContext } from "react";

export const Context = createContext<client.AppContext[]>([]);

export const ActionContext = createContext<client.ActionContext[]>([]);
