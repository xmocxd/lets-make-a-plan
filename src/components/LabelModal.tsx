interface LabelModalProps {
  text: string;
  onClose: () => void;
}

export function LabelModal({ text, onClose }: LabelModalProps) {
  return (
    <div className="label-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="label-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Planned item"
        onClick={(e) => e.stopPropagation()}
      >
        <p>{text}</p>
        <button type="button" className="btn secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
