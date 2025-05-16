import React, { createContext, useContext, useState } from 'react';

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  // Basic global state, will be expanded later
  const [globalState, setGlobalState] = useState({});

  // Functions to update global state will be added here

  return (
    <StateContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);

// This context will manage application-wide state,
// potentially including data fetched from the backend,
// user preferences not directly related to theme, etc.