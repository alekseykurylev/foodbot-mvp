import { Logo } from "@/common/ui/logo";
import { Container } from "@/common/ui/container";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-sidebar-accent">
      <Container>
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-bold">FoodBot</span>
          </div>
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
        </div>
      </Container>
    </header>
  );
}
