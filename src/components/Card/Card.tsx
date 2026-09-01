import './Card.css';

export interface CardProps {
  /** Heading shown at the top of the card */
  title: string;
  /** Supporting copy */
  description: string;
  /** Optional eyebrow label above the title */
  eyebrow?: string;
}

/** Content card for grouping a title and short description */
export function Card({ title, description, eyebrow }: CardProps) {
  return (
    <article className="ui-card">
      {eyebrow ? <p className="ui-card__eyebrow">{eyebrow}</p> : null}
      <h3 className="ui-card__title">{title}</h3>
      <p className="ui-card__description">{description}</p>
    </article>
  );
}
