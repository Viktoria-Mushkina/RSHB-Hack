import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import scrollStyles from "../../../shared/styles/custom-scrollbar.module.css";
import styles from "./custom-select.module.css";

export type CustomSelectOption = { value: string; label: string };

export type CustomSelectGroup = {
  label?: string;
  options: CustomSelectOption[];
};

type DropdownPlacement = "bottom" | "top";

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  groups: CustomSelectGroup[];
  "aria-label": string;
  className?: string;
  triggerPrefix?: string;
  variant?: "dark" | "light";
  fitContent?: boolean;
  
  block?: boolean;
  
  placement?: "auto" | "bottom" | "top";
};

const DROPDOWN_ESTIMATE_PX = 240;

const SCROLL_OPTIONS_MIN = 9;

function labelFor(groups: CustomSelectGroup[], value: string): string {
  for (const g of groups) {
    const f = g.options.find((o) => o.value === value);
    if (f) return f.label;
  }
  return value;
}

export function CustomSelect({
  value,
  onChange,
  groups,
  "aria-label": ariaLabel,
  className,
  triggerPrefix,
  variant = "dark",
  fitContent = false,
  block = false,
  placement = "auto",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropPlacement, setDropPlacement] =
    useState<DropdownPlacement>("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    if (placement === "bottom") {
      setDropPlacement("bottom");
      return;
    }
    if (placement === "top") {
      setDropPlacement("top");
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownH =
      dropdownRef.current?.offsetHeight ?? DROPDOWN_ESTIMATE_PX;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    if (spaceBelow < dropdownH && spaceAbove > spaceBelow) {
      setDropPlacement("top");
    } else {
      setDropPlacement("bottom");
    }
  }, [open, placement, groups]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const display = labelFor(groups, value);
  const showPrefix = Boolean(triggerPrefix?.trim());
  const optionCount = useMemo(
    () => groups.reduce((n, g) => n + g.options.length, 0),
    [groups],
  );
  const needsScroll = optionCount >= SCROLL_OPTIONS_MIN;
  const scrollClass = needsScroll
    ? variant === "light"
      ? scrollStyles.scrollLight
      : scrollStyles.scrollDark
    : "";

  return (
    <div
      ref={rootRef}
      className={[
        styles.root,
        variant === "light" ? styles.rootLight : "",
        fitContent ? styles.rootFit : "",
        block ? styles.rootBlock : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.triggerText}>
          {showPrefix ? (
            <>
              <span className={styles.triggerPrefix}>{triggerPrefix}</span>
              <span className={styles.triggerColon} aria-hidden>
                :&#8194;
              </span>
              <span className={styles.triggerValue}>{display}</span>
            </>
          ) : (
            display
          )}
        </span>
        <span className={styles.chevron} aria-hidden />
      </button>
      {open ? (
        <div
          ref={dropdownRef}
          id={listId}
          className={[
            styles.dropdown,
            needsScroll ? styles.dropdownScrollable : styles.dropdownCompact,
            scrollClass,
            dropPlacement === "top" ? styles.dropdownUp : "",
          ].join(" ")}
          role="listbox"
        >
          {groups.map((g, gi) => (
            <div
              key={`grp-${gi}`}
              className={
                gi > 0 ? `${styles.group} ${styles.groupSep}` : styles.group
              }
            >
              {g.label ? (
                <div className={styles.groupLabel}>{g.label}</div>
              ) : null}
              <ul className={styles.list}>
                {g.options.map((o) => (
                  <li key={o.value} className={styles.item}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.value === value}
                      className={
                        o.value === value
                          ? `${styles.option} ${styles.optionActive}`
                          : styles.option
                      }
                      onClick={() => {
                        onChange(o.value);
                        close();
                      }}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
