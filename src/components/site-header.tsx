import { Link } from "@tanstack/react-router";
import { Scale, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useSiteImages } from "@/hooks/use-site-images";

const links = [
  { to: "/", label: "Home" },
  { to: "/individual-assignment", label: "Individual Assignment" },
  { to: "/group-assignment", label: "Group Assignment" },
  { to: "/register", label: "Student Registration" },
  { to: "/login", label: "Student Login" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const imgs = useSiteImages();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={imgs.logo ?? logo} alt="" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-primary">Simba Legal Academy</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Learn · Research · Submit</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-primary/10" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="rounded-md p-2 text-primary lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <nav className="flex flex-col p-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/5"
                activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-primary/10" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
