interface ResultCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResultCard({ children, className = '' }: ResultCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
}
