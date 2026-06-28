import { Container } from "@/components/ui/container";
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex justify-center min-h-0 flex-1 flex-col">
      <Container>
        <Spinner className="size-8" />
      </Container>
    </div>
  );
}
