import {createContext} from 'react';

export const defaultState = {
    // 是否登录状态
    isLogin: false,
    userName: '小猫咪'
};


export function reducer(state, action) {
    switch (action.type) {
        case 'SET_LOGIN':
            return {...state, isLogin: action.payload};
        case 'SET_USERNAME':
            return {...state, userName: action.payload};
    }
}

export const Context = createContext(null);
