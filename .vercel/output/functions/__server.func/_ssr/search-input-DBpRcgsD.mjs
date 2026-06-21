import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./button-DHovwa_B.mjs";
import { h as Search, X } from "../_libs/lucide-react.mjs";
const SearchInput = reactExports.forwardRef(
  ({ className, containerClassName, onClear, value, ...props }, ref) => {
    const showClear = !!onClear && typeof value === "string" && value.length > 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("relative w-full max-w-[260px]", containerClassName), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref,
          value,
          ...props,
          className: cn(
            "h-8 w-full rounded-full bg-muted/60 pr-8 pl-8 text-xs",
            "placeholder:text-muted-foreground/70 text-foreground",
            "border-0 outline-none focus-visible:ring-2 focus-visible:ring-ring transition",
            className
          )
        }
      ),
      showClear && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onClear,
          className: "absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
          "aria-label": "נקה",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
        }
      )
    ] });
  }
);
SearchInput.displayName = "SearchInput";
export {
  SearchInput as S
};
