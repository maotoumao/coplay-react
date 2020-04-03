import React, {useReducer} from 'react';
import LoginView from './login-view';
import RoomView from './room-view';

import {reducer, defaultState, Context} from '../state/context';


const styles = {
    app: {
        minHeight: '100vh',
    }
};

function App() {
    const [state, dispatch] = useReducer(reducer, defaultState);
    return (
        <Context.Provider value={{state, dispatch}}>
            <div className="App" style={styles.app}>
                {
                    state.isLogin ? <RoomView/> : <LoginView/>
                }
            </div>
        </Context.Provider>

    );
}

export default App;
