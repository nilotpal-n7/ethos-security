import React from 'react'
import Home from './Pages/Home.jsx'
import Login from './Pages/Login.jsx'
import { Routes , Route } from 'react-router-dom'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/login' element={<Login/>} /> 
      </Routes>
    </div>
  )
}

export default App

