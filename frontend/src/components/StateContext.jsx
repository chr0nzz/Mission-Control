import React, { createContext, useContext, useState } from 'react';

const StateContext = createContext(undefined);

export const StateProvider = ({ children }) => {
  // Define your state variables and functions here
  const [exampleState, setExampleState] = useState(null);

  const value = {
    exampleState,
    setExampleState,
    // Add other state and functions here
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
};