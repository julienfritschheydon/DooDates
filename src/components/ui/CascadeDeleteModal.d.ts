/**
 * CascadeDeleteModal Component
 * Modal de confirmation pour suppression en cascade avec validation i18n
 */
export interface CascadeItem {
    id: string;
    type: "conversation" | "poll";
    title: string;
}
export interface CascadeDeleteModalProps {
    /** Modal visibility */
    isOpen: boolean;
    /** Callback to close modal */
    onClose: () => void;
    /** Callback when deletion is confirmed */
    onConfirm: () => void;
    /** Items that will be deleted */
    items: CascadeItem[];
    /** Language for UI text */
    language?: "fr" | "en";
    /** Loading state during deletion */
    isDeleting?: boolean;
    /** Custom className */
    className?: string;
}
export declare function CascadeDeleteModal({ isOpen, onClose, onConfirm, items, language, isDeleting, className, }: CascadeDeleteModalProps): import("react/jsx-runtime").JSX.Element;
export default CascadeDeleteModal;
