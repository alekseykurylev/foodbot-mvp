import { Logo } from "../logo";
import { Container } from "../ui/container";
import { MenuIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white">
      <Container>
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-bold">FoodBot</span>
          </div>
          <MenuIcon />
        </div>
      </Container>
    </header>
  );
}
