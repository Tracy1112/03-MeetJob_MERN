import { createSlice } from '@reduxjs/toolkit'

const getUserFromLocalStorage = () => {
  return JSON.parse(localStorage.getItem('user')) || null
}

const getInitialTheme = () => {
  return localStorage.getItem('darkTheme') === 'true'
}

const initialState = {
  user: getUserFromLocalStorage(),
  showSidebar: false,
  isDarkTheme: getInitialTheme(),
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.showSidebar = !state.showSidebar
    },
    logoutUser: (state) => {
      state.user = null
      localStorage.removeItem('user')
    },
    loginUser: (state, action) => {
      const user = { ...action.payload.user, token: action.payload.jwt }
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    toggleDarkTheme: (state) => {
      state.isDarkTheme = !state.isDarkTheme
      document.body.classList.toggle('dark-theme', state.isDarkTheme)
      localStorage.setItem('darkTheme', state.isDarkTheme)
    },
  },
})

export const { toggleSidebar, logoutUser, loginUser, toggleDarkTheme } =
  dashboardSlice.actions
export default dashboardSlice.reducer
