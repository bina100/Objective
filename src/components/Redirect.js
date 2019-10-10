import React from 'react';
import express from 'express'
import { BrowserRouter as Router, Switch, Link } from 'react-router-dom';
import Route from 'react-router-dom/Route';
import './App.css';
//import Home from './components/MyComponent/Home.jsx';
//import About from './components/MyComponent/About.jsx';



class Redirect extends React.Component {

    render () {
        return (
           <div>
                <h1>Hello Student</h1>
           </div>
        )
      }
    }
export default Redirect;