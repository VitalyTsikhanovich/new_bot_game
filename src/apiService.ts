
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8002/test';

export const getUserData = async (userId: number) => {
    try {
        const response = await axios.get(`${API_URL}/user_entry_check/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
};

export const updateUserExitData = async (userId: number, coins: number, energy: number) => {
    try {
        const response = await axios.post(`${API_URL}/user_exit/${userId}`, { coins, energy });
        return response.data;
    } catch (error) {
        console.error('Error updating user exit data:', error);
        throw error;
    }
};

// WebSocket functions
export const connectToCoinsWebSocket = (userId: number, onMessage: (data: any) => void) => {
    const socket = new WebSocket(`ws://127.0.0.1:8002/ws/coins_gain/${userId}/`);
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };
    return socket;
};

export const connectToEnergyWebSocket = (userId: number, onMessage: (data: any) => void) => {
    const socket = new WebSocket(`ws://127.0.0.1:8002/ws/energy_gain/${userId}/`);
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };
    return socket;
};
