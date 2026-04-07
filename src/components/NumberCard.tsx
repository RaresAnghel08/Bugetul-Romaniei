interface NumberCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export const NumberCard = ({ title, value, subtitle }: NumberCardProps) => {
  return (
    <article className="number-card reveal-on-load">
      <p className="number-card-title">{title}</p>
      <p className="number-card-value">{value}</p>
      {subtitle ? <p className="number-card-subtitle">{subtitle}</p> : null}
    </article>
  );
};
