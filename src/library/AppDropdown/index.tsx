"use client";

import "./appDropdown.scss";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export type AppDropdownOption = {
  value: string;
  label: string;
  description?: string;
};

export type AppDropdownProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppDropdownOption[];
  /** Non-interactive title at top of the menu (e.g. "Select branch") */
  listTitle?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  /** Minimum menu width (px); at least trigger width */
  menuMinWidth?: number;
  /** Custom trigger content; chevron added by default unless you include your own */
  renderTrigger?: (selected: AppDropdownOption | undefined, isOpen: boolean) => ReactNode;
  /** Show a first row that clears selection (value "") */
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Tighter padding for tables and dense UIs */
  variant?: "default" | "compact";
  /** Include checkmark column */
  showCheckmarks?: boolean;
};

type MenuRect = { top: number; left: number; width: number };

export default function AppDropdown({
  id,
  value,
  onChange,
  options,
  listTitle,
  placeholder = "Select…",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuMinWidth = 200,
  renderTrigger,
  allowEmpty = false,
  emptyLabel = "— None —",
  variant = "default",
  showCheckmarks = true,
}: AppDropdownProps) {
  const autoId = useId();
  const listboxId = id ?? `app-dropdown-${autoId}`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const isEmpty = !value;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(r.width, menuMinWidth);
    let top = r.bottom + 6;
    const left = r.left;
    const menuHeight = 320;
    if (typeof window !== "undefined" && top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, r.top - 6 - menuHeight);
    }
    setMenuRect({ top, left, width: w });
  }, [menuMinWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const ro = requestAnimationFrame(updateMenuPosition);
    return () => cancelAnimationFrame(ro);
  }, [open, updateMenuPosition, value, options.length]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      updateMenuPosition();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const compact = variant === "compact";

  const defaultTrigger = () => (
    <>
      <span className={`appDropdown-triggerText ${isEmpty ? "appDropdown-placeholder" : ""}`}>
        <span className="appDropdown-triggerLabel">{selected?.label ?? placeholder}</span>
        {selected?.description ? (
          <span className="appDropdown-triggerDesc">{selected.description}</span>
        ) : null}
      </span>
      <span className={`appDropdown-chevron ${open ? "isOpen" : ""}`} aria-hidden />
    </>
  );

  const menuContent = (
    <div
      ref={menuRef}
      id={`${listboxId}-listbox`}
      className={`appDropdown-menu ${compact ? "appDropdown-menu--compact" : ""}`}
      style={{
        top: menuRect.top,
        left: menuRect.left,
        width: menuRect.width,
      }}
      role="listbox"
      aria-labelledby={listboxId}
    >
      {listTitle ? <div className="appDropdown-listTitle">{listTitle}</div> : null}
      <div className="appDropdown-scroll">
        {allowEmpty ? (
          <button
            type="button"
            role="option"
            aria-selected={isEmpty}
            className={`appDropdown-item ${compact ? "appDropdown-item--compact" : ""} ${isEmpty ? "isSelected" : ""}`}
            onClick={() => pick("")}
          >
            {showCheckmarks ? (
              <span className="appDropdown-check">{isEmpty ? <Check size={16} strokeWidth={2.5} /> : null}</span>
            ) : null}
            <span className="appDropdown-itemBody">
              <span className="appDropdown-itemLabel">{emptyLabel}</span>
            </span>
          </button>
        ) : null}
        {options.map((opt) => {
          const isSel = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSel}
              className={`appDropdown-item ${compact ? "appDropdown-item--compact" : ""} ${isSel ? "isSelected" : ""}`}
              onClick={() => pick(opt.value)}
            >
              {showCheckmarks ? (
                <span className="appDropdown-check">
                  {isSel ? <Check size={16} strokeWidth={2.5} /> : null}
                </span>
              ) : null}
              <span className="appDropdown-itemBody">
                <span className="appDropdown-itemLabel">{opt.label}</span>
                {opt.description ? <span className="appDropdown-itemDesc">{opt.description}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`appDropdown ${className}`.trim()}>
      <button
        ref={triggerRef}
        id={listboxId}
        type="button"
        className={`appDropdown-trigger ${compact ? "appDropdown-trigger--compact" : ""} ${triggerClassName}`.trim()}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `${listboxId}-listbox` : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        {renderTrigger ? renderTrigger(selected, open) : defaultTrigger()}
      </button>
      {mounted && open ? createPortal(menuContent, document.body) : null}
    </div>
  );
}
