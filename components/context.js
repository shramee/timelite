import React, { useEffect } from "react";
import { useReducer, createContext } from "react";
import PropTypes from "prop-types";
import uuid from "uuid";
import { toast } from "react-toastify";
import localForage from "localforage";

import strings from "../l10n/context";

const initialState = {
  note: "",
  language: "en",
  timer: new Date(),
  log: [],
  logSelectedEntry: ""
};

const Context = createContext();

const reducer = (state, action) => {
  let newState = {};

  strings.setLanguage(state.language);

  switch (action.type) {
    case "LOCALDATA_READY":
      strings.setLanguage(action.localdata.language);
      toast.info(strings.loaded);
      return { ...action.localdata };
    case "SET_LANGUAGE":
      newState = {
        ...state,
        language: action.language
      };
      localForage.setItem("context", newState);
      return newState;
    case "NEW_TIMER":
      newState = {
        ...state,
        timer: new Date()
      };
      localForage.setItem("context", newState);
      return newState;
    case "NOTE_UPDATED":
      newState = {
        ...state,
        note: action.note
      };
      localForage.setItem("context", newState);
      return newState;
    case "ADD_LOG":
      newState = {
        ...state,
        timer: new Date(),
        log: [
          {
            id: uuid(),
            start: state.timer,
            end: new Date(),
            note: state.note,
            tags: state.note
              .split(" ")
              .filter(word => word.startsWith("#"))
              .map(word => {
                return word.toLowerCase();
              })
          },
          ...state.log
        ],
        note: ""
      };
      localForage.setItem("context", newState);
      toast.success(strings.addedEntry);
      return newState;
    case "EDIT_LOG":
      newState = {
        ...state,
        log: [
          ...state.log.map(entry => {
            return entry.id == action.entry.id ? action.entry : entry;
          })
        ]
      };
      localForage.setItem("context", newState);
      toast.success(strings.editedEntry);
      return newState;
    case "REMOVE_LOG":
      newState = {
        ...state,
        log: [...state.log.filter(entry => entry.id !== action.id)]
      };
      localForage.setItem("context", newState);
      toast.error(strings.deletedEntry);
      return newState;
    case "CLEAR_LOG":
      newState = {
        ...state,
        log: []
      };
      localForage.setItem("context", newState);
      toast.error(strings.resetLog);
      return newState;
    case "CLEAR_TAG":
      newState = {
        ...state,
        log: [...state.log.filter(entry => !entry.tags.includes(action.tag))]
      };
      localForage.setItem("context", newState);
      toast.error(strings.deletedEntry);
      return newState;
    case "NEXT_LOG_ITEM":
      console.log("next item context", state);
      if (state.log.length === 0) return;
    //  console.log("TCL: reducer -> state.log.length", state.log.length);
      console.log(
        "TCL: reducer -> state.logSelectedEntry",
        state.logSelectedEntry, (state.logSelectedEntry)? "true":""
      );
      if (!state.logSelectedEntry) {
        console.log("logSelectedEntry updating",state.logSelectedEntry)
        newState = { ...state, logSelectedEntry: state.log[0].id };
      } else {
        console.log("ok");
        console.log(state.log.find((o, i) => {
          if (o.id == state.logSelectedEntry) return console.log(i)
        }
        ) )
      }
      console.log("TCL: reducer -> newState", newState.logSelectedEntry);
      localForage.setItem("context", newState);
      return state;

    default:
      return state;
  }
};

const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };

  useEffect(() => {
    localForage
      .getItem("context")
      .then(value => {
        if (value !== null)
          dispatch({ type: "LOCALDATA_READY", localdata: value });
      })
      // FIXME: localForage will error with SSR rendering, what do if anything?
      .catch(() => {});
  }, []);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContextProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ])
};

const ContextConsumer = Context.Consumer;

export { Context, ContextProvider, ContextConsumer };
