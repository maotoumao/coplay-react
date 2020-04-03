import Config from '../config';
import io from 'socket.io-client';

const socket = io(Config.WEBSOCKET_PATH);
export default socket;
