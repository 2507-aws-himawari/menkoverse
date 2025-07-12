interface DeckBadgeProps {
  isRental: boolean;
  className?: string;
}

export function DeckBadge({ isRental, className = '' }: DeckBadgeProps) {
  if (!isRental) {
    return null;
  }

  return (
    <span 
      className={`rental-deck-badge ${className}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        backgroundColor: '#ffa500',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginLeft: '8px'
      }}
    >
      レンタル
    </span>
  );
}
