import React, {useContext} from 'react';
import {Input, Button, message} from 'antd';
import {UserOutlined} from '@ant-design/icons';

import {Context} from '../../state/context'
import Config from '../../config';
import socket from '../../websocket';

const {ipcRenderer} = window.require('electron');

const styles = {
    background: {
        backgroundImage: `url(${require('../../static/bkg.png')})`,
        backgroundSize: 'cover',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
    },
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        justifyContent: 'flex-end',
        marginLeft: '15%',
        marginRight: '15%',
    },
    item: {
        margin: '-5vh auto 15vh'
    }
};

function LoginView() {
    const inputRef = React.createRef();
    const context = useContext(Context);

    const onLoginBtnClick = () => {
        let userName = inputRef.current.state.value;
        let legal = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(userName);
        // 如果请求合法，发起请求
        if (userName && legal) {
            let postData = {
                userName: userName
            };
            fetch(Config.SERVER_LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            }).then(response => response.json())
                .then((data) => {
                    // 获得请求的内容
                    switch (data.code) {
                        case 200:
                            // 通知主进程切换窗口
                            ipcRenderer.send('login-success');
                            // 成功登录
                            // 设置登录状态
                            context.dispatch({
                                type: 'SET_LOGIN',
                                payload: true
                            });
                            // 设置当前用户名
                            context.dispatch({
                                type: 'SET_USERNAME',
                                payload: userName
                            });
                            // 向socket请求
                            socket.emit('login-message', {
                                userName: userName
                            });
                            break;
                        case 403:
                            // 服务器拒绝，因为有人用了
                            message.error('这个名字已经有人用啦，换个吧~');
                            break;
                    }
                }).catch(() => {
                message.error('网络异常啦');
            })
        } else {
            message.error("名字中只能包含数字、字母和中文哦");
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.background}></div>
            <div style={{alignSelf: 'center', marginBottom: '20vh', color: 'cornsilk', zIndex: '20', fontSize: '1.5rem'}}>
                这里不知道写啥
            </div>
            <Input ref={inputRef} prefix={<UserOutlined/>} placeholder={'输入一个名字吧'} maxLength={10} allowClear
                   onPressEnter={onLoginBtnClick} style={styles.item}/>
            <Button type={'primary'} block onClick={onLoginBtnClick} style={styles.item}>登录</Button>
        </div>
    );
}

export default LoginView;
