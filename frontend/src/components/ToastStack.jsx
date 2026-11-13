import { CheckCircle, X } from 'lucide-react'

function ToastStack({ toasts, onClose }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <CheckCircle size={18} />
          <span>{toast.message}</span>
          <button type="button" onClick={() => onClose(toast.id)} aria-label="Close notification">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
