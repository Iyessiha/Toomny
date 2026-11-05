import { TITLE_PREFIX, TITLE_REST_MAX, stripTitlePrefix } from "@/lib/service-title";

/**
 * Champ du titre d'une prestation : « Je vais » est affiché en dur, le prestataire ne saisit
 * que la suite. Le champ `title` envoyé au serveur contient la suite ; le serveur rajoute la phrase.
 */
export function TitleField({
  id,
  label,
  defaultTitle,
  placeholder,
  className,
  inputClassName,
}: {
  id: string;
  label: string;
  defaultTitle?: string;
  placeholder?: string;
  className?: string;
  inputClassName: string;
}) {
  const rest = defaultTitle ? stripTitlePrefix(defaultTitle) : "";
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="mt-1.5 flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--color-brand-500)]">
        <span className="flex items-center border-r border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
          {TITLE_PREFIX.trim()}
        </span>
        <input
          id={id}
          name="title"
          required
          maxLength={TITLE_REST_MAX}
          defaultValue={rest}
          placeholder={placeholder}
          className={`${inputClassName} min-w-0 flex-1 border-0 rounded-none focus:outline-none`}
        />
      </div>
    </div>
  );
}
