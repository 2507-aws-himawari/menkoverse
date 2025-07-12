interface DeckBadgeProps {
  isRental: boolean;
}

export function DeckBadge({ isRental }: DeckBadgeProps) {
  if (!isRental) {
    return null;
  }

  return (
    <span
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
