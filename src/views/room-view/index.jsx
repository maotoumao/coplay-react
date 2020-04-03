import React, {useContext, useState} from 'react';
import {Card, Avatar, Input, List, Button, Divider, notification} from 'antd';
import {
    UsergroupAddOutlined,
    SyncOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    UsergroupDeleteOutlined,
    CopyOutlined
} from '@ant-design/icons';

import {Context} from '../../state/context';
import socket from '../../websocket';

const {ipcRenderer, remote, clipboard} = window.require('electron');

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '20vw',
        borderRight: '1px solid gray'
    },
    list: {
        overflowY: 'auto',
        flex: 'auto',
        marginBottom: '0.3rem'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-evenly',
        margin: '0.3rem 0'
    },
    divider: {
        margin: '0.2rem 0'
    },
    header: {
        margin: '0.2rem 0.5rem',
    }
};

function RoomView() {
    const [friendsList, setFriendsList] = useState([]);


    const context = useContext(Context);
    // 基本函数
    const sendErrorMessage = (message) => {
        notification.error({
            message: message,
            placement: "bottomLeft",
            style: {
                width: '15vw'
            }
        });
    };

    // ipcRenderer事件监听
    ipcRenderer.on('fail-to-find-video', () => {
        // 不知道为什么会跳两个
        sendErrorMessage('当前页面没找到视频');
    });

    ipcRenderer.on('fail-to-execute-javascript', () => {
        sendErrorMessage('javascript脚本执行错误');
    });

    // socket事件监听, 服务器传来的请求
    // 服务器连接失败
    socket.on('disconnect', function () {
        remote.dialog.showErrorBox('网络错误', '连接已断开，请重新进入');
    });
    // 服务器端控制
    // 好友断开连接
    socket.on('friend-disconnect', function (data) {
        console.log(data);
        let friend = data.friend;
        if (friend) {
            // 把剩下的留下来
            setFriendsList(friendsList.filter(f => f !== friend));
        }
    });

    // 服务器端推送URL
    socket.on('server-sync-url', function (data) {
        ipcRenderer.send('change-url', {
            url: data.url
        });
    });

    // 服务器端同步播放进度
    socket.on('server-sync-video', function (data) {
        ipcRenderer.send('set-current-time', {
            currentTime: data.currentTime,
        })
    });

    // 服务器推送播放
    socket.on('server-play-video', function () {
        ipcRenderer.send('play-video');
    });

    // 服务器推送暂停
    socket.on('server-pause-video', function () {
        ipcRenderer.send('pause-video');
    });

    // 服务器推送新好友
    socket.on('server-friend-update', function (data) {
        setFriendsList([...friendsList, data.newFriend]);
    });

    // 服务器推送新群组
    socket.on('server-group-update', function (data) {
        setFriendsList(data.group.filter(p => p !== context.state.userName));
    });


    // 按钮事件
    // 好友相关
    // 加好友
    const onAddFriendClick = (name) => {
        let userName = context.state.userName;
        if (userName === name) {
            sendErrorMessage('不可以添加自己为好友');
            return;
        }
        // 添加名字为name的好友
        socket.emit('add-friend', {
            userName: context.state.userName,
            friendName: name
        }, function (data) {
            if (data.status === 'success') {
                setFriendsList([...friendsList, name]);
            } else if (data.status === 'success-with-group') {
                setFriendsList(data.group.filter(p => p !== userName));
            } else if (data.status === 'not-exist') {
                sendErrorMessage('好友不存在');
            } else if (data.status === 'conflict') {
                sendErrorMessage('不在同一群组，请退出当前所在群组');
            }

        });
    };
    // 退出群组
    const onExitGroupClick = () => {
        // 向服务器发出退群请求
        socket.emit('exit-group', {
            userName: context.state.userName
        }, function (successFlag) {
            if (successFlag) {
                // 退出群组
                setFriendsList([]);
            }
        });

    };

    // 修改url
    const onChangeUrlClick = (url) => {
        try {
            // 如果新建不成功那么会抛出异常
            new URL(url);
            ipcRenderer.send('change-url', {
                url: url
            });
            socket.emit('sync-url', {
                userName: context.state.userName,
                url: url,
            })
        } catch (e) {
            sendErrorMessage('链接有误')
        }
    };

    // 手动同步URL
    const onBtnSyncURLClick = () => {
        let url = ipcRenderer.sendSync('get-url');
        if (url) {
            socket.emit('sync-url', {
                userName: context.state.userName,
                url: url,
            })
        }
    }

    // 播放相关的按钮
    // 同步
    const onBtnSyncClick = () => {
        // 获取当前播放进度
        let currentTime = ipcRenderer.sendSync('get-current-time');
        if (currentTime !== void 0) {
            // 向服务器端发送同步请求
            socket.emit('sync-video', {
                userName: context.state.userName,
                currentTime: currentTime
            })
        }

    };

    // 播放
    const onBtnPlayClick = () => {
        // 给ipcMain发送播放请求
        ipcRenderer.send('play-video');
        // 给服务器发送播放请求
        socket.emit('play-video', {
            userName: context.state.userName
        });
    };

    // 暂停
    const onBtnPauseClick = () => {
        ipcRenderer.send('pause-video');
        socket.emit('pause-video', {
            userName: context.state.userName
        })
    };

    return (
        <div style={styles.wrapper}>
            {/*标题卡片*/}
            <div className={'header'}>
                <Card>
                    <Card.Meta
                        avatar={
                            <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>
                        }
                        title={<>
                            {context.state.userName}
                            <CopyOutlined style={{marginLeft: '1vw'}} onClick={() => {
                                clipboard.writeText(context.state.userName);
                            }}/>
                        </>}
                        description="这里应该可以写一行字"
                    />
                </Card>
                <Input.Search placeholder="添加好友" onSearch={onAddFriendClick} enterButton={<UsergroupAddOutlined/>}/>
            </div>
            <Divider style={styles.divider}/>

            {/*好友列表*/}
            <div style={{display: 'flex'}}>
                <span style={{...styles.header, flex: 'auto'}}>好友列表</span>
                <Button type="danger" icon={<UsergroupDeleteOutlined/>} shape="round"
                        size={"small"} onClick={onExitGroupClick}>退出群组</Button>
            </div>

            <List
                style={styles.list}
                itemLayout={"horizontal"}
                dataSource={friendsList}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta title={item} avatar={<Avatar
                            src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}/>
                    </List.Item>
                )}
            >

            </List>

            {/*网页*/}
            <Divider style={styles.divider}/>
            <div style={{display: 'flex'}}>
                <span style={{...styles.header, flex: 'auto'}}>网页控制</span>
                <Button type="primary" icon={<SyncOutlined/>} shape="round"
                        size={"small"} onClick={onBtnSyncURLClick}>同步链接</Button>
            </div>
            <Input.Search placeholder={'输入要跳转的网页吧'} onSearch={onChangeUrlClick} enterButton/>
            {/*播放控制*/}
            <Divider style={styles.divider}/>
            <span style={styles.header}>播放控制</span>

            <div style={styles.buttonGroup}>
                <Button type="primary" icon={<SyncOutlined/>} shape="round" onClick={onBtnSyncClick}>同步</Button>
                <Button type="primary" icon={<PlayCircleOutlined/>} shape="round" onClick={onBtnPlayClick}>播放</Button>
                <Button type="primary" icon={<PauseCircleOutlined/>} shape="round" onClick={onBtnPauseClick}>暂停</Button>
            </div>
        </div>
    );
}

export default RoomView;
