export type ConnectionStatus = "unknown" | "connected" | "error";
interface Message {
    id: string;
    content: string;
    isAI: boolean;
    timestamp: Date;
}
interface UseConnectionStatusOptions {
    onConnectionChange?: (status: ConnectionStatus) => void;
    onAddMessage?: (message: Message) => void;
}
export declare function useConnectionStatus(options?: UseConnectionStatusOptions): {
    status: ConnectionStatus;
    testConnection: () => Promise<void>;
    cleanup: () => void;
};
export {};
