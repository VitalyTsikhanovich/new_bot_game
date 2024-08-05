import React, {useState, useEffect, useCallback, useRef, FC} from 'react';
import {useSDK} from '@tma.js/sdk-react';
import './Game.scss';
import {getUserData, updateUserExitData, connectToCoinsWebSocket, connectToEnergyWebSocket} from '../apiService';

const MAX_ENERGY = 10;
const ENERGY_REGEN_RATE = 1000; // 1 секунда
const AUTOFARM_RATE = 1000; // 1 секунда

interface FloatingNumber {
    id: number;
    value: number;
    x: number;
    y: number;
}

interface WebAppType {
    HapticFeedback: {
        impactOccurred: (style: string) => void;
    };
}

export const Game: FC = () => {
    const userId = 1; // пример user_id
    const sdk = useSDK();
    const WebApp = (sdk as any).WebApp as WebAppType | undefined;
    const [balance, setBalance] = useState(0);
    const [energy, setEnergy] = useState(MAX_ENERGY);
    const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const [isAutofarmActive, setIsAutofarmActive] = useState(false);
    const touchCount = useRef(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const nextFloatingNumberId = useRef(0);

    const handleFruitClick = useCallback((count: number, x: number, y: number) => {
        if (energy >= count) {
            setBalance((prevBalance) => prevBalance + count);
            setEnergy((prevEnergy) => prevEnergy - count);

            setFloatingNumbers(prev => [...prev, {
                id: nextFloatingNumberId.current++,
                value: count,
                x,
                y
            }]);

            WebApp?.HapticFeedback.impactOccurred('light');
        }
    }, [energy, WebApp]);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        e.preventDefault();
        touchCount.current = e.touches.length;
        setIsPressed(true);
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        e.preventDefault();
        if (touchCount.current > 0 && touchCount.current <= 3) {
            const touch = e.changedTouches[0];
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) {
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                handleFruitClick(touchCount.current, x, y);
            }
        }
        touchCount.current = 0;
        setIsPressed(false);
    }, [handleFruitClick]);

    const toggleAutofarm = () => {
        setIsAutofarmActive(prev => !prev);
    };

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const data = await getUserData(userId);
                setBalance(data.coins);
                setEnergy(data.energy);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();

        const coinsSocket = connectToCoinsWebSocket(userId, (data) => setBalance(data.coins));
        const energySocket = connectToEnergyWebSocket(userId, (data) => setEnergy(data.energy));

        return () => {
            coinsSocket.close();
            energySocket.close();
        };
    }, [userId]);

    useEffect(() => {
        const energyRegenInterval = setInterval(() => {
            setEnergy((prevEnergy) => Math.min(prevEnergy + 1, MAX_ENERGY));
        }, ENERGY_REGEN_RATE);

        return () => {
            clearInterval(energyRegenInterval);
        };
    }, []);

    useEffect(() => {
        let autofarmInterval: NodeJS.Timeout | null = null;

        if (isAutofarmActive) {
            autofarmInterval = setInterval(() => {
                setBalance(prev => prev + 1);
                setFloatingNumbers(prev => [...prev, {
                    id: nextFloatingNumberId.current++,
                    value: 1,
                    x: Math.random() * 50,
                    y: Math.random() * 50
                }]);
            }, AUTOFARM_RATE);
        }

        return () => {
            if (autofarmInterval) {
                clearInterval(autofarmInterval);
            }
        };
    }, [isAutofarmActive]);

    useEffect(() => {
        const button = buttonRef.current;
        if (button) {
            button.addEventListener('touchstart', handleTouchStart as any);
            button.addEventListener('touchend', handleTouchEnd as any);
        }

        return () => {
            if (button) {
                button.removeEventListener('touchstart', handleTouchStart as any);
                button.removeEventListener('touchend', handleTouchEnd as any);
            }
        };
    }, [handleTouchStart, handleTouchEnd]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFloatingNumbers([]);
        }, 1000);

        return () => clearTimeout(timer);
    }, [floatingNumbers]);

    useEffect(() => {
        return () => {
            updateUserExitData(userId, balance, energy).catch((error) => {
                console.error('Error saving user data on exit:', error);
            });
        };
    }, [userId, balance, energy]);

    return (
        <div className="game">
            <div className="stats">
                <p>Баланс: {balance}</p>
                <div className="energy-bar">
                    <div className="energy-fill" style={{width: `${(energy / MAX_ENERGY) * 100}%`}}></div>
                    <p>Энергия: {energy}/{MAX_ENERGY}</p>
                </div>
            </div>
            <div className="fruit-container">
                <button
                    ref={buttonRef}
                    className={`fruit ${energy === 0 ? 'disabled' : ''} ${isPressed ? 'pressed' : ''}`}
                    disabled={energy === 0}
                >
                    🍎
                    {floatingNumbers.map(num => (
                        <span
                            key={num.id}
                            className="floating-number"
                            style={{
                                left: `${num.x}px`,
                                top: `${num.y}px`
                            }}
                        >
              +{num.value}
            </span>
                    ))}
                </button>
            </div>
            <button
                className={`autofarm-button ${isAutofarmActive ? 'active' : ''}`}
                onClick={toggleAutofarm}
            >
                {isAutofarmActive ? 'Выключить автофарм' : 'Включить автофарм'}
            </button>
        </div>
    );
};


